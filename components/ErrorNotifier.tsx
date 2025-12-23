import { useEffect, useState } from 'react';
import { errorTracker, AppError } from '../utils/error-tracker';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';

export function ErrorNotifier() {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    // الاشتراك في الأخطاء الجديدة
    const unsubscribe = errorTracker.subscribe((error) => {
      // عرض الإشعارات فقط للأخطاء المهمة
      if (error.severity === 'high' || error.severity === 'critical') {
        setErrors(prev => [...prev, error]);

        // إزالة الإشعار بعد 10 ثوان
        setTimeout(() => {
          setErrors(prev => prev.filter(e => e.id !== error.id));
        }, 10000);
      }
    });

    return unsubscribe;
  }, []);

  const dismissError = (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 space-y-3 max-w-md" dir="rtl">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`bg-white rounded-lg shadow-lg border-r-4 p-4 animate-slide-in-left ${
            error.severity === 'critical'
              ? 'border-red-600'
              : 'border-orange-600'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                error.severity === 'critical'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-orange-100 text-orange-600'
              }`}
            >
              {error.severity === 'critical' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">
                  {error.category === 'task-execution' && 'خطأ في تنفيذ المهمة'}
                  {error.category === 'github-api' && 'خطأ في GitHub'}
                  {error.category === 'network' && 'خطأ في الشبكة'}
                  {error.category === 'browser' && 'خطأ في المتصفح'}
                  {error.category === 'system' && 'خطأ في النظام'}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    error.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {error.severity === 'critical' ? 'حرج' : 'مهم'}
                </span>
              </div>

              <p className="text-sm text-slate-700 mb-2">{error.message}</p>

              {error.context?.taskName && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Info className="w-3 h-3" />
                  <span>المهمة: {error.context.taskName}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => dismissError(error.id)}
              className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
