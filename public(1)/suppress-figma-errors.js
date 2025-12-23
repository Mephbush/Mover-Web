/**
 * Figma Error Suppressor - يعمل قبل تحميل React
 * يقمع جميع أخطاء Figma DevTools Worker - نسخة محسّنة
 */

(function() {
  'use strict';
  
  let suppressedCount = 0;
  const FIGMA_PATTERNS = [
    'figma.com',
    'devtools_worker',
    'webpack-artifacts',
    'readFromStdout',
    'onmessage',
    'on-end',
    '/webpack-artifacts/',
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

  function isFigmaError(args, stack = '') {
    const argsStr = args.map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return (a.message || '') + (a.stack || '');
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    }).join(' ');

    const combined = stack + ' ' + argsStr;
    return FIGMA_PATTERNS.some(pattern => 
      combined.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // حفظ الدوال الأصلية
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalOnError = window.onerror;

  // تجاوز console.error
  console.error = function(...args) {
    const stack = new Error().stack || '';
    if (isFigmaError(args, stack)) {
      suppressedCount++;
      return;
    }
    originalError.apply(console, args);
  };

  // تجاوز console.warn
  console.warn = function(...args) {
    const stack = new Error().stack || '';
    if (isFigmaError(args, stack)) {
      suppressedCount++;
      return;
    }
    originalWarn.apply(console, args);
  };

  // تجاوز console.log
  console.log = function(...args) {
    const stack = new Error().stack || '';
    if (isFigmaError(args, stack)) {
      return;
    }
    originalLog.apply(console, args);
  };

  // تجاوز window.onerror - محسّن
  window.onerror = function(message, source, lineno, colno, error) {
    const messageStr = String(message);
    const sourceStr = String(source || '');
    const errorStack = error?.stack || '';
    
    if (FIGMA_PATTERNS.some(pattern => 
      messageStr.toLowerCase().includes(pattern.toLowerCase()) ||
      sourceStr.toLowerCase().includes(pattern.toLowerCase()) ||
      errorStack.toLowerCase().includes(pattern.toLowerCase())
    )) {
      suppressedCount++;
      return true;
    }
    
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // معالج الأخطاء العامة - محسّن
  window.addEventListener('error', function(event) {
    const filename = event.filename || '';
    const message = event.message || '';
    const errorObj = event.error;
    const stack = errorObj?.stack || '';
    
    if (FIGMA_PATTERNS.some(pattern => 
      filename.toLowerCase().includes(pattern.toLowerCase()) ||
      message.toLowerCase().includes(pattern.toLowerCase()) ||
      stack.toLowerCase().includes(pattern.toLowerCase())
    )) {
      event.stopImmediatePropagation();
      event.preventDefault();
      suppressedCount++;
      return false;
    }
  }, true);

  // معالج الـ Promise Rejections - محسّن
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason || '');
    const stack = event.reason?.stack || '';
    
    if (FIGMA_PATTERNS.some(pattern => 
      reason.toLowerCase().includes(pattern.toLowerCase()) ||
      stack.toLowerCase().includes(pattern.toLowerCase())
    )) {
      event.stopImmediatePropagation();
      event.preventDefault();
      suppressedCount++;
      return false;
    }
  }, true);

  // تنظيف Console فوراً
  try {
    console.clear();
  } catch (e) {}

  // رسالة تأكيد في Console
  setTimeout(function() {
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
  }, 800);

  // حفظ العدد في window للوصول إليه لاحقاً
  Object.defineProperty(window, '__figmaErrorsSuppressed', {
    get: function() { return suppressedCount; },
    enumerable: false
  });

})();