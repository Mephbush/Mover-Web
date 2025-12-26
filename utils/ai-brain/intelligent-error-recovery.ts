/**
 * نظام استرجاع الأخطاء الذكي المتقدم جداً
 * Intelligent Error Recovery System - Advanced recovery strategies
 * 
 * يتعافى من الأخطاء بذكاء عالي:
 * - 10 استراتيجيات استرجاع متقدمة
 * - اختيار ذكي للاستراتيجية المناسبة
 * - تعلم من الأخطاء السابقة
 * - تنبيهات فورية بمشاكل متكررة
 */

export interface ErrorContext {
  errorType: 'not_found' | 'timeout' | 'hidden' | 'disabled' | 'stale' | 'permission' | 'javascript' | 'network' | 'unknown';
  selector: string;
  domain: string;
  elementType: string;
  elementText?: string;
  pageUrl: string;
  attemptCount: number;
  timeElapsed: number;
  previousAttempts: ErrorAttempt[];
  pageSnapshot?: string;
}

export interface ErrorAttempt {
  strategy: string;
  selector: string;
  success: boolean;
  timeMs: number;
  error?: string;
  timestamp: number;
}

export interface RecoveryDecision {
  strategies: RecoveryStrategy[];
  primaryStrategy: RecoveryStrategy;
  alternativeStrategies: RecoveryStrategy[];
  estimatedSuccessRate: number;
  reasoning: string;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: (context: ErrorContext) => boolean;
  execute: (context: ErrorContext, page: any) => Promise<string | null>;
  timeoutMs: number;
  successRate: number;
  isAggressive: boolean; // قد تسبب آثاراً جانبية
}

/**
 * محرك استرجاع الأخطاء الذكي
 */
export class IntelligentErrorRecovery {
  private strategies: RecoveryStrategy[] = [];
  private strategyPerformance: Map<string, StrategyStats> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private recoveryHistory: ErrorAttempt[] = [];

  private readonly MAX_HISTORY = 1000;
  private readonly PATTERN_THRESHOLD = 3; // عدد مرات الخطأ لاعتباره نمط

  constructor() {
    this.initializeStrategies();
  }

  /**
   * تهيئة الاستراتيجيات الذكية
   */
  private initializeStrategies(): void {
    // الاستراتيجية 1: تبسيط المحدد
    this.registerStrategy({
      id: 'simplify-selector',
      name: 'تبسيط المحدد',
      description: 'إزالة المعدلات المعقدة والاحتفاظ بأساسيات المحدد',
      priority: 1,
      condition: (ctx) => ctx.errorType === 'not_found',
      execute: this.simplifySelector.bind(this),
      timeoutMs: 100,
      successRate: 0.72,
      isAggressive: false,
    });

    // الاستراتيجية 2: الانتظار الذكي
    this.registerStrategy({
      id: 'intelligent-wait',
      name: 'انتظار ذكي مع إعادة محاولة',
      description: 'انتظر حتى يتم تحميل العنصر بشكل كامل',
      priority: 2,
      condition: (ctx) => ctx.errorType === 'not_found' || ctx.errorType === 'timeout',
      execute: this.intelligentWait.bind(this),
      timeoutMs: 5000,
      successRate: 0.85,
      isAggressive: false,
    });

    // الاستراتيجية 3: البحث البديل
    this.registerStrategy({
      id: 'alternative-search',
      name: 'بحث بديل عن العنصر',
      description: 'ابحث عن العنصر باستخدام خصائص مختلفة',
      priority: 3,
      condition: (ctx) => ctx.errorType === 'not_found',
      execute: this.alternativeSearch.bind(this),
      timeoutMs: 500,
      successRate: 0.78,
      isAggressive: false,
    });

    // الاستراتيجية 4: البحث بواسطة النص
    this.registerStrategy({
      id: 'text-based-search',
      name: 'البحث بواسطة نص العنصر',
      description: 'ابحث عن العنصر من خلال النص المرئي',
      priority: 4,
      condition: (ctx) => ctx.elementText !== undefined && ctx.errorType === 'not_found',
      execute: this.textBasedSearch.bind(this),
      timeoutMs: 300,
      successRate: 0.68,
      isAggressive: false,
    });

    // الاستراتيجية 5: التمرير إلى العنصر
    this.registerStrategy({
      id: 'scroll-to-element',
      name: 'التمرير إلى العنصر',
      description: 'مرر إلى العنصر إذا كان خارج الشاشة',
      priority: 5,
      condition: (ctx) => ctx.errorType === 'hidden',
      execute: this.scrollToElement.bind(this),
      timeoutMs: 500,
      successRate: 0.89,
      isAggressive: false,
    });

    // الاستراتيجية 6: تنشيط JavaScript
    this.registerStrategy({
      id: 'trigger-javascript',
      name: 'تنشيط أحداث JavaScript',
      description: 'شغّل أحداث JS قد تحضر العنصر',
      priority: 6,
      condition: (ctx) => ctx.errorType === 'javascript',
      execute: this.triggerJavaScript.bind(this),
      timeoutMs: 1000,
      successRate: 0.64,
      isAggressive: true,
    });

    // الاستراتيجية 7: البحث الهرمي
    this.registerStrategy({
      id: 'hierarchical-search',
      name: 'البحث الهرمي عن العنصر',
      description: 'ابحث عن العنصر من خلال التسلسل الهرمي للعناصر الأب',
      priority: 7,
      condition: (ctx) => ctx.errorType === 'not_found',
      execute: this.hierarchicalSearch.bind(this),
      timeoutMs: 400,
      successRate: 0.75,
      isAggressive: false,
    });

    // الاستراتيجية 8: البحث عن العنصر القريب
    this.registerStrategy({
      id: 'proximity-search',
      name: 'البحث عن عناصر قريبة',
      description: 'ابحث عن عناصر قريبة قد تكون بديل مقبول',
      priority: 8,
      condition: (ctx) => ctx.errorType === 'not_found',
      execute: this.proximitySearch.bind(this),
      timeoutMs: 300,
      successRate: 0.71,
      isAggressive: false,
    });

    // الاستراتيجية 9: إزالة القيود
    this.registerStrategy({
      id: 'remove-constraints',
      name: 'إزالة القيود من المحدد',
      description: 'أزل القيود التي قد تمنع المطابقة',
      priority: 9,
      condition: (ctx) => ctx.errorType === 'not_found' && ctx.attemptCount >= 3,
      execute: this.removeConstraints.bind(this),
      timeoutMs: 200,
      successRate: 0.73,
      isAggressive: true,
    });

    // الاستراتيجية 10: البحث الشامل
    this.registerStrategy({
      id: 'comprehensive-search',
      name: 'بحث شامل عن جميع العناصر التفاعلية',
      description: 'ابحث عن أي عنصر تفاعلي قد يكون مفيد',
      priority: 10,
      condition: (ctx) => ctx.errorType === 'not_found' && ctx.attemptCount >= 5,
      execute: this.comprehensiveSearch.bind(this),
      timeoutMs: 600,
      successRate: 0.62,
      isAggressive: true,
    });
  }

  /**
   * اتخاذ قرار استرجاع ذكي
   */
  async decideRecovery(context: ErrorContext): Promise<RecoveryDecision> {
    // حدد نوع الخطأ بدقة
    const refinedErrorType = this.refineErrorType(context);
    context.errorType = refinedErrorType;

    // ابحث عن نمط متكرر
    const pattern = this.detectPattern(context);
    if (pattern) {
      console.log(`⚠️ نمط خطأ متكرر: ${pattern.name} (${pattern.occurrences} مرات)`);
    }

    // حدد الاستراتيجيات المناسبة
    const applicableStrategies = this.strategies.filter((s) => s.condition(context));

    // رتب حسب الأولوية والأداء
    const sortedStrategies = this.rankStrategies(applicableStrategies, context);

    // اختر الاستراتيجية الأولية
    const primaryStrategy = sortedStrategies[0] || this.strategies[0];

    // حدد الاستراتيجيات البديلة
    const alternativeStrategies = sortedStrategies.slice(1, 4);

    // احسب معدل النجاح المتوقع
    const estimatedSuccessRate = this.calculateExpectedSuccessRate(
      sortedStrategies,
      context
    );

    return {
      strategies: sortedStrategies,
      primaryStrategy,
      alternativeStrategies,
      estimatedSuccessRate,
      reasoning: this.generateRecoveryReasoning(context, primaryStrategy),
    };
  }

  /**
   * تنفيذ استرجاع ذكي
   */
  async executeRecovery(
    decision: RecoveryDecision,
    context: ErrorContext,
    page: any
  ): Promise<{ success: boolean; selector: string | null; strategy: string; message: string }> {
    const startTime = Date.now();

    // حاول الاستراتيجيات بالترتيب
    for (const strategy of decision.strategies) {
      try {
        const result = await Promise.race([
          strategy.execute(context, page),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), strategy.timeoutMs)
          ),
        ]);

        if (result) {
          const timeElapsed = Date.now() - startTime;
          const attempt: ErrorAttempt = {
            strategy: strategy.id,
            selector: result,
            success: true,
            timeMs: timeElapsed,
            timestamp: Date.now(),
          };

          this.recordAttempt(attempt);
          this.updateStrategyStats(strategy.id, true, timeElapsed);

          return {
            success: true,
            selector: result,
            strategy: strategy.name,
            message: `✅ نجح الاسترجاع باستخدام ${strategy.name} في ${timeElapsed}ms`,
          };
        }
      } catch (error) {
        const timeElapsed = Date.now() - startTime;
        const attempt: ErrorAttempt = {
          strategy: strategy.id,
          selector: context.selector,
          success: false,
          timeMs: timeElapsed,
          error: String(error),
          timestamp: Date.now(),
        };

        this.recordAttempt(attempt);
        this.updateStrategyStats(strategy.id, false, timeElapsed);

        // تابع للاستراتيجية التالية
        continue;
      }
    }

    return {
      success: false,
      selector: null,
      strategy: 'none',
      message: '❌ فشلت جميع محاولات الاسترجاع',
    };
  }

  /**
   * تحسين نوع الخطأ
   */
  private refineErrorType(
    context: ErrorContext
  ): 'not_found' | 'timeout' | 'hidden' | 'disabled' | 'stale' | 'permission' | 'javascript' | 'network' | 'unknown' {
    // إذا كان هناك نمط معروف، استخدمه
    if (context.attemptCount > 0) {
      const lastAttempt = context.previousAttempts[context.previousAttempts.length - 1];
      if (lastAttempt && lastAttempt.error) {
        if (lastAttempt.error.includes('stale')) return 'stale';
        if (lastAttempt.error.includes('permission')) return 'permission';
        if (lastAttempt.error.includes('disabled')) return 'disabled';
      }
    }

    return context.errorType;
  }

  /**
   * كشف الأنماط المتكررة
   */
  private detectPattern(context: ErrorContext): ErrorPattern | null {
    const patternKey = `${context.selector}:${context.errorType}`;

    let pattern = this.errorPatterns.get(patternKey);
    if (!pattern) {
      pattern = {
        key: patternKey,
        selector: context.selector,
        errorType: context.errorType,
        occurrences: 0,
        lastOccurrence: Date.now(),
        name: `خطأ ${context.errorType} في ${context.elementType}`,
      };
      this.errorPatterns.set(patternKey, pattern);
    }

    pattern.occurrences++;
    pattern.lastOccurrence = Date.now();

    if (pattern.occurrences >= this.PATTERN_THRESHOLD) {
      return pattern;
    }

    return null;
  }

  /**
   * ترتيب الاستراتيجيات
   */
  private rankStrategies(
    strategies: RecoveryStrategy[],
    context: ErrorContext
  ): RecoveryStrategy[] {
    return [...strategies].sort((a, b) => {
      // حصل على إحصائيات الأداء
      const statsA = this.strategyPerformance.get(a.id);
      const statsB = this.strategyPerformance.get(b.id);

      // احسب درجة كل استراتيجية
      const scoreA = this.calculateStrategyScore(a, statsA, context);
      const scoreB = this.calculateStrategyScore(b, statsB, context);

      return scoreB - scoreA; // من الأعلى إلى الأقل
    });
  }

  /**
   * حساب درجة الاستراتيجية
   */
  private calculateStrategyScore(
    strategy: RecoveryStrategy,
    stats: StrategyStats | undefined,
    context: ErrorContext
  ): number {
    let score = strategy.successRate * 100; // الدرجة الأساسية

    // أضف درجة بناءً على الأداء التاريخي
    if (stats) {
      const actualSuccessRate = stats.successes / (stats.successes + stats.failures || 1);
      score += actualSuccessRate * 20;

      // أفضل الاستراتيجيات السريعة
      const avgTime = stats.totalTime / (stats.successes + stats.failures);
      if (avgTime < 200) score += 10;
    }

    // قلل الدرجة إذا كانت عدوانية ولم تكن ضرورية
    if (strategy.isAggressive && context.attemptCount < 3) {
      score -= 15;
    }

    return score;
  }

  /**
   * حساب معدل النجاح المتوقع
   */
  private calculateExpectedSuccessRate(
    strategies: RecoveryStrategy[],
    context: ErrorContext
  ): number {
    if (strategies.length === 0) return 0;

    // احسب احتمالية النجاح للاستراتيجية الأولى
    let successRate = strategies[0].successRate;

    // أضف احتمالية النجاح من الاستراتيجيات البديلة
    for (let i = 1; i < Math.min(3, strategies.length); i++) {
      const remainingProbability = 1 - successRate;
      successRate += remainingProbability * strategies[i].successRate * 0.8;
    }

    return Math.min(1, successRate);
  }

  /**
   * توليد التفسير
   */
  private generateRecoveryReasoning(context: ErrorContext, strategy: RecoveryStrategy): string {
    return `محاولة ${strategy.name} لاسترجاع ${context.elementType} - نوع الخطأ: ${context.errorType}`;
  }

  // ============ تنفيذ الاستراتيجيات ============

  private async simplifySelector(context: ErrorContext, page: any): Promise<string | null> {
    const parts = context.selector.split(/[\s>+~]/);
    for (let i = 0; i < parts.length; i++) {
      const simplified = parts.slice(i).join(' ');
      try {
        const element = page.locator(simplified).first();
        if (element) return simplified;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async intelligentWait(context: ErrorContext, page: any): Promise<string | null> {
    const maxWait = Math.min(5000, 1000 * context.attemptCount);
    try {
      const element = page.locator(context.selector).first();
      await element.waitFor({ timeout: maxWait });
      return context.selector;
    } catch {
      return null;
    }
  }

  private async alternativeSearch(context: ErrorContext, page: any): Promise<string | null> {
    const alternatives = [
      context.selector.replace(/\[.*?\]/g, ''), // إزالة الخصائص
      context.selector.replace(/\.[\w-]+/g, ''), // إزالة الفئات
      context.selector.replace(/#[\w-]+/g, ''), // إزالة المعرفات
    ];

    for (const alt of alternatives) {
      try {
        const element = page.locator(alt).first();
        if (element) return alt;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async textBasedSearch(context: ErrorContext, page: any): Promise<string | null> {
    if (!context.elementText) return null;
    const selector = `:has-text("${context.elementText}")`;
    try {
      const element = page.locator(selector).first();
      if (element) return selector;
    } catch {
      return null;
    }
  }

  private async scrollToElement(context: ErrorContext, page: any): Promise<string | null> {
    try {
      const element = page.locator(context.selector).first();
      await element.scrollIntoViewIfNeeded();
      return context.selector;
    } catch {
      return null;
    }
  }

  private async triggerJavaScript(context: ErrorContext, page: any): Promise<string | null> {
    try {
      await page.evaluate(() => {
        document.querySelectorAll('*').forEach((el: any) => {
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });
      
      const element = page.locator(context.selector).first();
      if (element) return context.selector;
    } catch {
      return null;
    }
  }

  private async hierarchicalSearch(context: ErrorContext, page: any): Promise<string | null> {
    const parts = context.selector.split(' > ');
    for (let i = 0; i < parts.length; i++) {
      const search = parts.slice(i).join(' > ');
      try {
        const element = page.locator(search).first();
        if (element) return search;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async proximitySearch(context: ErrorContext, page: any): Promise<string | null> {
    try {
      const baseType = context.elementType.split('-')[0];
      const selector = `${baseType}:visible`;
      const element = page.locator(selector).first();
      if (element) return selector;
    } catch {
      return null;
    }
  }

  private async removeConstraints(context: ErrorContext, page: any): Promise<string | null> {
    let modified = context.selector;
    modified = modified.replace(/\[disabled\]/g, '');
    modified = modified.replace(/\[hidden\]/g, '');
    modified = modified.replace(/:disabled/g, '');
    modified = modified.replace(/:hidden/g, '');

    try {
      const element = page.locator(modified).first();
      if (element) return modified;
    } catch {
      return null;
    }
  }

  private async comprehensiveSearch(context: ErrorContext, page: any): Promise<string | null> {
    const selectors = [
      'button:visible',
      '[role="button"]:visible',
      'a[href]:visible',
      'input:visible',
      'select:visible',
      '[contenteditable="true"]:visible',
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (element) return selector;
      } catch {
        continue;
      }
    }
    return null;
  }

  // ============ إدارة الإحصائيات ============

  private registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategyPerformance.set(strategy.id, {
      id: strategy.id,
      successes: 0,
      failures: 0,
      totalTime: 0,
    });
  }

  private updateStrategyStats(id: string, success: boolean, timeMs: number): void {
    const stats = this.strategyPerformance.get(id);
    if (stats) {
      if (success) {
        stats.successes++;
      } else {
        stats.failures++;
      }
      stats.totalTime += timeMs;
    }
  }

  private recordAttempt(attempt: ErrorAttempt): void {
    this.recoveryHistory.push(attempt);
    if (this.recoveryHistory.length > this.MAX_HISTORY) {
      this.recoveryHistory.shift();
    }
  }

  /**
   * الحصول على الإحصائيات
   */
  getStatistics() {
    const stats: Record<string, any> = {};
    this.strategyPerformance.forEach((stat, id) => {
      const total = stat.successes + stat.failures;
      if (total > 0) {
        stats[id] = {
          successRate: `${((stat.successes / total) * 100).toFixed(1)}%`,
          totalAttempts: total,
          averageTime: `${(stat.totalTime / total).toFixed(0)}ms`,
        };
      }
    });

    return {
      totalAttempts: this.recoveryHistory.length,
      patternCount: this.errorPatterns.size,
      strategies: stats,
    };
  }
}

// الواجهات الإضافية
interface StrategyStats {
  id: string;
  successes: number;
  failures: number;
  totalTime: number;
}

interface ErrorPattern {
  key: string;
  selector: string;
  errorType: string;
  occurrences: number;
  lastOccurrence: number;
  name: string;
}

// تصدير الكائن الفردي
export const intelligentErrorRecovery = new IntelligentErrorRecovery();
