/**
 * نظام استراتيجيات الاسترجاع المحسّن
 * Enhanced Error Recovery System - معالجة ذكية للأخطاء والفشل
 * 
 * يتعامل مع:
 * 1. محددات فاشلة
 * 2. عناصر مخفية أو غير متاحة
 * 3. ديناميكيات الصفحة والتحميل البطيء
 * 4. تغييرات الهيكل والتصميم
 */

export interface RecoveryAttempt {
  strategy: string;
  selector: string;
  success: boolean;
  executionTime: number;
  foundElements: number;
  confidence: number;
  reason?: string;
}

export interface RecoveryStrategy {
  name: string;
  priority: number;
  description: string;
  condition: (context: RecoveryContext) => boolean;
  execute: (context: RecoveryContext) => Promise<string | null>;
  maxRetries: number;
  timeout: number;
}

export interface RecoveryContext {
  originalSelector: string;
  domain: string;
  elementType: string;
  elementText?: string;
  pageStructure?: string;
  previousAttempts: RecoveryAttempt[];
  pageContent?: string;
  error?: any;
}

/**
 * محرك الاسترجاع المحسّن
 */
export class EnhancedErrorRecoveryEngine {
  private strategies: RecoveryStrategy[] = [];
  private recoveryHistory: RecoveryAttempt[] = [];
  private successRate: Map<string, { success: number; total: number }> = new Map();
  private readonly maxHistorySize = 500;

  constructor() {
    this.initializeStrategies();
  }

  /**
   * تهيئة استراتيجيات الاسترجاع
   */
  private initializeStrategies(): void {
    // الاستراتيجية 1: إزالة المحدد الأول والبحث عن العنصر الثاني
    this.strategies.push({
      name: 'First-to-Second Switch',
      priority: 95,
      description: 'تبديل من العنصر الأول إلى الثاني إذا كان الأول غير متاح',
      condition: (context) =>
        context.previousAttempts.length === 1 &&
        !context.previousAttempts[0].success,
      execute: async (context) => {
        const { originalSelector } = context;
        if (!originalSelector.includes(':first')) {
          return `${originalSelector}:nth-of-type(2)`;
        }
        return null;
      },
      maxRetries: 1,
      timeout: 5000,
    });

    // الاستراتيجية 2: استخدام :visible للعناصر المخفية
    this.strategies.push({
      name: 'Visibility Filter',
      priority: 90,
      description: 'تصفية العناصر المخفية باستخدام :visible',
      condition: (context) =>
        !context.originalSelector.includes(':visible'),
      execute: async (context) => {
        return `${context.originalSelector}:visible`;
      },
      maxRetries: 1,
      timeout: 5000,
    });

    // الاستراتيجية 3: التخلص من المحددات المعقدة
    this.strategies.push({
      name: 'Simplification',
      priority: 85,
      description: 'تبسيط المحدد بإزالة العلاقات الهرمية',
      condition: (context) =>
        context.originalSelector.includes('>') ||
        context.originalSelector.includes('+'),
      execute: async (context) => {
        // استخرج آخر جزء من المحدد
        const parts = context.originalSelector.split(/[>+\s]/);
        const lastPart = parts[parts.length - 1];
        return lastPart || null;
      },
      maxRetries: 2,
      timeout: 5000,
    });

    // الاستراتيجية 4: البحث بناءً على النص
    this.strategies.push({
      name: 'Text-Based Search',
      priority: 80,
      description: 'البحث عن العنصر باستخدام محتواه النصي',
      condition: (context) => !!context.elementText && !context.originalSelector.includes(':has-text'),
      execute: async (context) => {
        if (!context.elementText) return null;
        return `:has-text("${context.elementText}")`;
      },
      maxRetries: 1,
      timeout: 5000,
    });

    // الاستراتيجية 5: البحث بناءً على الدور (ARIA Role)
    this.strategies.push({
      name: 'ARIA Role Search',
      priority: 75,
      description: 'البحث باستخدام دور ARIA',
      condition: (context) =>
        ['button', 'link', 'menu', 'modal', 'dialog'].includes(context.elementType),
      execute: async (context) => {
        const roleMap: Record<string, string> = {
          button: 'button',
          link: 'link',
          menu: 'menu',
          modal: 'dialog',
          dialog: 'dialog',
          form: 'form',
          input: 'textbox',
        };
        const role = roleMap[context.elementType];
        return role ? `[role="${role}"]` : null;
      },
      maxRetries: 1,
      timeout: 5000,
    });

    // الاستراتيجية 6: انتظار التحميل الديناميكي
    this.strategies.push({
      name: 'Wait and Retry',
      priority: 70,
      description: 'انتظار لحظة ثم إعادة المحاولة',
      condition: (context) =>
        context.error && context.error.message?.includes('timeout'),
      execute: async (context) => {
        // بعد الانتظار، أرجع المحدد الأصلي للمحاولة مرة أخرى
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return context.originalSelector;
      },
      maxRetries: 2,
      timeout: 7000,
    });

    // الاستراتيجية 7: بحث الآباء
    this.strategies.push({
      name: 'Parent Search',
      priority: 65,
      description: 'البحث عن العنصر الأب إذا فشل البحث المباشر',
      condition: (context) =>
        context.originalSelector.includes(' ') &&
        context.previousAttempts.some((a) => !a.success),
      execute: async (context) => {
        const parts = context.originalSelector.split(' ');
        if (parts.length > 1) {
          return parts[0]; // أرجع أول جزء (العنصر الأب)
        }
        return null;
      },
      maxRetries: 1,
      timeout: 5000,
    });

    // الاستراتيجية 8: استخدام XPath البديل
    this.strategies.push({
      name: 'Alternative Attributes',
      priority: 60,
      description: 'جرب مزيجاً مختلفة من الخصائص',
      condition: (context) => true, // الملاذ الأخير
      execute: async (context) => {
        const { elementType } = context;
        
        // جرب مزيجاً شائعة
        const alternatives = [
          `${elementType}:not([style*="display: none"])`,
          `${elementType}[class]:not(.hidden)`,
          `${elementType}:not(.disabled)`,
          `${elementType}:not([aria-hidden="true"])`,
        ];

        return alternatives[Math.floor(Math.random() * alternatives.length)];
      },
      maxRetries: 2,
      timeout: 5000,
    });

    // ترتيب الاستراتيجيات حسب الأولوية
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * تنفيذ عملية الاسترجاع
   */
  async executeRecovery(context: RecoveryContext): Promise<RecoveryAttempt | null> {
    for (const strategy of this.strategies) {
      // تخطي الاستراتيجيات التي لا تطبق على هذا السياق
      if (!strategy.condition(context)) {
        continue;
      }

      // تنفيذ الاستراتيجية
      const startTime = Date.now();

      try {
        const recoveredSelector = await strategy.execute(context);

        if (recoveredSelector) {
          const attempt: RecoveryAttempt = {
            strategy: strategy.name,
            selector: recoveredSelector,
            success: true,
            executionTime: Date.now() - startTime,
            foundElements: 1,
            confidence: this.calculateStrategyConfidence(strategy),
            reason: strategy.description,
          };

          this.recordRecoveryAttempt(attempt);
          return attempt;
        }
      } catch (error: any) {
        const attempt: RecoveryAttempt = {
          strategy: strategy.name,
          selector: context.originalSelector,
          success: false,
          executionTime: Date.now() - startTime,
          foundElements: 0,
          confidence: 0,
          reason: error.message,
        };

        this.recordRecoveryAttempt(attempt);
      }
    }

    return null;
  }

  /**
   * حساب ثقة الاستراتيجية
   */
  private calculateStrategyConfidence(strategy: RecoveryStrategy): number {
    const stats = this.successRate.get(strategy.name);

    if (!stats) {
      return strategy.priority / 100; // استخدم الأولوية كقيمة افتراضية
    }

    const successRate = (stats.success / stats.total) * 100;
    return successRate / 100;
  }

  /**
   * تسجيل محاولة الاسترجاع
   */
  private recordRecoveryAttempt(attempt: RecoveryAttempt): void {
    this.recoveryHistory.push(attempt);

    // الاحتفاظ بحد أقصى من السجلات
    if (this.recoveryHistory.length > this.maxHistorySize) {
      this.recoveryHistory.shift();
    }

    // تحديث إحصائيات الاستراتيجية
    const stats = this.successRate.get(attempt.strategy) || {
      success: 0,
      total: 0,
    };

    stats.total++;
    if (attempt.success) {
      stats.success++;
    }

    this.successRate.set(attempt.strategy, stats);
  }

  /**
   * تحليل نمط الفشل
   */
  analyzeFailurePattern(selector: string): any {
    const attempts = this.recoveryHistory.filter(
      (a) => a.selector === selector || a.selector.includes(selector.split('[')[0])
    );

    if (attempts.length === 0) {
      return {
        attempts: 0,
        pattern: 'لا توجد محاولات سابقة',
        recommendation: 'جرب استراتيجية جديدة',
      };
    }

    const successCount = attempts.filter((a) => a.success).length;
    const avgTime = attempts.reduce((sum, a) => sum + a.executionTime, 0) / attempts.length;

    return {
      totalAttempts: attempts.length,
      successCount,
      successRate: (successCount / attempts.length) * 100,
      averageExecutionTime: Math.round(avgTime),
      lastAttempt: attempts[attempts.length - 1],
      commonFailure: this.findCommonFailure(attempts),
      recommendation: this.generateFailureRecommendation(attempts, selector),
    };
  }

  /**
   * إيجاد الفشل الشائع
   */
  private findCommonFailure(attempts: RecoveryAttempt[]): string {
    const failures = attempts.filter((a) => !a.success);
    if (failures.length === 0) return 'لا توجد أخطاء';

    const reasons = new Map<string, number>();
    for (const failure of failures) {
      if (failure.reason) {
        const count = (reasons.get(failure.reason) || 0) + 1;
        reasons.set(failure.reason, count);
      }
    }

    let mostCommon = 'غير معروف';
    let maxCount = 0;

    for (const [reason, count] of reasons) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = reason;
      }
    }

    return mostCommon;
  }

  /**
   * توليد توصيات بناءً على الفشل
   */
  private generateFailureRecommendation(attempts: RecoveryAttempt[], selector: string): string[] {
    const recommendations: string[] = [];

    const successfulStrategies = attempts
      .filter((a) => a.success)
      .map((a) => a.strategy);

    if (successfulStrategies.length > 0) {
      recommendations.push(
        `✅ استراتيجيات ناجحة: ${[...new Set(successfulStrategies)].join(', ')}`
      );
    }

    if (selector.includes('button') || selector.includes('input')) {
      recommendations.push('💡 جرب البحث بناءً على النص أو دور ARIA');
    }

    if (selector.length > 100) {
      recommendations.push('💡 المحدد طويل جداً، حاول تبسيطه');
    }

    if (selector.includes(' > ') || selector.includes(' + ')) {
      recommendations.push('💡 حاول إزالة العلاقات الهرمية المعقدة');
    }

    recommendations.push(
      '💡 تحقق من أن العنصر موجود بالفعل على الصفحة وليس مخفياً'
    );

    return recommendations;
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): any {
    const report = {
      totalAttempts: this.recoveryHistory.length,
      successfulRecoveries: this.recoveryHistory.filter((a) => a.success).length,
      failedRecoveries: this.recoveryHistory.filter((a) => !a.success).length,
      averageExecutionTime: 0,
      strategies: [] as any[],
    };

    // حساب متوسط وقت التنفيذ
    if (report.totalAttempts > 0) {
      const totalTime = this.recoveryHistory.reduce(
        (sum, a) => sum + a.executionTime,
        0
      );
      report.averageExecutionTime = Math.round(totalTime / report.totalAttempts);
    }

    // تقرير الاستراتيجيات
    for (const [strategy, stats] of this.successRate) {
      report.strategies.push({
        name: strategy,
        attempts: stats.total,
        successes: stats.success,
        successRate: Math.round((stats.success / stats.total) * 100),
      });
    }

    // ترتيب الاستراتيجيات حسب معدل النجاح
    report.strategies.sort((a, b) => b.successRate - a.successRate);

    return report;
  }

  /**
   * الحصول على سجل الاسترجاع
   */
  getRecoveryHistory(limit: number = 50): RecoveryAttempt[] {
    return this.recoveryHistory.slice(-limit);
  }

  /**
   * إعادة تعيين
   */
  reset(): void {
    this.recoveryHistory = [];
    this.successRate.clear();
  }
}

// تصدير مثيل فردي
export const enhancedErrorRecovery = new EnhancedErrorRecoveryEngine();
