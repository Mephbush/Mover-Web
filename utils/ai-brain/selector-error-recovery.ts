/**
 * نظام استرجاع أخطاء المحددات
 * Selector Error Recovery System
 * 
 * معالجة ذكية لأخطاء المحددات والعثور على بدائل تلقائية
 */

export interface SelectorErrorContext {
  originalSelector: string;
  errorType: 'not_found' | 'timeout' | 'not_visible' | 'not_interactive' | 'ambiguous';
  errorMessage: string;
  website: string;
  taskType: string;
  elementType: string;
  pageContent?: string;
  pageStructure?: any;
  retryCount: number;
  maxRetries: number;
}

export interface RecoveryStrategy {
  strategies: RecoveryAttempt[];
  selectedStrategy: RecoveryAttempt;
  estimatedSuccessRate: number;
  reasoning: string;
  totalTimeout: number;
}

export interface RecoveryAttempt {
  id: string;
  type: 'selector_variation' | 'attribute_based' | 'xpath' | 'hybrid' | 'visual' | 'retry_with_wait';
  description: string;
  newSelectors: string[];
  delayMs: number;
  timeout: number;
  confidence: number;
  priority: number;
}

export interface RecoveryResult {
  success: boolean;
  usedStrategy: RecoveryAttempt;
  finalSelector: string;
  executionTime: number;
  learnings: string[];
}

/**
 * نظام استرجاع أخطاء المحددات
 */
export class SelectorErrorRecovery {
  private recoveryHistory: Map<string, RecoveryResult[]> = new Map();
  private commonErrors: Map<string, number> = new Map();

  /**
   * تحليل خطأ المحدد واقتراح استراتيجيات الاسترجاع
   */
  async analyzeAndRecover(
    context: SelectorErrorContext
  ): Promise<RecoveryStrategy> {
    console.log(`🔧 تحليل خطأ المحدد: ${context.originalSelector}`);
    console.log(`   نوع الخطأ: ${context.errorType}`);

    // 1. تسجيل الخطأ
    this.recordError(context.errorType);

    // 2. توليد استراتيجيات الاسترجاع
    const strategies = await this.generateRecoveryStrategies(context);
    console.log(`   📋 استراتيجيات متاحة: ${strategies.length}`);

    // 3. ترتيب الاستراتيجيات حسب الأولوية
    const sortedStrategies = this.prioritizeStrategies(strategies, context);

    // 4. اختيار أفضل استراتيجية
    const selectedStrategy = sortedStrategies[0] || this.getDefaultStrategy(context);

    // 5. حساب الوقت الكلي المتوقع
    const totalTimeout = sortedStrategies.reduce((sum, s) => sum + s.timeout, 0);

    console.log(`   ✅ الاستراتيجية المختارة: ${selectedStrategy.description}`);
    console.log(`   ⏱️ الوقت المتوقع: ${totalTimeout}ms`);

    return {
      strategies: sortedStrategies,
      selectedStrategy,
      estimatedSuccessRate: selectedStrategy.confidence,
      reasoning: this.buildRecoveryReasoning(context, selectedStrategy),
      totalTimeout,
    };
  }

  /**
   * توليد استراتيجيات استرجاع محددة
   */
  private async generateRecoveryStrategies(
    context: SelectorErrorContext
  ): Promise<RecoveryAttempt[]> {
    const strategies: RecoveryAttempt[] = [];

    // 1. استراتيجية: تغيير المحدد (أشكال مختلفة)
    strategies.push(...this.generateSelectorVariations(context));

    // 2. استراتيجية: البحث بناءً على Attributes
    strategies.push(...this.generateAttributeBasedStrategies(context));

    // 3. استراتيجية: استخدام XPath بديل
    if (context.elementType) {
      strategies.push(...this.generateXPathStrategies(context));
    }

    // 4. استراتيجية: البحث الهجين
    strategies.push(...this.generateHybridStrategies(context));

    // 5. استراتيجية: الانتظار + إعادة المحاولة
    strategies.push(...this.generateRetryWithWaitStrategies(context));

    // 6. استراتيجية: البحث البصري (إذا كان متاحاً)
    if (context.pageStructure) {
      strategies.push(...this.generateVisualSearchStrategies(context));
    }

    return strategies;
  }

  /**
   * توليد تغييرات المحدد
   * 
   * مثال:
   * #email → [id="email"], input#email, [id*="email"]
   */
  private generateSelectorVariations(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];
    const original = context.originalSelector;

    // 1. إزالة الفئات غير الضرورية
    if (original.includes('.')) {
      const simplified = original.split('.')[0];
      if (simplified) {
        attempts.push({
          id: `variation_simplified`,
          type: 'selector_variation',
          description: `تبسيط المحدد: ${original} → ${simplified}`,
          newSelectors: [simplified],
          delayMs: 100,
          timeout: 5000,
          confidence: 0.65,
          priority: 3,
        });
      }
    }

    // 2. إضافة معدّل CSS
    if (original.startsWith('#')) {
      const id = original.substring(1);
      attempts.push({
        id: `variation_with_type`,
        type: 'selector_variation',
        description: `إضافة نوع العنصر: ${original} → input${original}`,
        newSelectors: [
          `input${original}`,
          `button${original}`,
          `div${original}`,
          `[id="${id}"]`,
        ],
        delayMs: 200,
        timeout: 8000,
        confidence: 0.75,
        priority: 2,
      });
    }

    // 3. استخدام معدّلات الخصائص
    if (original.includes('[')) {
      const attr = original.match(/\[([^\]]+)\]/)?.[1];
      if (attr) {
        attempts.push({
          id: `variation_wildcard`,
          type: 'selector_variation',
          description: `استخدام wildcard: ${original} → [${attr}*=...]`,
          newSelectors: [
            original.replace(/=["']([^"']+)["']/, '*=$1'),
            original.replace(/=["']([^"']+)["']/, '~=$1'),
          ],
          delayMs: 300,
          timeout: 10000,
          confidence: 0.6,
          priority: 4,
        });
      }
    }

    // 4. محاولة مع العنصر الأب
    if (!original.includes('>')) {
      attempts.push({
        id: `variation_parent`,
        type: 'selector_variation',
        description: `البحث عن الآباء: * > ${original}`,
        newSelectors: [
          `* > ${original}`,
          `body ${original}`,
          `main ${original}`,
        ],
        delayMs: 400,
        timeout: 12000,
        confidence: 0.5,
        priority: 5,
      });
    }

    return attempts;
  }

  /**
   * توليد استراتيجيات مبنية على Attributes
   */
  private generateAttributeBasedStrategies(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];

    // 1. البحث عن data-testid
    attempts.push({
      id: `attr_data_testid`,
      type: 'attribute_based',
      description: `البحث عن data-testid matching`,
      newSelectors: [
        `[data-testid*="${this.extractKeyword(context.originalSelector)}"]`,
        `[data-testid*="${context.elementType}"]`,
        `[data-testid]`,
      ],
      delayMs: 200,
      timeout: 6000,
      confidence: 0.8,
      priority: 1,
    });

    // 2. البحث عن aria-label
    attempts.push({
      id: `attr_aria_label`,
      type: 'attribute_based',
      description: `البحث عن aria-label`,
      newSelectors: [
        `[aria-label*="${context.elementType}"]`,
        `[aria-label]`,
      ],
      delayMs: 250,
      timeout: 8000,
      confidence: 0.7,
      priority: 2,
    });

    // 3. البحث عن role
    attempts.push({
      id: `attr_role`,
      type: 'attribute_based',
      description: `البحث عن role attribute`,
      newSelectors: [
        `[role="${context.elementType}"]`,
        `[role="button"]`,
        `[role="link"]`,
      ],
      delayMs: 300,
      timeout: 10000,
      confidence: 0.65,
      priority: 3,
    });

    // 4. البحث عن name attribute
    attempts.push({
      id: `attr_name`,
      type: 'attribute_based',
      description: `البحث عن name attribute`,
      newSelectors: [
        `[name*="${this.extractKeyword(context.originalSelector)}"]`,
        `[name]`,
      ],
      delayMs: 250,
      timeout: 7000,
      confidence: 0.6,
      priority: 4,
    });

    return attempts;
  }

  /**
   * توليد استراتيجيات XPath
   */
  private generateXPathStrategies(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];
    const keyword = this.extractKeyword(context.originalSelector);

    // 1. XPath بناءً على النوع
    attempts.push({
      id: `xpath_by_type`,
      type: 'xpath',
      description: `XPath حسب النوع: //${context.elementType}`,
      newSelectors: [
        `//${context.elementType}`,
        `//${context.elementType}[contains(@class, "${keyword}")]`,
        `//${context.elementType}[contains(@id, "${keyword}")]`,
      ],
      delayMs: 400,
      timeout: 12000,
      confidence: 0.65,
      priority: 3,
    });

    // 2. XPath بناءً على Text
    if (context.elementType === 'button' || context.elementType === 'a') {
      attempts.push({
        id: `xpath_by_text`,
        type: 'xpath',
        description: `XPath حسب Text Content`,
        newSelectors: [
          `//${context.elementType}[contains(text(), "${keyword}")]`,
          `//button[contains(., "${keyword}")]`,
          `//a[contains(., "${keyword}")]`,
        ],
        delayMs: 500,
        timeout: 15000,
        confidence: 0.55,
        priority: 4,
      });
    }

    // 3. XPath بناءً على الموضع
    attempts.push({
      id: `xpath_by_position`,
      type: 'xpath',
      description: `XPath حسب الموضع`,
      newSelectors: [
        `//${context.elementType}[1]`,
        `//${context.elementType}[last()]`,
        `//${context.elementType}[position() < 5]`,
      ],
      delayMs: 300,
      timeout: 10000,
      confidence: 0.5,
      priority: 5,
    });

    return attempts;
  }

  /**
   * توليد استراتيجيات هجينة
   */
  private generateHybridStrategies(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];

    // 1. دمج CSS و XPath
    attempts.push({
      id: `hybrid_css_xpath`,
      type: 'hybrid',
      description: `دمج استراتيجيات CSS و XPath`,
      newSelectors: [
        `[data-testid], [aria-label], [name], #main`,
        `button:visible, button.btn, button[type="submit"]`,
        `input:not([type="hidden"]), input[type="text"], textarea`,
      ],
      delayMs: 300,
      timeout: 12000,
      confidence: 0.72,
      priority: 2,
    });

    // 2. استراتيجية الوالد والأطفال
    attempts.push({
      id: `hybrid_parent_child`,
      type: 'hybrid',
      description: `البحث في الوالد والأطفال`,
      newSelectors: [
        `form ${context.originalSelector}`,
        `div.modal ${context.originalSelector}`,
        `.container > ${context.originalSelector}`,
      ],
      delayMs: 400,
      timeout: 14000,
      confidence: 0.68,
      priority: 3,
    });

    return attempts;
  }

  /**
   * توليد استراتيجيات الانتظار + الإعادة
   */
  private generateRetryWithWaitStrategies(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];

    const waitTimes = [1000, 2000, 5000, 10000];

    waitTimes.forEach((waitTime) => {
      attempts.push({
        id: `retry_wait_${waitTime}`,
        type: 'retry_with_wait',
        description: `انتظار ${waitTime}ms ثم إعادة المحاولة`,
        newSelectors: [context.originalSelector],
        delayMs: waitTime,
        timeout: waitTime + 5000,
        confidence: 0.7 - waitTime / 20000,
        priority: 6 - Math.floor(waitTime / 3000),
      });
    });

    return attempts;
  }

  /**
   * توليد استراتيجيات البحث البصري
   */
  private generateVisualSearchStrategies(
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    const attempts: RecoveryAttempt[] = [];

    // 1. البحث عن عناصر مرئية
    attempts.push({
      id: `visual_visible_elements`,
      type: 'visual',
      description: `البحث عن عناصر مرئية فقط`,
      newSelectors: [
        `:visible`,
        `${context.originalSelector}:visible`,
        `${context.elementType}:not([display="none"])`,
      ],
      delayMs: 500,
      timeout: 10000,
      confidence: 0.65,
      priority: 4,
    });

    // 2. البحث عن عناصر قابلة للتفاعل
    attempts.push({
      id: `visual_interactive`,
      type: 'visual',
      description: `البحث عن عناصر قابلة للتفاعل`,
      newSelectors: [
        `${context.elementType}:enabled`,
        `button:not(:disabled)`,
        `input:not(:disabled)`,
      ],
      delayMs: 400,
      timeout: 12000,
      confidence: 0.6,
      priority: 5,
    });

    return attempts;
  }

  /**
   * ترتيب الاستراتيجيات حسب الأولوية
   */
  private prioritizeStrategies(
    strategies: RecoveryAttempt[],
    context: SelectorErrorContext
  ): RecoveryAttempt[] {
    // ضرب الأولوية بناءً على الخطأ المحدد
    const scored = strategies.map((strategy) => {
      let multiplier = 1.0;

      // إذا كان الخطأ timeout، أولويات الانتظار أعلى
      if (context.errorType === 'timeout') {
        if (strategy.type === 'retry_with_wait') multiplier = 1.5;
      }

      // إذا كان الخطأ not_visible، البحث البصري أولى
      if (context.errorType === 'not_visible') {
        if (strategy.type === 'visual') multiplier = 1.5;
        if (strategy.type === 'retry_with_wait') multiplier = 1.3;
      }

      // إذا كان الخطأ not_found، attribute-based أفضل
      if (context.errorType === 'not_found') {
        if (strategy.type === 'attribute_based') multiplier = 1.3;
      }

      return {
        ...strategy,
        priority: strategy.priority * multiplier,
      };
    });

    // ترتيب تنازلي
    return scored.sort((a, b) => {
      // أولاً حسب الأولوية
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // ثم حسب الثقة
      return b.confidence - a.confidence;
    });
  }

  /**
   * الحصول على استراتيجية افتراضية
   */
  private getDefaultStrategy(context: SelectorErrorContext): RecoveryAttempt {
    return {
      id: 'default_strategy',
      type: 'retry_with_wait',
      description: `استراتيجية افتراضية: انتظار ثم إعادة المحاولة`,
      newSelectors: [context.originalSelector],
      delayMs: 2000,
      timeout: 10000,
      confidence: 0.5,
      priority: 10,
    };
  }

  /**
   * بناء تفسير استرجاع الخطأ
   */
  private buildRecoveryReasoning(
    context: SelectorErrorContext,
    strategy: RecoveryAttempt
  ): string {
    let reasoning = `تم اختيار استراتيجية "${strategy.description}" `;
    reasoning += `بسبب نوع الخطأ: ${context.errorType}. `;

    if (context.retryCount > 0) {
      reasoning += `هذه محاولة ${context.retryCount + 1} من ${context.maxRetries}. `;
    }

    reasoning += `الثقة: ${(strategy.confidence * 100).toFixed(0)}%. `;
    reasoning += `محددات جديدة: ${strategy.newSelectors.join(', ')}`;

    return reasoning;
  }

  /**
   * استخراج الكلمة الرئيسية من المحدد
   */
  private extractKeyword(selector: string): string {
    // استخراج كلمة ذات معنى من المحدد
    const matches = selector.match(/[\w-]+/g);
    return matches ? matches[matches.length - 1] : 'element';
  }

  /**
   * تسجيل الأخطاء
   */
  private recordError(errorType: string): void {
    const count = this.commonErrors.get(errorType) || 0;
    this.commonErrors.set(errorType, count + 1);
  }

  /**
   * الحصول على إحصائيات الأخطاء الشائعة
   */
  getCommonErrors(): { errorType: string; count: number }[] {
    return Array.from(this.commonErrors.entries())
      .map(([errorType, count]) => ({ errorType, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * مسح السجل
   */
  clearHistory(): void {
    this.recoveryHistory.clear();
    this.commonErrors.clear();
    console.log('✅ تم مسح سجل الاسترجاع');
  }
}

// Export singleton instance
export const selectorErrorRecovery = new SelectorErrorRecovery();
