/**
 * نظام متقدم للتعامل مع الأخطاء والفشل
 * - فهم عميق للأخطاء
 * - تصحيح تلقائي ذكي
 * - مرونة في التعديل
 * - استراتيجيات إعادة المحاولة
 */

export interface ErrorContext {
  task: any;
  action: string;
  url?: string;
  selector?: string;
  element?: any;
  screenshot?: string;
  logs: string[];
  timestamp: Date;
}

export interface ErrorAnalysis {
  type: 'selector' | 'network' | 'timeout' | 'authentication' | 'captcha' | 'element_not_interactive' | 'navigation' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedFixes: string[];
  autoFixable: boolean;
  retryStrategy?: RetryStrategy;
}

export interface RetryStrategy {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  shouldRetry: (attempt: number, error: any) => boolean;
}

export interface Fix {
  description: string;
  apply: (context: ErrorContext) => Promise<any>;
  confidence: number; // 0-1
}

/**
 * محلل الأخطاء الذكي
 */
export class SmartErrorAnalyzer {
  
  /**
   * تحليل الخطأ وتحديد نوعه ودرجة خطورته
   */
  static analyze(error: any, context: ErrorContext): ErrorAnalysis {
    const errorMessage = error.message || error.toString();
    
    // تحليل أخطاء Selectors
    if (this.isSelectorError(errorMessage)) {
      return this.analyzeSelectorError(error, context);
    }
    
    // تحليل أخطاء الشبكة
    if (this.isNetworkError(errorMessage)) {
      return this.analyzeNetworkError(error, context);
    }
    
    // تحليل أخطاء Timeout
    if (this.isTimeoutError(errorMessage)) {
      return this.analyzeTimeoutError(error, context);
    }
    
    // تحليل أخطاء المصادقة
    if (this.isAuthenticationError(errorMessage, context)) {
      return this.analyzeAuthenticationError(error, context);
    }
    
    // تحليل Captcha
    if (this.isCaptchaError(errorMessage, context)) {
      return this.analyzeCaptchaError(error, context);
    }
    
    // تحليل أخطاء التفاعل مع Elements
    if (this.isElementNotInteractiveError(errorMessage)) {
      return this.analyzeElementInteractionError(error, context);
    }
    
    // تحليل أخطاء Navigation
    if (this.isNavigationError(errorMessage)) {
      return this.analyzeNavigationError(error, context);
    }
    
    // خطأ غير معروف
    return this.analyzeUnknownError(error, context);
  }
  
  // ========== تحليل أنواع الأخطاء المختلفة ==========
  
  private static analyzeSelectorError(error: any, context: ErrorContext): ErrorAnalysis {
    const selector = context.selector || 'unknown';
    
    return {
      type: 'selector',
      severity: 'medium',
      message: `لم يتم العثور على العنصر: ${selector}`,
      suggestedFixes: [
        `جرب selector بديل: ${this.suggestAlternativeSelector(selector)}`,
        'تأكد من تحميل الصفحة بالكامل قبل البحث عن العنصر',
        'قد يكون العنصر داخل iframe',
        'قد يكون العنصر يحمّل ديناميكياً عبر JavaScript',
        'استخدم waitForSelector مع timeout أطول'
      ],
      autoFixable: true,
      retryStrategy: {
        maxAttempts: 5,
        delayMs: 2000,
        backoffMultiplier: 1.5,
        shouldRetry: (attempt) => attempt < 3
      }
    };
  }
  
  private static analyzeNetworkError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'network',
      severity: 'high',
      message: 'فشل الاتصال بالموقع',
      suggestedFixes: [
        'تحقق من اتصال الإنترنت',
        'الموقع قد يكون معطلاً مؤقتاً',
        'قد يكون الموقع يحظر طلبات الروبوتات',
        'جرب استخدام VPN أو Proxy',
        'تحقق من إعدادات Firewall'
      ],
      autoFixable: false,
      retryStrategy: {
        maxAttempts: 3,
        delayMs: 5000,
        backoffMultiplier: 2,
        shouldRetry: (attempt) => attempt < 2
      }
    };
  }
  
  private static analyzeTimeoutError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'timeout',
      severity: 'medium',
      message: 'انتهت مهلة الانتظار',
      suggestedFixes: [
        'زد timeout في إعدادات المهمة',
        'الصفحة قد تكون بطيئة في التحميل',
        'قد يكون هناك عناصر تحمّل ببطء',
        'جرب تعطيل الصور لتسريع التحميل',
        'تحقق من سرعة الإنترنت'
      ],
      autoFixable: true,
      retryStrategy: {
        maxAttempts: 3,
        delayMs: 3000,
        backoffMultiplier: 1.5,
        shouldRetry: (attempt) => attempt < 2
      }
    };
  }
  
  private static analyzeAuthenticationError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'authentication',
      severity: 'critical',
      message: 'فشل تسجيل الدخول',
      suggestedFixes: [
        'تحقق من صحة بيانات تسجيل الدخول',
        'قد يكون الموقع غيّر نموذج تسجيل الدخول',
        'قد يتطلب الموقع Captcha',
        'قد يتطلب الموقع 2FA (Two-Factor Authentication)',
        'الحساب قد يكون مقفلاً أو محظوراً'
      ],
      autoFixable: false,
      retryStrategy: {
        maxAttempts: 2,
        delayMs: 10000,
        backoffMultiplier: 1,
        shouldRetry: () => false // لا نعيد في حالة فشل المصادقة
      }
    };
  }
  
  private static analyzeCaptchaError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'captcha',
      severity: 'high',
      message: 'تم اكتشاف Captcha',
      suggestedFixes: [
        'قد تحتاج لحل Captcha يدوياً',
        'استخدم خدمة حل Captcha (مثل 2Captcha)',
        'حسّن إعدادات Stealth لتجنب اكتشاف الروبوت',
        'جرب استخدام متصفح حقيقي بدلاً من headless',
        'أضف تأخيرات عشوائية لمحاكاة السلوك البشري'
      ],
      autoFixable: false,
      retryStrategy: {
        maxAttempts: 1,
        delayMs: 30000,
        backoffMultiplier: 1,
        shouldRetry: () => false
      }
    };
  }
  
  private static analyzeElementInteractionError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'element_not_interactive',
      severity: 'medium',
      message: 'العنصر غير قابل للتفاعل',
      suggestedFixes: [
        'العنصر قد يكون مخفياً أو غير مرئي',
        'قد يكون هناك عنصر آخر يغطي العنصر المستهدف',
        'انتظر حتى يصبح العنصر مرئياً قبل التفاعل',
        'استخدم scrollIntoView لتحريك الشاشة للعنصر',
        'جرب النقر باستخدام JavaScript بدلاً من click() العادي'
      ],
      autoFixable: true,
      retryStrategy: {
        maxAttempts: 4,
        delayMs: 1500,
        backoffMultiplier: 1.3,
        shouldRetry: (attempt) => attempt < 3
      }
    };
  }
  
  private static analyzeNavigationError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'navigation',
      severity: 'medium',
      message: 'فشل الانتقال للصفحة',
      suggestedFixes: [
        'تحقق من صحة الـ URL',
        'الموقع قد يكون يستخدم redirect',
        'قد تحتاج للانتظار بعد navigation',
        'جرب استخدام waitForNavigation',
        'تحقق من حالة الاستجابة (status code)'
      ],
      autoFixable: true,
      retryStrategy: {
        maxAttempts: 3,
        delayMs: 3000,
        backoffMultiplier: 1.5,
        shouldRetry: (attempt) => attempt < 2
      }
    };
  }
  
  private static analyzeUnknownError(error: any, context: ErrorContext): ErrorAnalysis {
    return {
      type: 'unknown',
      severity: 'high',
      message: `خطأ غير متوقع: ${error.message}`,
      suggestedFixes: [
        'تحقق من السجلات (logs) للمزيد من التفاصيل',
        'قد يكون هناك تغيير في بنية الموقع',
        'جرب تحديث المهمة',
        'راجع السكريبت للتأكد من صحته'
      ],
      autoFixable: false,
      retryStrategy: {
        maxAttempts: 2,
        delayMs: 5000,
        backoffMultiplier: 1,
        shouldRetry: () => false
      }
    };
  }
  
  // ========== مساعدات الكشف ==========
  
  private static isSelectorError(message: string): boolean {
    const patterns = [
      /no element/i,
      /selector.*not found/i,
      /element.*not found/i,
      /waiting.*failed/i,
      /querySelector/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private static isNetworkError(message: string): boolean {
    const patterns = [
      /network/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ERR_NAME_NOT_RESOLVED/i,
      /net::ERR/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private static isTimeoutError(message: string): boolean {
    const patterns = [
      /timeout/i,
      /timed out/i,
      /navigation timeout/i,
      /exceeded/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private static isAuthenticationError(message: string, context: ErrorContext): boolean {
    const patterns = [
      /login/i,
      /authentication/i,
      /unauthorized/i,
      /401/,
      /403/,
      /invalid credentials/i
    ];
    return patterns.some(pattern => pattern.test(message)) ||
           context.action === 'login';
  }
  
  private static isCaptchaError(message: string, context: ErrorContext): boolean {
    const patterns = [
      /captcha/i,
      /recaptcha/i,
      /hcaptcha/i,
      /challenge/i,
      /verify.*human/i
    ];
    
    // فحص الصفحة للكلمات المفتاحية
    const pageHasCaptcha = context.logs?.some(log => 
      patterns.some(pattern => pattern.test(log))
    );
    
    return patterns.some(pattern => pattern.test(message)) || pageHasCaptcha;
  }
  
  private static isElementNotInteractiveError(message: string): boolean {
    const patterns = [
      /not.*interactive/i,
      /not.*visible/i,
      /not.*clickable/i,
      /obscured/i,
      /not.*displayed/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  private static isNavigationError(message: string): boolean {
    const patterns = [
      /navigation/i,
      /goto/i,
      /ERR_FAILED/i,
      /Cannot navigate/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }
  
  // ========== اقتراحات التصحيح ==========
  
  private static suggestAlternativeSelector(selector: string): string {
    // إذا كان CSS selector، اقترح XPath
    if (selector.startsWith('.') || selector.startsWith('#')) {
      return `[data-testid] or [aria-label]`;
    }
    
    // إذا كان XPath، اقترح CSS
    if (selector.startsWith('/') || selector.startsWith('(')) {
      return '.className or #id';
    }
    
    return 'text= or >> or xpath=';
  }
}

/**
 * مدير إعادة المحاولة الذكي
 */
export class SmartRetryManager {
  
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customStrategy?: Partial<RetryStrategy>
  ): Promise<T> {
    const defaultStrategy: RetryStrategy = {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 1.5,
      shouldRetry: () => true
    };
    
    const strategy = { ...defaultStrategy, ...customStrategy };
    let lastError: any;
    
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        console.log(`🔄 محاولة ${attempt}/${strategy.maxAttempts}...`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ نجحت المحاولة ${attempt} بعد ${attempt - 1} فشل`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ فشلت المحاولة ${attempt}:`, error.message);
        
        // تحليل الخطأ
        const analysis = SmartErrorAnalyzer.analyze(error, context);
        console.log(`📊 نوع الخطأ: ${analysis.type}, الخطورة: ${analysis.severity}`);
        
        // التحقق من إمكانية إعادة المحاولة
        if (attempt < strategy.maxAttempts && strategy.shouldRetry(attempt, error)) {
          const delay = strategy.delayMs * Math.pow(strategy.backoffMultiplier, attempt - 1);
          console.log(`⏳ انتظار ${delay}ms قبل المحاولة التالية...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // محاولة تطبيق fix تلقائي إذا كان متاحاً
          if (analysis.autoFixable) {
            console.log(`🔧 محاولة تصحيح تلقائي...`);
            await this.applyAutoFix(analysis, context);
          }
        } else {
          console.log(`⛔ لن يتم إعادة المحاولة`);
          break;
        }
      }
    }
    
    // جميع المحاولات فشلت
    const analysis = SmartErrorAnalyzer.analyze(lastError, context);
    throw this.createEnhancedError(lastError, analysis, context);
  }
  
  private static async applyAutoFix(analysis: ErrorAnalysis, context: ErrorContext): Promise<void> {
    switch (analysis.type) {
      case 'timeout':
        console.log('🔧 زيادة timeout...');
        // يمكن تطبيق fix هنا
        break;
        
      case 'selector':
        console.log('🔧 محاولة selector بديل...');
        // يمكن تجربة selectors بديلة
        break;
        
      case 'element_not_interactive':
        console.log('🔧 الانتظار حتى يصبح العنصر مرئياً...');
        // يمكن إضافة wait
        break;
    }
  }
  
  private static createEnhancedError(originalError: any, analysis: ErrorAnalysis, context: ErrorContext): Error {
    const enhancedMessage = `
❌ فشلت المهمة: ${context.task?.name || 'Unknown'}

🔍 نوع الخطأ: ${analysis.type}
⚠️ الخطورة: ${analysis.severity}

💬 الرسالة:
${analysis.message}

🔧 الحلول المقترحة:
${analysis.suggestedFixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

📝 معلومات إضافية:
- الإجراء: ${context.action}
${context.url ? `- الموقع: ${context.url}` : ''}
${context.selector ? `- المحدد: ${context.selector}` : ''}

⏰ الوقت: ${context.timestamp.toLocaleString('ar-SA')}
    `.trim();
    
    const error = new Error(enhancedMessage);
    (error as any).analysis = analysis;
    (error as any).context = context;
    (error as any).originalError = originalError;
    
    return error;
  }
}

/**
 * نظام تسجيل الأخطاء المتقدم
 */
export class ErrorLogger {
  private static errorHistory: Array<{
    error: Error;
    context: ErrorContext;
    analysis: ErrorAnalysis;
    timestamp: Date;
  }> = [];
  
  static log(error: Error, context: ErrorContext, analysis: ErrorAnalysis): void {
    this.errorHistory.push({
      error,
      context,
      analysis,
      timestamp: new Date()
    });
    
    // الاحتفاظ بآخر 100 خطأ فقط
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }
    
    console.error('📋 Error logged:', {
      type: analysis.type,
      severity: analysis.severity,
      task: context.task?.name,
      timestamp: context.timestamp
    });
  }
  
  static getHistory() {
    return this.errorHistory;
  }
  
  static getStatistics() {
    const stats = {
      total: this.errorHistory.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      autoFixableCount: 0
    };
    
    this.errorHistory.forEach(({ analysis }) => {
      stats.byType[analysis.type] = (stats.byType[analysis.type] || 0) + 1;
      stats.bySeverity[analysis.severity] = (stats.bySeverity[analysis.severity] || 0) + 1;
      if (analysis.autoFixable) {
        stats.autoFixableCount++;
      }
    });
    
    return stats;
  }
  
  static clearHistory(): void {
    this.errorHistory = [];
  }
}
