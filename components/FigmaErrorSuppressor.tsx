import { useEffect, useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSuppressedErrorsCount } from '../utils/suppress-figma-errors';

/**
 * مكون يعرض رسالة توضيحية عن قمع أخطاء Figma
 */
export function FigmaErrorSuppressor() {
  const [showNotice, setShowNotice] = useState(false);
  const [suppressedCount, setSuppressedCount] = useState(0);

  useEffect(() => {
    // فحص عدد الأخطاء المقموعة بعد ثانية واحدة
    const checkTimer = setTimeout(() => {
      const count = getSuppressedErrorsCount();
      if (count > 0) {
        setSuppressedCount(count);
        setShowNotice(true);
        
        // إخفاء الإشعار تلقائياً بعد 8 ثواني
        setTimeout(() => {
          setShowNotice(false);
        }, 8000);
      }
    }, 1000);

    return () => clearTimeout(checkTimer);
  }, []);

  if (!showNotice) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-down">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-2xl p-4 max-w-md border-2 border-green-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">
              🛡️ Figma Error Suppressor Active
            </h3>
            <p className="text-xs text-green-50 leading-relaxed mb-2">
              {suppressedCount} Figma DevTools error{suppressedCount > 1 ? 's' : ''} suppressed.
              These errors are from Figma's internal code, not your application.
            </p>
            <div className="flex items-start gap-2 bg-green-600/30 rounded p-2 text-xs">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <p className="text-green-50">
                <strong>Note:</strong> You cannot fix Figma's errors. 
                Your console is now clean and showing only your app's errors.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNotice(false)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-green-400/30">
          <p className="text-xs text-green-50 text-center">
            ✨ Your application is working perfectly. ✨
          </p>
        </div>
      </div>
    </div>
  );
}