import { useState } from 'react';
import { Github, CheckCircle, AlertCircle, Loader, Copy, ExternalLink, Upload, Download, RefreshCw, ArrowRight, Info, GitBranch, GitPullRequest } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { GitHubTokenHelper } from './GitHubTokenHelper';
import { GitHubOAuthButton } from './GitHubOAuthButton';
import { DeployPreview, DeployFile } from './DeployPreview';
import { generateDeploymentFiles, deployFiles } from '../utils/github';
import { toast } from 'sonner';
import { GitHubTasksImporter } from './GitHubTasksImporter';

export function GitHubIntegration() {
  const { settings, tasks, connectGitHub, disconnectGitHub, syncWithGitHub, updateGitHubSettings, githubAPI } = useApp();
  const [formData, setFormData] = useState({
    owner: settings.github.owner,
    repo: settings.github.repo,
    token: settings.github.token,
    branch: settings.github.branch
  });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [deployProgress, setDeployProgress] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'token'>('oauth');
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<DeployFile[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // إعدادات النشر
  const [deploySettings, setDeploySettings] = useState({
    targetBranch: settings.github.targetBranch || '',
    createNewBranch: false,
    newBranchName: '',
    createPR: settings.github.createPR || false,
    baseBranch: settings.github.baseBranch || 'main'
  });

  const handleOAuthSuccess = async (token: string, user: any) => {
    console.log('🎉 OAuth Success!', user);
    
    setStatus('connecting');
    setMessage('🔗 جاري الاتصال باستخدام OAuth...');
    
    // تحديث formData بالـ token
    const newFormData = {
      ...formData,
      owner: user.login,
      token: token
    };
    
    setFormData(newFormData);
    
    try {
      const success = await connectGitHub(newFormData.owner, newFormData.repo || user.login + '-automation', newFormData.token);
      
      if (success) {
        setStatus('connected');
        setMessage(`✅ تم الربط بنجاح مع حساب ${user.name || user.login}!\n\n🔗 الرابط: https://github.com/${newFormData.owner}/${newFormData.repo}\n\n💡 يمكنك الآن نشر المهام إلى GitHub Actions`);
      } else {
        setStatus('error');
        setMessage('❌ فش الاتصال بسبب خطأ غير معروف');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ فشل الاتصال: ${error.message}`);
    }
  };

  const handleOAuthError = (error: string) => {
    setStatus('error');
    setMessage(`❌ خطأ في OAuth: ${error}`);
  };

  const handleConnect = async () => {
    if (!formData.owner || !formData.repo || !formData.token) {
      setStatus('error');
      setMessage('⚠️ الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    setStatus('connecting');
    setMessage('🔗 جاري الاتصال بـ GitHub API...\\nيتم التحقق من Token والمستودع...');

    try {
      await connectGitHub(formData.owner, formData.repo, formData.token);
      
      // إذا وصلنا هنا، الاتصال نجح
      setStatus('connected');
      setMessage(`✅ تم الاتصال بنجاح! المستودع جاهز للاستخدام\\n\\n🔗 الرابط: https://github.com/${formData.owner}/${formData.repo}\\n\\n💡 يمكنك الآن نشر المهام إلى GitHub Actions`);
      toast.success('تم الربط بنجاح!');
    } catch (error: any) {
      setStatus('error');
      
      // رسائل خطأ واضحة بالعربية
      let errorMsg = '❌ فشل الاتصال\\n\\n';
      
      if (error.message?.includes('Token is invalid') || error.message?.includes('Bad credentials')) {
        errorMsg += '🔑 Token غير صحيح أو منتهي الصلاحية\\n\\n';
        errorMsg += 'الحلول:\\n';
        errorMsg += '• تأكد من نسخ Token كاملاً\\n';
        errorMsg += '• تحقق من عدم انتهاء صلاحية Token\\n';
        errorMsg += '• أنشئ Token جديد من الزر أعلاه';
      } else if (error.message?.includes('Repository not found') || error.message?.includes('cannot create')) {
        errorMsg += '📦 المستودع غير موجود أو فشل إنشاؤه\\n\\n';
        errorMsg += 'الحلول:\\n';
        errorMsg += '• تحقق من اسم المستودع\\n';
        errorMsg += '• تأكد من أن Token لديه صلاحية إنشاء مستودعات (repo)\\n';
        errorMsg += '• أو أنشئ المستودع يدوياً على GitHub ثم حاول مرة أخرى';
      } else if (error.message?.includes('No write permission')) {
        errorMsg += '🔒 ليس لديك صلاحيات الكتابة\\n\\n';
        errorMsg += 'الحلول:\\n';
        errorMsg += '• تأكد من اختيار صلاحية \"repo\" عند إنشاء Token\\n';
        errorMsg += '• إذا كان المستودع لمنظمة، تحقق من صلاحياتك';
      } else if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        errorMsg += '🌐 مشكلة في الاتصال بالإنترنت\\n\\n';
        errorMsg += 'الحلول:\\n';
        errorMsg += '• تحقق من اتصالك بالإنترنت\\n';
        errorMsg += '• حاول مرة أخرى بعد قليل\\n';
        errorMsg += '• تأكد من أن GitHub غير محجوب';
      } else {
        errorMsg += `خطأ: ${error.message}\\n\\n`;
        errorMsg += 'جرب:\\n';
        errorMsg += '• تحديث الصفحة والمحاولة مرة أخرى\\n';
        errorMsg += '• التحقق من معلومات الاتصال\\n';
        errorMsg += '• إنشاء المستودع يدوياً على GitHub';
      }
      
      setMessage(errorMsg);
      toast.error('فشل الربط بـ GitHub');
    }
  };

  const handleDisconnect = () => {
    disconnectGitHub();
    setStatus('idle');
    setMessage('');
    setFormData({ owner: '', repo: '', token: '', branch: 'main' });
  };

  const handleSync = async () => {
    try {
      setMessage('جاري المزامنة...');
      await syncWithGitHub();
      setMessage('✅ تمت المزامنة بنجاح');
    } catch (error: any) {
      setMessage(`❌ خطأ في المزامنة: ${error.message}`);
    }
  };

  const handleDeploy = async () => {
    if (selectedTasks.length === 0) {
      setMessage('⚠️ الرجاء اختيار مهمة واحدة على الأقل');
      return;
    }

    try {
      const totalFiles = 6 + (selectedTasks.length * 2); // base files + (workflow + script) per task
      let uploadedFiles = 0;
      
      setMessage(`🚀 جاري النشر إلى GitHub...\n📦 سيتم رفع ${totalFiles} ملف`);
      setDeployProgress(`0/${totalFiles}`);
      
      // محاكاة تقدم الرفع (في الواقع، deployToGitHub يقوم بالعل)
      const progressInterval = setInterval(() => {
        uploadedFiles++;
        if (uploadedFiles <= totalFiles) {
          setDeployProgress(`${uploadedFiles}/${totalFiles}`);
          setMessage(`🚀 جاري النشر إلى GitHub...\n📤 رفع الملفات: ${uploadedFiles}/${totalFiles}\n⏳ قد يستغرق هذا دقيقة...`);
        }
      }, 800);
      
      await deployToGitHub(selectedTasks, deploySettings);
      
      clearInterval(progressInterval);
      setDeployProgress('');
      
      setMessage(`🎉 تم النشر بنجاح!\n\n✅ تم رفع ${totalFiles} ملف إلى GitHub\n📋 ${selectedTasks.length} مهمة جاهزة للتشغيل\n\n🔗 افتح المستودع: https://github.com/${settings.github.owner}/${settings.github.repo}\n🎬 شغّل من: https://github.com/${settings.github.owner}/${settings.github.repo}/actions`);
      setSelectedTasks([]);
    } catch (error: any) {
      setDeployProgress('');
      setMessage(`❌ خطأ في لنشر: ${error.message}\n\nجرب:\n• تحقق من اتصال الإنترنت\n• تأكد من صلاحيات Token\n• حاول مرة أخرى`);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    setSelectedTasks(tasks.map(t => t.id));
  };

  const deselectAllTasks = () => {
    setSelectedTasks([]);
  };

  const handlePreview = () => {
    if (selectedTasks.length === 0) {
      setMessage('⚠️ الرجاء اختيار مهمة واحدة على الأقل');
      return;
    }

    const tasksToGenerate = tasks.filter(t => selectedTasks.includes(t.id));
    const files = generateDeploymentFiles(tasksToGenerate, settings.stealth);
    setPreviewFiles(files);
    setShowPreview(true);
  };

  const handleDeployWithPreview = async () => {
    if (selectedTasks.length === 0) {
      setMessage('⚠️ الرجاء اختيار مهمة واحدة على الأقل');
      return;
    }

    if (!githubAPI) {
      setMessage('❌ خطأ: لا يوجد اتصال بـ GitHub');
      return;
    }

    setLoading(true);
    
    try {
      const tasksToGenerate = tasks.filter(t => selectedTasks.includes(t.id));
      const files = generateDeploymentFiles(tasksToGenerate, settings.stealth);
      
      setMessage(`🚀 جاري النشر إلى GitHub...\\n📦 رفع ${files.length} ملف...`);
      
      await deployFiles(githubAPI, files);
      
      setMessage(`🎉 تم النشر بنجاح!\\n\\n✅ تم رفع ${files.length} ملف إلى GitHub\\n📋 ${selectedTasks.length} مهمة جاهزة للتشغيل\\n\\n🔗 افتح المستودع: https://github.com/${settings.github.owner}/${settings.github.repo}\\n🎬 شغّل من: https://github.com/${settings.github.owner}/${settings.github.repo}/actions`);
      setSelectedTasks([]);
    } catch (error: any) {
      setMessage(`❌ خطأ في النشر: ${error.message}\\n\\nجرب:\\n• تحقق من اتصال الإنترنت\\n• تأكد من صلاحيات Token\\n• حاول مرة أخرى`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeploy = async (editedFiles: DeployFile[]) => {
    if (!githubAPI) {
      setMessage('❌ خطأ: لا يوجد اتصال بـ GitHub');
      return;
    }

    setIsDeploying(true);
    
    try {
      setMessage(`🚀 جاري النشر إلى GitHub...\\\\n📦 رفع ${editedFiles.length} ملف...`);
      
      await deployFiles(githubAPI, editedFiles);
      
      setShowPreview(false);
      setMessage(`🎉 تم النشر بناح!\\\\n\\\\n✅ تم رفع ${editedFiles.length} ملف إلى GitHub\\\\n📋 ${selectedTasks.length} مهمة جاهزة للتشغيل\\\\n\\\\n🔗 افتح المستودع: https://github.com/${settings.github.owner}/${settings.github.repo}\\\\n🎬 شغّل من: https://github.com/${settings.github.owner}/${settings.github.repo}/actions`);
      setSelectedTasks([]);
    } catch (error: any) {
      setMessage(`❌ خطأ في النشر: ${error.message}\\\\n\\\\nجرب:\\\\n• تحقق من اتصال الإنترنت\\\\n• تأكد من صلاحيات Token\\\\n• حاول مرة أخرى`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl mb-3 flex items-center gap-2">
          <Github className="w-8 h-8" />
          <span>ربط GitHub - اتصال حقيقي</span>
        </h2>
        <p className="mb-4 opacity-90">
          هذا الربط حقيقي 100% مع GitHub API. سيتم إنشاء أو تحديث مستودعك تلقائياً مع جميع الملفات المطلوبة.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>GitHub API v3</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>OAuth 2.0</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>مشفر وآمن</span>
          </div>
        </div>
      </div>

      {/* Connection Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Github className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl">ربط المستودع</h2>
              <p className="text-sm text-slate-600">ربط حقيقي مع GitHub API</p>
            </div>
          </div>
          
          {!settings.github.connected && (
            <button
              onClick={() => setShowTokenHelp(!showTokenHelp)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>كيف أحصل على Token؟</span>
            </button>
          )}
        </div>

        {/* Token Help */}
        {showTokenHelp && !settings.github.connected && (
          <GitHubTokenHelper />
        )}

        {!settings.github.connected ? (
          <div className="space-y-6">
            {/* OAuth vs Token Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setAuthMethod('oauth')}
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  authMethod === 'oauth'
                    ? 'bg-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🚀 OAuth (موصى به)
              </button>
              <button
                onClick={() => setAuthMethod('token')}
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  authMethod === 'token'
                    ? 'bg-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔑 Personal Access Token
              </button>
            </div>

            {/* OAuth Method */}
            {authMethod === 'oauth' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg mb-2 text-blue-900">ربط سريع مع GitHub OAuth</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    اربط حسابك بضغطة زر واحدة - آمن وسريع!
                  </p>
                  <GitHubOAuthButton 
                    onSuccess={handleOAuthSuccess}
                    onError={handleOAuthError}
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>ملاحظة:</strong> يتطلب OAuth نشر المشروع على Vercel أو استضافة مماثلة.
                    راجع <code className="bg-yellow-100 px-1 rounded">VERCEL_SETUP.md</code> للإرشادات الكاملة.
                  </p>
                </div>
              </div>
            )}

            {/* Token Method */}
            {authMethod === 'token' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">
                      اسم المالك (Owner) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="username أو organization"
                    />
                    <p className="mt-1 text-xs text-slate-500">اسم حسابك على GitHub</p>
                  </div>

                  <div>
                    <label className="block mb-2">
                      اسم المستودع (Repository) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.repo}
                      onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="automation-bot"
                    />
                    <p className="mt-1 text-xs text-slate-500">سيُنشأ إذا لم يكن موجوداً</p>
                  </div>
                </div>

                <div>
                  <label className="block mb-2">
                    Personal Access Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=Web%20Automation%20Bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <span>إنشاء Token جديد</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">الصلاحيات: repo + workflow</span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2">الفرع (Branch)</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="main"
                  />
                  <p className="mt-1 text-xs text-slate-500">الفرع الافتراضي: main</p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleConnect}
                    disabled={status === 'connecting' || !formData.owner || !formData.repo || !formData.token}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>جاري الاتصال مع GitHub API...</span>
                      </>
                    ) : (
                      <>
                        <Github className="w-5 h-5" />
                        <span>الاتصال بـ GitHub</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-900">متصل بـ GitHub</span>
              </div>
              <div className="text-sm text-green-700">
                <p>الستودع: <code className="bg-green-100 px-2 py-0.5 rounded">{settings.github.owner}/{settings.github.repo}</code></p>
                <p>الفرع: <code className="bg-green-100 px-2 py-0.5 rounded">{settings.github.branch}</code></p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>مزامنة</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                قطع الاتصال
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('✅') || message.includes('🎉') ? 'bg-green-50 border border-green-200' :
            message.includes('❌') || message.includes('⚠️') ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`whitespace-pre-wrap text-sm ${
              message.includes('✅') || message.includes('🎉') ? 'text-green-800' :
              message.includes('❌') || message.includes('⚠️') ? 'text-red-800' :
              'text-blue-800'
            }`}>{message}</p>
          </div>
        )}
      </div>

      {/* Deploy Section */}
      {settings.github.connected && tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl">نشر المهام إلى GitHub Actions</h3>
            <a
              href={`https://github.com/${settings.github.owner}/${settings.github.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span>تح المستودع</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="mb-2 flex items-center gap-2 text-purple-900">
              <Info className="w-4 h-4" />
              <span>ماذا سيحدث عند النشر؟</span>
            </h4>
            <ul className="text-sm text-purple-800 space-y-1 mr-5 list-disc">
              <li>سيتم إنشاء Workflow منفصل لكل مهمة في <code className="bg-purple-100 px-1 rounded">.github/workflows/</code></li>
              <li>سيتم إنشاء سكريبت منفصل لكل مهمة مع إعدادات Stealth المُفعّلة</li>
              <li>سيتم رفع ملف <code className="bg-purple-100 px-1 rounded">package.json</code> مع جميع التبعيات</li>
              <li>سيتم تفعيل GitHub Actions تلقائياً</li>
              <li>المهام ستعمل حسب الجدول المحدد أو يدوياً من Actions</li>
            </ul>
          </div>
          
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {selectedTasks.length} من {tasks.length} محددة
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAllTasks}
                className="text-sm text-blue-600 hover:underline"
              >
                تحديد الكل
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAllTasks}
                className="text-sm text-slate-600 hover:underline"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {tasks.map(task => (
              <label
                key={task.id}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{task.name}</p>
                  <p className="text-sm text-slate-500">{task.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  task.type === 'scraping' ? 'bg-blue-100 text-blue-700' :
                  task.type === 'login' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {task.type}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={selectedTasks.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري النشر...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>معاينة النشر ({selectedTasks.length})</span>
                </>
              )}
            </button>
            <button
              onClick={handleDeployWithPreview}
              disabled={loading || selectedTasks.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري النشر...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>نشر إلى GitHub ({selectedTasks.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Deploy Preview */}
      {showPreview && (
        <DeployPreview
          files={previewFiles}
          onConfirm={handleConfirmDeploy}
          onCancel={() => setShowPreview(false)}
          isDeploying={isDeploying}
        />
      )}

      {/* GitHub Tasks Importer */}
      {settings.github.connected && (
        <GitHubTasksImporter />
      )}
    </div>
  );
}