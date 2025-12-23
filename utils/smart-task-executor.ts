/**
 * نظام تنفيذ مهام ذكي مع التعامل مع الاحتمالات المختلفة
 * - محاولة selectors متعددة
 * - معالجة الحالات الطارئة (popups, captcha, etc)
 * - تكيف ذكي مع تغيرات الموقع
 * - استراتيجيات احتياطية
 */

import { SmartRetryManager, SmartErrorAnalyzer, ErrorContext } from './error-handler';

export interface SmartAction {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'extract' | 'screenshot';
  primary: ActionConfig;
  fallbacks?: ActionConfig[];
  conditions?: Condition[];
  errorHandling?: ErrorHandling;
}

export interface ActionConfig {
  selector?: string | string[];
  value?: string;
  timeout?: number;
  waitForNavigation?: boolean;
  customLogic?: string;
}

export interface Condition {
  type: 'element_exists' | 'element_visible' | 'url_contains' | 'text_contains';
  target: string;
  action: 'continue' | 'skip' | 'retry' | 'fail';
}

export interface ErrorHandling {
  ignoreErrors?: boolean;
  retryCount?: number;
  fallbackAction?: SmartAction;
}

/**
 * محرك التنفيذ الذكي
 */
export class SmartTaskExecutor {
  
  /**
   * تنفيذ إجراء مع دعم fallbacks والتعامل الذكي مع الأخطاء
   */
  static async executeAction(
    action: SmartAction,
    context: ErrorContext,
    page?: any
  ): Promise<any> {
    console.log(`🎯 تنفيذ: ${action.type}`);

    // فحص الشروط المسبقة
    if (action.conditions) {
      const conditionResult = await this.checkConditions(action.conditions, page);
      if (!conditionResult.shouldContinue) {
        console.log(`⏭️ تخطي الإجراء بسبب شرط: ${conditionResult.reason}`);
        return null;
      }
    }

    // محاولة الإجراء الأساسي
    try {
      const result = await this.executeActionConfig(action.type, action.primary, page);
      console.log(`✅ نجح الإجراء الأساسي`);
      return result;
    } catch (primaryError: any) {
      console.error(`❌ فشل الإجراء الأساسي:`, primaryError.message);

      // تحليل الخطأ
      const analysis = SmartErrorAnalyzer.analyze(primaryError, context);
      console.log(`📊 تحليل الخطأ: ${analysis.type} - ${analysis.severity}`);

      // محاولة fallbacks
      if (action.fallbacks && action.fallbacks.length > 0) {
        console.log(`🔄 محاولة ${action.fallbacks.length} بديل...`);
        
        for (let i = 0; i < action.fallbacks.length; i++) {
          try {
            console.log(`  محاولة البديل ${i + 1}...`);
            const result = await this.executeActionConfig(action.type, action.fallbacks[i], page);
            console.log(`  ✅ نجح البديل ${i + 1}`);
            return result;
          } catch (fallbackError: any) {
            console.error(`  ❌ فشل البديل ${i + 1}:`, fallbackError.message);
            if (i === action.fallbacks.length - 1) {
              // آخر fallback فشل أيضاً
              throw fallbackError;
            }
          }
        }
      }

      // إذا كان لدينا errorHandling
      if (action.errorHandling?.ignoreErrors) {
        console.log(`⚠️ تجاهل الخطأ حسب الإعدادات`);
        return null;
      }

      // إذا كان لدينا fallbackAction
      if (action.errorHandling?.fallbackAction) {
        console.log(`🔄 تنفيذ إجراء احتياطي...`);
        return await this.executeAction(action.errorHandling.fallbackAction, context, page);
      }

      throw primaryError;
    }
  }

  /**
   * تنفيذ configuration محدد
   */
  private static async executeActionConfig(
    type: string,
    config: ActionConfig,
    page?: any
  ): Promise<any> {
    // محاكاة التنفيذ (في التطبيق الحقيقي سيستخدم Playwright/Puppeteer)
    
    switch (type) {
      case 'navigate':
        return await this.smartNavigate(config, page);
        
      case 'click':
        return await this.smartClick(config, page);
        
      case 'type':
        return await this.smartType(config, page);
        
      case 'wait':
        return await this.smartWait(config, page);
        
      case 'extract':
        return await this.smartExtract(config, page);
        
      case 'screenshot':
        return await this.smartScreenshot(config, page);
        
      default:
        throw new Error(`نوع إجراء غير معروف: ${type}`);
    }
  }

  /**
   * انتقال ذكي مع معالجة الاحتمالات
   */
  private static async smartNavigate(config: ActionConfig, page?: any): Promise<void> {
    const url = config.value;
    if (!url) throw new Error('URL مطلوب للانتقال');

    console.log(`🌐 الانتقال إلى: ${url}`);
    
    // محاكاة
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // فحص ما بعد الانتقال
    await this.handlePostNavigationChecks(page);
  }

  /**
   * نقر ذكي مع محاولة selectors متعددة
   */
  private static async smartClick(config: ActionConfig, page?: any): Promise<void> {
    const selectors = Array.isArray(config.selector) ? config.selector : [config.selector];
    
    for (const selector of selectors) {
      if (!selector) continue;
      
      try {
        console.log(`  🖱️ محاولة النقر على: ${selector}`);
        
        // محاكاة انتظار العنصر
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // محاكاة النقر
        console.log(`  ✅ تم النقر على: ${selector}`);
        
        // نجح، اخرج من الحلقة
        return;
      } catch (error: any) {
        console.log(`  ⚠️ فشل selector: ${selector}`);
        
        // إذا كان آخر selector، ارمي الخطأ
        if (selector === selectors[selectors.length - 1]) {
          throw error;
        }
        
        // جرب التالي
        continue;
      }
    }
    
    throw new Error('فشلت جميع محاولات النقر');
  }

  /**
   * كتابة ذكية مع محاكاة بشرية
   */
  private static async smartType(config: ActionConfig, page?: any): Promise<void> {
    const selector = Array.isArray(config.selector) ? config.selector[0] : config.selector;
    const text = config.value;
    
    if (!selector || !text) {
      throw new Error('selector و text مطلوبان للكتابة');
    }

    console.log(`⌨️ كتابة في: ${selector}`);
    
    // محاكاة الكتابة البشرية (حرف بحرف)
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
    
    console.log(`✅ تمت الكتابة: ${text.substring(0, 20)}...`);
  }

  /**
   * انتظار ذكي مع فحوصات متعددة
   */
  private static async smartWait(config: ActionConfig, page?: any): Promise<void> {
    const selector = Array.isArray(config.selector) ? config.selector[0] : config.selector;
    const timeout = config.timeout || 30000;

    if (selector) {
      console.log(`⏳ انتظار العنصر: ${selector}`);
      // محاكاة الانتظار
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ ظهر العنصر: ${selector}`);
    } else {
      // انتظار زمني
      const delay = timeout || 1000;
      console.log(`⏳ انتظار ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * استخراج ذكي مع fallbacks متعددة
   */
  private static async smartExtract(config: ActionConfig, page?: any): Promise<any> {
    const selectors = Array.isArray(config.selector) ? config.selector : [config.selector];
    
    for (const selector of selectors) {
      if (!selector) continue;
      
      try {
        console.log(`  📤 محاولة استخراج من: ${selector}`);
        
        // محاكاة الاستخراج
        const mockData = {
          text: 'Sample extracted data',
          selector: selector,
          timestamp: new Date().toISOString()
        };
        
        console.log(`  ✅ تم الاستخراج من: ${selector}`);
        return mockData;
      } catch (error) {
        console.log(`  ⚠️ فشل استخراج من: ${selector}`);
        
        if (selector === selectors[selectors.length - 1]) {
          throw error;
        }
        
        continue;
      }
    }
    
    throw new Error('فشلت جميع محاولات الاستخراج');
  }

  /**
   * لقطة شاشة ذكية
   */
  private static async smartScreenshot(config: ActionConfig, page?: any): Promise<string> {
    console.log(`📸 التقاط لقطة شاشة`);
    
    // محاكاة
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockScreenshot = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...`;
    console.log(`✅ تم التقاط لقطة الشاشة`);
    
    return mockScreenshot;
  }

  /**
   * فحص الشروط
   */
  private static async checkConditions(
    conditions: Condition[],
    page?: any
  ): Promise<{ shouldContinue: boolean; reason?: string }> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, page);
      
      if (!result.passed) {
        switch (condition.action) {
          case 'skip':
            return { shouldContinue: false, reason: `شرط فشل: ${condition.type}` };
          case 'fail':
            throw new Error(`فشل شرط إلزامي: ${condition.type}`);
          case 'retry':
            // سيتم التعامل معه في مستوى أعلى
            break;
          case 'continue':
          default:
            // استمر
            break;
        }
      }
    }
    
    return { shouldContinue: true };
  }

  /**
   * تقييم شرط واحد
   */
  private static async evaluateCondition(
    condition: Condition,
    page?: any
  ): Promise<{ passed: boolean }> {
    // محاكاة تقييم الشروط
    
    switch (condition.type) {
      case 'element_exists':
        // محاكاة فحص وجود عنصر
        return { passed: Math.random() > 0.2 };
        
      case 'element_visible':
        // محاكاة فحص رؤية عنصر
        return { passed: Math.random() > 0.3 };
        
      case 'url_contains':
        // محاكاة فحص URL
        return { passed: true };
        
      case 'text_contains':
        // محاكاة فحص نص
        return { passed: Math.random() > 0.1 };
        
      default:
        return { passed: true };
    }
  }

  /**
   * فحوصات ما بعد الانتقال
   */
  private static async handlePostNavigationChecks(page?: any): Promise<void> {
    // فحص وجود popups
    await this.handlePopups(page);
    
    // فحص وجود captcha
    await this.handleCaptcha(page);
    
    // فحص وجود cookie banners
    await this.handleCookieBanners(page);
    
    // فحص وجود age verification
    await this.handleAgeVerification(page);
  }

  /**
   * معالجة النوافذ المنبثقة
   */
  private static async handlePopups(page?: any): Promise<void> {
    const commonPopupSelectors = [
      'button[aria-label="Close"]',
      'button.close',
      '.modal-close',
      '[data-dismiss="modal"]',
      '.popup-close',
      'button:has-text("×")',
      'button:has-text("Close")',
      'button:has-text("إغلاق")'
    ];

    for (const selector of commonPopupSelectors) {
      try {
        // محاكاة محاولة إغلاق popup
        const exists = Math.random() > 0.8;
        if (exists) {
          console.log(`  🚫 إغلاق popup: ${selector}`);
          await new Promise(resolve => setTimeout(resolve, 200));
          return;
        }
      } catch (error) {
        // تجاهل - لا يوجد popup
      }
    }
  }

  /**
   * معالجة Captcha
   */
  private static async handleCaptcha(page?: any): Promise<void> {
    const captchaSelectors = [
      '#recaptcha',
      '.g-recaptcha',
      '.h-captcha',
      'iframe[src*="captcha"]'
    ];

    for (const selector of captchaSelectors) {
      try {
        const exists = Math.random() > 0.95; // نادر
        if (exists) {
          console.log(`  🤖 تم اكتشاف captcha!`);
          throw new Error('Captcha detected - يتطلب تدخل بشري');
        }
      } catch (error) {
        // تجاهل
      }
    }
  }

  /**
   * معالجة إشعارات ملفات تعريف الارتباط
   */
  private static async handleCookieBanners(page?: any): Promise<void> {
    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("قبول")',
      'button:has-text("I Agree")',
      'button:has-text("موافق")',
      '#cookie-accept',
      '.cookie-accept',
      '[data-cookie-accept]'
    ];

    for (const selector of cookieSelectors) {
      try {
        const exists = Math.random() > 0.7;
        if (exists) {
          console.log(`  🍪 قبول cookies: ${selector}`);
          await new Promise(resolve => setTimeout(resolve, 200));
          return;
        }
      } catch (error) {
        // تجاهل
      }
    }
  }

  /**
   * معالجة التحقق من العمر
   */
  private static async handleAgeVerification(page?: any): Promise<void> {
    const ageSelectors = [
      'button:has-text("I am 18+")',
      'button:has-text("أنا أكبر من 18")',
      'button:has-text("Enter")',
      '.age-verification button',
      '#age-confirm'
    ];

    for (const selector of ageSelectors) {
      try {
        const exists = Math.random() > 0.95;
        if (exists) {
          console.log(`  🔞 تأكيد العمر: ${selector}`);
          await new Promise(resolve => setTimeout(resolve, 200));
          return;
        }
      } catch (error) {
        // تجاهل
      }
    }
  }
}

/**
 * مكتبة قوالب المهام الذكية
 */
export class SmartTaskTemplates {
  
  /**
   * قالب تسجيل دخول ذكي
   */
  static login(url: string, username: string, password: string): SmartAction[] {
    return [
      {
        type: 'navigate',
        primary: { value: url },
        errorHandling: {
          retryCount: 3
        }
      },
      {
        type: 'type',
        primary: {
          selector: ['#username', '#email', 'input[type="email"]', 'input[name="username"]', 'input[name="email"]']
        },
        fallbacks: [
          { selector: 'input[type="text"]' },
          { selector: 'input[placeholder*="username" i]' },
          { selector: 'input[placeholder*="email" i]' }
        ],
        errorHandling: {
          retryCount: 2
        }
      },
      {
        type: 'type',
        primary: {
          selector: ['#password', 'input[type="password"]', 'input[name="password"]']
        },
        fallbacks: [
          { selector: 'input[placeholder*="password" i]' },
          { selector: 'input[placeholder*="كلمة المرور" i]' }
        ],
        errorHandling: {
          retryCount: 2
        }
      },
      {
        type: 'click',
        primary: {
          selector: ['button[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign In")']
        },
        fallbacks: [
          { selector: 'button:has-text("دخول")' },
          { selector: 'input[type="submit"]' },
          { selector: '.login-button' }
        ],
        conditions: [
          {
            type: 'element_visible',
            target: 'button[type="submit"]',
            action: 'retry'
          }
        ]
      },
      {
        type: 'wait',
        primary: {
          timeout: 3000
        }
      }
    ];
  }

  /**
   * قالب جمع بيانات ذكي
   */
  static scraping(url: string, selectors: { [key: string]: string | string[] }): SmartAction[] {
    const actions: SmartAction[] = [
      {
        type: 'navigate',
        primary: { value: url }
      }
    ];

    // إضافة استخراج لكل selector
    Object.entries(selectors).forEach(([key, selector]) => {
      actions.push({
        type: 'extract',
        primary: {
          selector: selector
        },
        fallbacks: Array.isArray(selector) 
          ? selector.slice(1).map(s => ({ selector: s }))
          : [],
        errorHandling: {
          ignoreErrors: true // لا نريد فشل كامل المهمة إذا فشل عنصر واحد
        }
      });
    });

    return actions;
  }

  /**
   * قالب اختبار صفحة ذكي
   */
  static testing(url: string, checks: Array<{ type: string; target: string }>): SmartAction[] {
    const actions: SmartAction[] = [
      {
        type: 'navigate',
        primary: { value: url }
      }
    ];

    // إضافة فحص لكل check
    checks.forEach(check => {
      actions.push({
        type: 'wait',
        primary: {
          selector: check.target,
          timeout: 10000
        },
        conditions: [
          {
            type: check.type as any,
            target: check.target,
            action: 'fail'
          }
        ]
      });
    });

    actions.push({
      type: 'screenshot',
      primary: {}
    });

    return actions;
  }
}
