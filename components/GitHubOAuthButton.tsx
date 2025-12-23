import { useState, useEffect } from 'react';
import { Github, CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

interface GitHubOAuthButtonProps {
  onSuccess: (token: string, user: GitHubUser) => void;
  onError?: (error: string) => void;
}

export function GitHubOAuthButton({ onSuccess, onError }: GitHubOAuthButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // الاستماع لرسائل من نافذة OAuth المنبثقة
    const handleMessage = (event: MessageEvent) => {
      // التحقق من origin للأمان
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'github-auth-success') {
        const { token, user } = event.data;
        
        setStatus('success');
        
        setTimeout(() => {
          onSuccess(token, user);
        }, 500);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onSuccess]);

  const handleLogin = () => {
    setStatus('loading');
    setErrorMessage('');

    // فتح نافذة منبثقة لـ OAuth
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      '/api/github/auth',
      'GitHub OAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );

    if (!popup) {
      setStatus('error');
      setErrorMessage('تم حظر النافذة المنبثقة. الرجاء السماح بالنوافذ المنبثقة.');
      onError?.('تم حظر النافذة المنبثقة');
      return;
    }

    // مراقبة إغلاق النافذة المنبثقة
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        
        // إذا تم الإغلاق بدون نجاح
        if (status === 'loading') {
          setStatus('idle');
        }
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleLogin}
        disabled={status === 'loading' || status === 'success'}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
      >
        {/* تأثير متحرك في الخلفية */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative flex items-center gap-3">
          {status === 'loading' && (
            <Loader className="w-5 h-5 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {(status === 'idle' || status === 'error') && (
            <Github className="w-5 h-5" />
          )}
          
          <span className="text-base">
            {status === 'loading' && 'جاري الاتصال...'}
            {status === 'success' && 'تم الربط بنجاح!'}
            {(status === 'idle' || status === 'error') && 'ربط مع GitHub'}
          </span>
        </div>
      </button>

      {status === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Github className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 text-sm text-blue-800">
            <p className="mb-2"><strong>كيف يعمل OAuth:</strong></p>
            <ol className="list-decimal mr-4 space-y-1">
              <li>اضغط على الزر أعلاه</li>
              <li>ستفتح نافذة GitHub للتصريح</li>
              <li>وافق على الصلاحيات المطلوبة</li>
              <li>سيتم الربط تلقائياً!</li>
            </ol>
            <p className="mt-3 text-xs text-blue-700">
              ✅ آمن ومُشفّر - لا نحفظ كلمة المرور
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="text-sm text-green-900">الآن OAuth يعمل! 🎉</h4>
        </div>
        <p className="text-xs text-green-700">
          الربط الحقيقي مع GitHub بضغطة زر واحدة - بدون الحاجة لإدخال Token يدوياً!
        </p>
      </div>
    </div>
  );
}
