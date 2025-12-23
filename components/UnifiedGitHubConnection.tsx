import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  Github,
  CheckCircle,
  XCircle,
  Loader,
  Key,
  Zap,
  Shield,
  Link2,
  Unlink,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Info,
  User,
  GitBranch,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { GitHubOAuthButton } from './GitHubOAuthButton';
import { toast } from 'sonner@2.0.3';

type ConnectionMethod = 'oauth' | 'token' | 'quick';

export function UnifiedGitHubConnection() {
  const {
    settings,
    connectGitHub,
    disconnectGitHub,
    syncWithGitHub,
    updateGitHubSettings,
    githubAPI,
  } = useApp();

  const [activeMethod, setActiveMethod] = useState<ConnectionMethod>('oauth');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const [tokenForm, setTokenForm] = useState({
    token: '',
    owner: '',
    repo: '',
  });

  const [quickForm, setQuickForm] = useState({
    owner: '',
    repo: '',
  });

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    user?: any;
  } | null>(null);

  useEffect(() => {
    if (settings.github.connected) {
      setTokenForm({
        token: settings.github.token || '',
        owner: settings.github.owner || '',
        repo: settings.github.repo || '',
      });
    }
  }, [settings.github]);

  const handleOAuthSuccess = async (token: string, user: any) => {
    setIsConnecting(true);
    setConnectionProgress(25);
    
    try {
      // حفظ التوكن
      await updateGitHubSettings({
        token,
        owner: user.login,
      });
      
      setConnectionProgress(50);
      
      // الاتصال
      const success = await connectGitHub(token, user.login, quickForm.repo || 'automation-tasks');
      
      setConnectionProgress(75);
      
      if (success) {
        setConnectionProgress(100);
        toast.success(`تم الربط بنجاح مع ${user.name || user.login}!`);
        setTestResult({
          success: true,
          message: 'تم الربط بنجاح',
          user,
        });
      } else {
        throw new Error('فشل الاتصال');
      }
    } catch (error: any) {
      toast.error('فشل الربط: ' + error.message);
      setTestResult({
        success: false,
        message: error.message,
      });
    } finally {
      setIsConnecting(false);
      setTimeout(() => setConnectionProgress(0), 2000);
    }
  };

  const handleOAuthError = (error: string) => {
    toast.error('خطأ OAuth: ' + error);
    setTestResult({
      success: false,
      message: error,
    });
  };

  const handleTokenConnect = async () => {
    if (!tokenForm.token || !tokenForm.owner || !tokenForm.repo) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsConnecting(true);
    setConnectionProgress(0);
    
    try {
      // اختبار التوكن أولاً
      setConnectionProgress(20);
      setTestResult(null);
      
      const testResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenForm.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      setConnectionProgress(40);

      if (!testResponse.ok) {
        throw new Error('توكن غير صالح أو منتهي الصلاحية');
      }

      const userData = await testResponse.json();
      
      setConnectionProgress(60);

      // حفظ الإعدادات
      await updateGitHubSettings({
        token: tokenForm.token,
        owner: tokenForm.owner,
        repo: tokenForm.repo,
      });

      setConnectionProgress(80);

      // الاتصال
      const success = await connectGitHub(
        tokenForm.token,
        tokenForm.owner,
        tokenForm.repo
      );

      setConnectionProgress(100);

      if (success) {
        toast.success(`تم الربط بنجاح مع ${userData.name || userData.login}!`);
        setTestResult({
          success: true,
          message: 'تم الربط بنجاح',
          user: userData,
        });
      } else {
        throw new Error('فشل الاتصال');
      }
    } catch (error: any) {
      toast.error('فشل الربط: ' + error.message);
      setTestResult({
        success: false,
        message: error.message,
      });
    } finally {
      setIsConnecting(false);
      setTimeout(() => setConnectionProgress(0), 2000);
    }
  };

  const handleQuickConnect = async () => {
    if (!quickForm.owner || !quickForm.repo) {
      toast.error('يرجى إدخال اسم المالك والمستودع');
      return;
    }

    toast.info('الربط السريع يتطلب توكن. الرجاء استخدام طريقة OAuth أو Token');
    setActiveMethod('oauth');
  };

  const handleDisconnect = async () => {
    if (!confirm('هل تريد قطع الاتصال مع GitHub؟')) return;

    try {
      await disconnectGitHub();
      setTokenForm({ token: '', owner: '', repo: '' });
      setQuickForm({ owner: '', repo: '' });
      setTestResult(null);
      toast.success('تم قطع الاتصال بنجاح');
    } catch (error: any) {
      toast.error('فشل قطع الاتصال: ' + error.message);
    }
  };

  const handleSync = async () => {
    try {
      await syncWithGitHub();
      toast.success('تمت المزامنة بنجاح');
    } catch (error: any) {
      toast.error('فشلت المزامنة: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('تم النسخ!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openGitHubTokenPage = () => {
    window.open(
      'https://github.com/settings/tokens/new?scopes=repo,workflow&description=Web%20Automation%20Bot',
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="flex items-center gap-2 mb-2">
            <Github className="w-8 h-8" />
            مركز ربط GitHub الموحد
          </h2>
          <p className="text-muted-foreground">
            جميع طرق الربط في مكان واحد - اختر الطريقة المناسبة لك
          </p>
        </div>
        
        {settings.github.connected && (
          <div className="flex gap-2">
            <Button onClick={handleSync} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              مزامنة
            </Button>
            <Button onClick={handleDisconnect} variant="destructive" size="sm">
              <Unlink className="w-4 h-4 mr-2" />
              قطع الاتصال
            </Button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {settings.github.connected ? (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              متصل بنجاح!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">المالك</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <p className="font-medium">{settings.github.owner}</p>
                </div>
              </div>
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">المستودع</p>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <p className="font-medium">{settings.github.repo}</p>
                </div>
              </div>
              <div className="p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">الرابط</p>
                <a
                  href={`https://github.com/${settings.github.owner}/${settings.github.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <span>عرض في GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {testResult?.user && (
              <div className="p-4 bg-white/80 rounded-lg">
                <h4 className="text-sm font-medium mb-2">معلومات الحساب</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">الاسم: </span>
                    <span>{testResult.user.name || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">اسم المستخدم: </span>
                    <span>{testResult.user.login}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">البريد: </span>
                    <span>{testResult.user.email || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المستودعات: </span>
                    <span>{testResult.user.public_repos || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connection Progress */}
          {isConnecting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>جاري الربط...</span>
                    <span>{connectionProgress}%</span>
                  </div>
                  <Progress value={connectionProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Methods */}
          <Card>
            <CardHeader>
              <CardTitle>اختر طريقة الربط</CardTitle>
              <CardDescription>
                ثلاث طرق مختلفة للربط - اختر الأنسب لك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as ConnectionMethod)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="oauth" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    OAuth (موصى به)
                  </TabsTrigger>
                  <TabsTrigger value="token" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Personal Token
                  </TabsTrigger>
                  <TabsTrigger value="quick" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    ربط سريع
                  </TabsTrigger>
                </TabsList>

                {/* OAuth Method */}
                <TabsContent value="oauth" className="space-y-4 mt-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      الطريقة الموصى بها - أسرع وأسهل طريقة للربط بضغطة زر واحدة
                    </AlertDescription>
                  </Alert>

                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-purple-900">
                        ربط تلقائي مع GitHub OAuth
                      </CardTitle>
                      <CardDescription className="text-purple-700">
                        اربط حسابك بضغطة زر واحدة - آمن وسريع ومباشر
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>اسم المستودع (اختياري)</Label>
                        <Input
                          placeholder="automation-tasks"
                          value={quickForm.repo}
                          onChange={(e) => setQuickForm({ ...quickForm, repo: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          سيتم إنشاء مستودع جديد إذا لم يكن موجوداً
                        </p>
                      </div>

                      <GitHubOAuthButton
                        onSuccess={handleOAuthSuccess}
                        onError={handleOAuthError}
                      />

                      <div className="bg-white/60 rounded-lg p-4 space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          لماذا OAuth؟
                        </h4>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          <li>✓ لا حاجة لإنشاء توكن يدوياً</li>
                          <li>✓ صلاحيات محددة تلقائياً</li>
                          <li>✓ آمن 100% - مباشر من GitHub</li>
                          <li>✓ سهل الإلغاء من إعدادات GitHub</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Token Method */}
                <TabsContent value="token" className="space-y-4 mt-4">
                  <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      يتطلب إنشاء Personal Access Token من GitHub
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>الربط بـ Personal Access Token</CardTitle>
                      <CardDescription>
                        طريقة تقليدية توفر تحكم كامل في الصلاحيات
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Step 1: Create Token */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>الخطوة 1: إنشاء Token</Label>
                          <Button onClick={openGitHubTokenPage} variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            فتح GitHub
                          </Button>
                        </div>
                        
                        <Alert>
                          <Key className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-medium">الصلاحيات المطلوبة:</p>
                              <ul className="text-sm space-y-1">
                                <li>• <code className="bg-slate-100 px-1 rounded">repo</code> - للوصول الكامل للمستودعات</li>
                                <li>• <code className="bg-slate-100 px-1 rounded">workflow</code> - لإدارة GitHub Actions</li>
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* Step 2: Enter Token */}
                      <div className="space-y-2">
                        <Label>الخطوة 2: أدخل Token</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            value={tokenForm.token}
                            onChange={(e) => setTokenForm({ ...tokenForm, token: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Step 3: Repository Info */}
                      <div className="space-y-2">
                        <Label>الخطوة 3: معلومات المستودع</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="username"
                            value={tokenForm.owner}
                            onChange={(e) => setTokenForm({ ...tokenForm, owner: e.target.value })}
                          />
                          <Input
                            placeholder="repository-name"
                            value={tokenForm.repo}
                            onChange={(e) => setTokenForm({ ...tokenForm, repo: e.target.value })}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          مثال: owner = "yourusername" | repo = "automation-tasks"
                        </p>
                      </div>

                      <Button
                        onClick={handleTokenConnect}
                        disabled={isConnecting || !tokenForm.token || !tokenForm.owner || !tokenForm.repo}
                        className="w-full"
                      >
                        {isConnecting ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            جاري الاتصال...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            ربط المستودع
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Quick Method */}
                <TabsContent value="quick" className="space-y-4 mt-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-900">
                      الربط السريع محدود - يُفضل استخدام OAuth للوصول الكامل
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>ربط سريع (للقراءة فقط)</CardTitle>
                      <CardDescription>
                        ربط سريع لقراءة المهام - لا يتطلب مصادقة
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>معلومات المستودع</Label>
                        <Input
                          placeholder="username"
                          value={quickForm.owner}
                          onChange={(e) => setQuickForm({ ...quickForm, owner: e.target.value })}
                        />
                        <Input
                          placeholder="repository-name"
                          value={quickForm.repo}
                          onChange={(e) => setQuickForm({ ...quickForm, repo: e.target.value })}
                        />
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">القيود:</p>
                            <ul className="space-y-1">
                              <li>• القراءة فقط (لا يمكن النشر أو التعديل)</li>
                              <li>• يعمل فقط مع المستودعات العامة</li>
                              <li>• محدود بعدد الطلبات في الساعة</li>
                            </ul>
                            <p className="mt-2 text-blue-600">
                              💡 يُنصح باستخدام OAuth للوصول الكامل
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleQuickConnect}
                        disabled={!quickForm.owner || !quickForm.repo}
                        variant="outline"
                        className="w-full"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        ربط (قراءة فقط)
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Test Result */}
      {testResult && !settings.github.connected && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">هل تحتاج مساعدة؟</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">أيهما أختار؟</h4>
              <ul className="space-y-1 text-blue-700">
                <li><strong>OAuth:</strong> للمبتدئين - سريع وسهل</li>
                <li><strong>Token:</strong> للمحترفين - تحكم كامل</li>
                <li><strong>Quick:</strong> للاستكشاف - محدود</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">نصائح الأمان</h4>
              <ul className="space-y-1 text-green-700 text-xs">
                <li>✓ لا تشارك التوكن مع أي شخص</li>
                <li>✓ استخدم صلاحيات محددة فقط</li>
                <li>✓ احذف التوكن عند عدم الحاجة</li>
                <li>✓ راقب نشاط الحساب بانتظام</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
