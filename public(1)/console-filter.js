/**
 * Console Filter - إخفاء أخطاء Figma DevTools من Console
 * هذا السكريبت يعمل تلقائياً عند تحميل الصفحة
 */

(function() {
  'use strict';
  
  // حفظ الدوال الأصلية
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // عداد للأخطاء المخفية
  let hiddenErrors = 0;
  let hiddenWarnings = 0;
  
  /**
   * فحص إذا كان الخطأ من Figma
   */
  function isFigmaError(args) {
    const argsString = args.map(arg => String(arg)).join(' ');
    const stack = new Error().stack || '';
    
    return (
      argsString.includes('figma.com') ||
      argsString.includes('devtools_worker') ||
      argsString.includes('webpack-artifacts') ||
      stack.includes('figma.com') ||
      stack.includes('devtools_worker')
    );
  }
  
  /**
   * Console.error المخصص
   */
  console.error = function(...args) {
    if (isFigmaError(args)) {
      hiddenErrors++;
      // طباعة رسالة واضحة مرة واحدة فقط
      if (hiddenErrors === 1) {
        originalLog(
          '%c🔇 تم تف��يل فلتر أخطاء Figma',
          'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
        );
        originalLog(
          '%cℹ️ أخطاء Figma DevTools يتم إخفاؤها تلقائياً (لا تؤثر على تطبيقك)',
          'color: #64748b; font-style: italic;'
        );
      }
      return; // لا نطبع الخطأ
    }
    
    // أخطاء تطبيقك الحقيقية
    originalError.apply(console, args);
  };
  
  /**
   * Console.warn المخصص
   */
  console.warn = function(...args) {
    if (isFigmaError(args)) {
      hiddenWarnings++;
      return; // لا نطبع التحذير
    }
    
    // تحذيرات تطبيقك الحقيقية
    originalWarn.apply(console, args);
  };
  
  /**
   * معالج الأخطاء العامة
   */
  window.addEventListener('error', function(event) {
    if (event.filename && (
        event.filename.includes('figma.com') ||
        event.filename.includes('devtools_worker')
    )) {
      event.preventDefault(); // منع الخطأ من الظهور
      hiddenErrors++;
      return false;
    }
  }, true);
  
  /**
   * معالج Promise Rejections
   */
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason);
    if (reason.includes('figma') || reason.includes('devtools')) {
      event.preventDefault();
      hiddenWarnings++;
      return false;
    }
  });
  
  /**
   * طباعة إحصائيات عند الحاجة (اختياري)
   */
  window.__getFigmaErrorStats = function() {
    return {
      hiddenErrors,
      hiddenWarnings,
      total: hiddenErrors + hiddenWarnings
    };
  };
  
  /**
   * رسالة ترحيب
   */
  setTimeout(() => {
    originalLog(
      '%c🤖 روبوت الأتمتة الذكي',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: bold;'
    );
    originalLog(
      '%c✨ نظام شامل لأتمتة المهام على الويب',
      'color: #64748b; font-size: 12px; margin-top: 4px;'
    );
    originalLog('');
    originalLog('💡 نصيحة: استخدم محلل الأخطاء في التطبيق لرؤية الأخطاء الفعلية');
    originalLog('📊 للحصول على إحصائيات الأخطاء المخفية: __getFigmaErrorStats()');
    originalLog('');
  }, 1000);
  
})();
