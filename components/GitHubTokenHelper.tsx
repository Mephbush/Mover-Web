import { ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function GitHubTokenHelper() {
  const [copied, setCopied] = useState(false);

  const GITHUB_TOKEN_URL = 'https://github.com/settings/tokens/new?description=Web%20Automation%20Bot&scopes=repo,workflow';

  const handleCopyScopes = () => {
    navigator.clipboard.writeText('repo, workflow');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGitHub = () => {
    window.open(GITHUB_TOKEN_URL, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <AlertCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg mb-2 text-blue-900">كيفية إنشاء Personal Access Token</h3>
          <p className="text-sm text-blue-700">
            لربط المشروع مع GitHub، تحتاج إلى إنشاء Token للمصادقة
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</div>
            <h4 className="text-sm">افتح صفحة إنشاء Token</h4>
          </div>
          <button
            onClick={handleOpenGitHub}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-5 h-5" />
            <span>إنشاء Token على GitHub</span>
          </button>
          <p className="text-xs text-slate-600 mt-2 text-right">
            سيفتح في نافذة جديدة مع الصلاحيات المطلوبة محددة مسبقاً
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</div>
            <h4 className="text-sm">تأكد من الصلاحيات المطلوبة</h4>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-3 py-1 rounded border border-slate-300">
                  repo
                </code>
                <code className="text-sm bg-white px-3 py-1 rounded border border-slate-300">
                  workflow
                </code>
              </div>
              <button
                onClick={handleCopyScopes}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600">
              ✅ <strong>repo</strong>: للوصول الكامل للمستودعات<br/>
              ✅ <strong>workflow</strong>: لتشغيل GitHub Actions
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</div>
            <h4 className="text-sm">حدد مدة صلاحية Token</h4>
          </div>
          <div className="text-sm text-slate-700 mt-2 space-y-1">
            <p>• <strong>موصى به:</strong> 90 يوم</p>
            <p>• <strong>للتطوير:</strong> 30 يوم</p>
            <p>• <strong>دائم:</strong> No expiration (غير آمن)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</div>
            <h4 className="text-sm">اضغط "Generate token"</h4>
          </div>
          <p className="text-sm text-slate-700 mt-2">
            انسخ الـ Token فوراً (لن تتمكن من رؤيته مرة أخرى!) والصقه في الحقل أعلاه
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="mb-1"><strong>تنبيه أمني:</strong></p>
            <ul className="list-disc mr-4 space-y-1">
              <li>لا تشارك Token مع أحد</li>
              <li>لا تحفظه في أماكن عامة (GitHub, etc.)</li>
              <li>إذا تسرب، احذفه فوراً من <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">هنا</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white border-2 border-dashed border-blue-300 rounded-lg p-4">
        <h4 className="text-sm mb-2 text-blue-900">💡 لماذا لا يوجد "Login with GitHub"؟</h4>
        <p className="text-xs text-slate-700 leading-relaxed">
          ربط OAuth الحقيقي (مثل "Login with GitHub") يتطلب <strong>Backend Server</strong> لحفظ Client Secret بشكل آمن. 
          هذا المشروع يعمل بالكامل في المتصفح (Frontend فقط) لذا نستخدم Personal Access Token كبديل آمن وفعال.
        </p>
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs text-blue-700">
            <strong>ملاحظة:</strong> إذا كنت تريد OAuth حقيقي، ستحتاج إلى:
          </p>
          <ul className="list-disc mr-4 mt-1 text-xs text-slate-600 space-y-0.5">
            <li>استضافة Backend منفصل (Node.js, Python, etc.)</li>
            <li>Domain ثابت مع HTTPS</li>
            <li>GitHub OAuth App مع Client Secret</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
