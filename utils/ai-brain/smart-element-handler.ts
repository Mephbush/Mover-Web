/**
 * نظام معالج العناصر الذكي
 * Smart Element Handler System
 * 
 * معالجة ذكية وآمنة وسريعة للتفاعل مع العناصر
 */

export interface ElementInteraction {
  action: 'click' | 'fill' | 'select' | 'hover' | 'extract' | 'wait';
  success: boolean;
  timeMs: number;
  result?: any;
  error?: string;
  humanLike?: boolean;
}

export interface SmartInteractionOptions {
  humanLike?: boolean;
  delay?: number;
  retry?: boolean;
  maxRetries?: number;
  timeout?: number;
  scrollIntoView?: boolean;
  waitFor?: string;
}

/**
 * نظام المحاكاة البشرية
 */
class HumanBehaviorSimulation {
  /**
   * حساب تأخير طبيعي بشري
   */
  calculateNaturalDelay(minMs: number = 100, maxMs: number = 500): number {
    // توزيع طبيعي بشري
    const random = Math.random();
    const gaussianRandom =
      Math.sqrt(-2.0 * Math.log(Math.random())) *
      Math.cos(2.0 * Math.PI * random);
    const normalizedDelay = Math.abs(gaussianRandom / 3); // normalize to 0-1
    return minMs + normalizedDelay * (maxMs - minMs);
  }

  /**
   * حركة الماوس الطبيعية
   */
  async moveMouseNaturally(
    page: any,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<void> {
    const steps = Math.ceil(Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 50);

    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;

      await page.mouse.move(x, y);
      await page.waitForTimeout(this.calculateNaturalDelay(10, 30));
    }
  }

  /**
   * نقر طبيعي بشري
   */
  async naturalClick(page: any, element: any): Promise<void> {
    const box = await element.boundingBox();
    if (!box) throw new Error('Element not visible');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // تحريك الماوس إلى العنصر
    const startX = Math.random() * 1920;
    const startY = Math.random() * 1080;
    await this.moveMouseNaturally(page, startX, startY, centerX, centerY);

    // تأخير طبيعي قبل النقر
    await page.waitForTimeout(this.calculateNaturalDelay(50, 150));

    // النقر
    await page.mouse.click(centerX, centerY);

    // تأخير طبيعي بعد النقر
    await page.waitForTimeout(this.calculateNaturalDelay(100, 300));
  }

  /**
   * كتابة طبيعية بشرية
   */
  async naturalType(page: any, selector: string, text: string): Promise<void> {
    // تأخير قبل الكتابة
    await page.waitForTimeout(this.calculateNaturalDelay(200, 500));

    // النقر أولاً
    await page.click(selector);

    // تأخير بعد النقر
    await page.waitForTimeout(this.calculateNaturalDelay(100, 300));

    // الكتابة حرف حرف
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(this.calculateNaturalDelay(30, 100));

      // كل عدة أحرف، توقف قصير
      if (Math.random() < 0.1) {
        await page.waitForTimeout(this.calculateNaturalDelay(100, 300));
      }
    }

    // تأخير طبيعي بعد الكتابة
    await page.waitForTimeout(this.calculateNaturalDelay(200, 500));
  }
}

/**
 * نظام التحقق الذكي
 */
class SmartValidation {
  /**
   * التحقق من أن العنصر آمن للتفاعل
   */
  async isSafeToInteract(element: any): Promise<boolean> {
    try {
      // التحقق من الرؤية
      const isVisible = await element.isVisible();
      if (!isVisible) return false;

      // التحقق من التفاعلية
      const isEnabled = await element.isEnabled();
      if (!isEnabled) return false;

      // التحقق من الحجم
      const box = await element.boundingBox();
      if (!box || box.width < 1 || box.height < 1) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * التحقق من النتيجة بعد الإجراء
   */
  async verifyActionResult(
    element: any,
    action: string,
    expectedState?: any
  ): Promise<boolean> {
    try {
      if (action === 'click') {
        // التحقق من أن النقر تم تنفيذه
        const text = await element.textContent();
        return text !== null;
      } else if (action === 'fill') {
        // التحقق من أن الملء تم
        const value = await element.inputValue();
        return value.length > 0;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * اكتشاف حالات الخطأ
   */
  async detectErrorState(page: any): Promise<boolean> {
    try {
      const errorElements = await page.locator(
        '.error, [class*="error"], [role="alert"], .alert-danger'
      ).count();
      
      return errorElements > 0;
    } catch {
      return false;
    }
  }
}

/**
 * نظام إعادة المحاولة الذكي
 */
class SmartRetryMechanism {
  /**
   * إعادة محاولة ذكية مع تصعيد
   */
  async smartRetry(
    action: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    attempts: number;
  }> {
    let lastError: string = '';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await action();
        return { success: true, result, attempts: attempt + 1 };
      } catch (error: any) {
        lastError = error.message;

        if (attempt < maxRetries - 1) {
          // تأخير تصاعدي
          const delay = baseDelay * Math.pow(1.5, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: maxRetries,
    };
  }
}

/**
 * النظام الرئيسي المتكامل
 */
export class SmartElementHandler {
  private humanBehavior: HumanBehaviorSimulation;
  private validation: SmartValidation;
  private retryMechanism: SmartRetryMechanism;

  constructor() {
    this.humanBehavior = new HumanBehaviorSimulation();
    this.validation = new SmartValidation();
    this.retryMechanism = new SmartRetryMechanism();
  }

  /**
   * نقر ذكي
   */
  async smartClick(
    element: any,
    page: any,
    options: SmartInteractionOptions = {}
  ): Promise<ElementInteraction> {
    const startTime = Date.now();

    try {
      // التحقق من الأمان
      if (!await this.validation.isSafeToInteract(element)) {
        return {
          action: 'click',
          success: false,
          timeMs: Date.now() - startTime,
          error: 'Element not safe to interact',
        };
      }

      // التمرير إلى العنصر إذا لزم الأمر
      if (options.scrollIntoView) {
        await element.scrollIntoViewIfNeeded();
      }

      // النقر
      if (options.humanLike) {
        await this.humanBehavior.naturalClick(page, element);
      } else {
        await element.click();
      }

      // التحقق من النتيجة
      const verified = await this.validation.verifyActionResult(element, 'click');

      return {
        action: 'click',
        success: verified,
        timeMs: Date.now() - startTime,
        humanLike: options.humanLike,
      };
    } catch (error: any) {
      return {
        action: 'click',
        success: false,
        timeMs: Date.now() - startTime,
        error: error.message,
        humanLike: options.humanLike,
      };
    }
  }

  /**
   * ملء ذكي
   */
  async smartFill(
    element: any,
    page: any,
    value: string,
    options: SmartInteractionOptions = {}
  ): Promise<ElementInteraction> {
    const startTime = Date.now();

    try {
      // التحقق من الأمان
      if (!await this.validation.isSafeToInteract(element)) {
        return {
          action: 'fill',
          success: false,
          timeMs: Date.now() - startTime,
          error: 'Element not safe to interact',
        };
      }

      // التمرير إلى العنصر
      if (options.scrollIntoView) {
        await element.scrollIntoViewIfNeeded();
      }

      // الملء
      if (options.humanLike) {
        const selector = await element.evaluate((el: any) =>
          el.id ? `#${el.id}` : `.${el.className.split(' ')[0]}`
        );
        await this.humanBehavior.naturalType(page, selector, value);
      } else {
        await element.fill(value);
      }

      // التحقق من النتيجة
      const verified = await this.validation.verifyActionResult(element, 'fill');

      return {
        action: 'fill',
        success: verified,
        timeMs: Date.now() - startTime,
        humanLike: options.humanLike,
      };
    } catch (error: any) {
      return {
        action: 'fill',
        success: false,
        timeMs: Date.now() - startTime,
        error: error.message,
        humanLike: options.humanLike,
      };
    }
  }

  /**
   * اختيار ذكي
   */
  async smartSelect(
    element: any,
    value: string,
    options: SmartInteractionOptions = {}
  ): Promise<ElementInteraction> {
    const startTime = Date.now();

    try {
      // التمرير إلى العنصر
      if (options.scrollIntoView) {
        await element.scrollIntoViewIfNeeded();
      }

      // الاختيار
      await element.selectOption(value);

      return {
        action: 'select',
        success: true,
        timeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        action: 'select',
        success: false,
        timeMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * الانتظار الذكي
   */
  async smartWait(
    page: any,
    selector: string,
    options: SmartInteractionOptions = {}
  ): Promise<ElementInteraction> {
    const startTime = Date.now();

    try {
      const timeout = options.timeout || 5000;

      await page.waitForSelector(selector, { timeout });

      return {
        action: 'wait',
        success: true,
        timeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        action: 'wait',
        success: false,
        timeMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * استخراج ذكي
   */
  async smartExtract(
    element: any,
    method: 'text' | 'html' | 'value' | 'attribute' = 'text'
  ): Promise<ElementInteraction> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (method) {
        case 'text':
          result = await element.textContent();
          break;
        case 'html':
          result = await element.innerHTML();
          break;
        case 'value':
          result = await element.inputValue();
          break;
        case 'attribute':
          result = await element.evaluate((el: any) =>
            Object.fromEntries(
              Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])
            )
          );
          break;
      }

      return {
        action: 'extract',
        success: true,
        timeMs: Date.now() - startTime,
        result,
      };
    } catch (error: any) {
      return {
        action: 'extract',
        success: false,
        timeMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * تفاعل متقدم مع إعادة محاولة
   */
  async advancedInteract(
    element: any,
    page: any,
    action: string,
    params: any = {},
    options: SmartInteractionOptions = {}
  ): Promise<ElementInteraction> {
    if (!options.retry) {
      // بدون إعادة محاولة
      switch (action) {
        case 'click':
          return await this.smartClick(element, page, options);
        case 'fill':
          return await this.smartFill(element, page, params.value, options);
        case 'select':
          return await this.smartSelect(element, params.value, options);
        case 'extract':
          return await this.smartExtract(element, params.method);
        default:
          return {
            action: action as any,
            success: false,
            timeMs: 0,
            error: 'Unknown action',
          };
      }
    }

    // مع إعادة محاولة ذكية
    const retryResult = await this.retryMechanism.smartRetry(
      async () => {
        let result;

        switch (action) {
          case 'click':
            result = await this.smartClick(element, page, options);
            break;
          case 'fill':
            result = await this.smartFill(element, page, params.value, options);
            break;
          case 'select':
            result = await this.smartSelect(element, params.value, options);
            break;
          case 'extract':
            result = await this.smartExtract(element, params.method);
            break;
          default:
            throw new Error('Unknown action');
        }

        if (!result.success) throw new Error(result.error);
        return result;
      },
      options.maxRetries || 3
    );

    return retryResult.success
      ? retryResult.result
      : {
          action: action as any,
          success: false,
          timeMs: 0,
          error: retryResult.error,
        };
  }
}

/**
 * دالة مساعدة
 */
export function createSmartHandler(): SmartElementHandler {
  return new SmartElementHandler();
}
