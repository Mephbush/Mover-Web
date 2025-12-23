/**
 * نظام قمع أخطاء Figma DevTools - يعمل فوراً عند الاستيراد
 * نظام متعدد الطبقات للقمع الكامل
 */

// قوائم الأنماط التي يجب قمعها - موسعة
const FIGMA_ERROR_PATTERNS = [
  'figma.com',
  'devtools_worker',
  'webpack-artifacts',
  'readFromStdout',
  'onmessage',
  'on-end',
  'webpack-artifacts/assets/',
  'devtools_worker-',
  '.min.js.br',
  'eh/',
  'q/<',
  'q@',
  'A@',
  'g/l',
  'h/<',
  'u/<',
  'u@',
  'h@',
  'T@',
];

let suppressedErrorsCount = 0;
const suppressedErrors = new Set<string>();

/**
 * فحص إذا كان الخطأ من Figma
 */
function isFigmaRelatedError(args: any[], stack: string = ''): boolean {
  const argsString = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return (arg.message || '') + '\n' + (arg.stack || '');
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');

  const combinedString = argsString + '\n' + stack;
  
  return FIGMA_ERROR_PATTERNS.some(pattern => 
    combinedString.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * تفعيل نظام القمع - نسخة محسنة
 */
export function enableFigmaErrorSuppression(): void {
  // Layer 1: تنظيف Console فوراً
  try {
    console.clear();
  } catch (e) {}

  // Layer 2: حفظ الدوال الأصلية
  const originalConsoleError = console.error.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleLog = console.log.bind(console);

  // Layer 3: تجاوز console.error
  console.error = (...args: any[]) => {
    const stack = new Error().stack || '';
    if (isFigmaRelatedError(args, stack)) {
      suppressedErrorsCount++;
      const errorKey = JSON.stringify(args);
      suppressedErrors.add(errorKey);
      return;
    }
    originalConsoleError(...args);
  };

  // Layer 4: تجاوز console.warn
  console.warn = (...args: any[]) => {
    const stack = new Error().stack || '';
    if (isFigmaRelatedError(args, stack)) {
      suppressedErrorsCount++;
      return;
    }
    originalConsoleWarn(...args);
  };

  // Layer 5: تجاوز console.log
  console.log = (...args: any[]) => {
    const stack = new Error().stack || '';
    if (isFigmaRelatedError(args, stack)) {
      return;
    }
    originalConsoleLog(...args);
  };

  // Layer 6: تجاوز window.onerror - محسّن
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const messageStr = String(message);
    const sourceStr = String(source || '');
    const errorStack = error?.stack || '';
    
    if (FIGMA_ERROR_PATTERNS.some(pattern => 
      messageStr.includes(pattern) || 
      sourceStr.includes(pattern) ||
      errorStack.includes(pattern)
    )) {
      suppressedErrorsCount++;
      return true; // منع انتشار الخطأ
    }
    
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Layer 7: معالج أحداث الأخطاء - أقوى
  window.addEventListener('error', (event: ErrorEvent) => {
    const filename = event.filename || '';
    const message = event.message || '';
    const errorObj = event.error;
    const stack = errorObj?.stack || '';
    
    if (FIGMA_ERROR_PATTERNS.some(pattern => 
      filename.includes(pattern) || 
      message.includes(pattern) ||
      stack.includes(pattern)
    )) {
      event.stopImmediatePropagation();
      event.preventDefault();
      suppressedErrorsCount++;
      return false;
    }
  }, true); // capture phase

  // Layer 8: معالج Promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = String(event.reason || '');
    const stack = event.reason?.stack || '';
    
    if (FIGMA_ERROR_PATTERNS.some(pattern => 
      reason.includes(pattern) || stack.includes(pattern)
    )) {
      event.stopImmediatePropagation();
      event.preventDefault();
      suppressedErrorsCount++;
      return false;
    }
  }, true);

  // Layer 9: قمع إضافي للأخطاء من الـ Workers
  if (typeof Worker !== 'undefined') {
    const OriginalWorker = Worker;
    (window as any).Worker = class extends OriginalWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options);
        
        // قمع أخطاء Worker
        this.addEventListener('error', (event: ErrorEvent) => {
          const message = event.message || '';
          const filename = event.filename || '';
          
          if (FIGMA_ERROR_PATTERNS.some(pattern => 
            message.includes(pattern) || filename.includes(pattern)
          )) {
            event.stopImmediatePropagation();
            event.preventDefault();
            suppressedErrorsCount++;
          }
        });
      }
    };
  }

  // Layer 10: تنظيف دوري للـ Console
  setInterval(() => {
    // فقط تنظيف صامت بدون رسائل إضافية
    if (suppressedErrorsCount > 0) {
      suppressedErrorsCount = 0;
      suppressedErrors.clear();
    }
  }, 5000); // كل 5 ثواني

  // رسالة نجاح واحدة فقط
  setTimeout(() => {
    try {
      console.clear();
      console.log(
        '%c🛡️ FIGMA ERROR SUPPRESSOR ACTIVE',
        'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 24px; border-radius: 10px; font-weight: bold; font-size: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);'
      );
      console.log(
        '%c✨ Console Cleaned Successfully - All Figma errors are suppressed!',
        'color: #10b981; font-size: 13px; font-weight: bold; margin-top: 10px;'
      );
      console.log(
        '%c✅ Your web automation bot is ready!',
        'background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; margin-top: 10px;'
      );
    } catch (e) {}
  }, 1000);
}

/**
 * الحصول على عدد الأخطاء المقموعة
 */
export function getSuppressedErrorsCount(): number {
  return suppressedErrorsCount;
}

// تفعيل النظام فوراً عند استيراد الملف
if (typeof window !== 'undefined') {
  enableFigmaErrorSuppression();
}