/**
 * محرك التعلم - يتعلم من التجارب السابقة ويحسن الأداء
 * Learning Engine - Learns from past experiences and improves performance
 */

import { databaseSync } from './database-sync';

export interface Experience {
  id: string;
  taskType: string;
  website: string;
  action: string;
  selector: string;
  success: boolean;
  timestamp: Date;
  context: {
    url: string;
    pageStructure?: any;
    errorMessage?: string;
  };
  metadata: {
    executionTime: number;
    retryCount: number;
    confidence: number;
  };
}

export interface Pattern {
  id: string;
  type: 'selector' | 'workflow' | 'error' | 'timing';
  pattern: string;
  successRate: number;
  occurrences: number;
  contexts: string[];
  lastUsed: Date;
  effectiveness: number;
}

export interface LearningModel {
  domain: string;
  patterns: Pattern[];
  successfulStrategies: Map<string, number>;
  failurePatterns: Map<string, number>;
  optimizations: Map<string, any>;
  lastUpdated: Date;
}

/**
 * محرك التعلم الآلي للروبوت
 */
export class LearningEngine {
  private experiences: Experience[] = [];
  private patterns: Map<string, Pattern> = new Map();
  private models: Map<string, LearningModel> = new Map();
  private readonly maxExperiences = 10000;

  /**
   * تسجيل تجربة جديدة
   */
  async recordExperience(experience: Experience): Promise<void> {
    this.experiences.push(experience);

    // الحفاظ على حد أقصى من التجارب
    if (this.experiences.length > this.maxExperiences) {
      this.experiences = this.experiences.slice(-this.maxExperiences);
    }

    // تحديث الأنماط
    await this.updatePatterns(experience);

    // تحديث النموذج للموقع
    await this.updateModel(experience.website, experience);

    // حفظ في قاعدة البيانات
    await this.persistExperience(experience);
  }

  /**
   * الحصول على أفضل selector بناءً على التعلم
   */
  async getBestSelector(
    taskType: string,
    website: string,
    context: any
  ): Promise<{ selector: string; confidence: number }> {
    // البحث في التجارب السابقة
    const relevantExperiences = this.experiences.filter(
      (e) =>
        e.taskType === taskType &&
        e.website === website &&
        e.success === true
    );

    if (relevantExperiences.length === 0) {
      // لا توجد تجارب - استخدام القيم الافتراضية
      return {
        selector: this.getDefaultSelector(taskType),
        confidence: 0.3,
      };
    }

    // حساب معدل النجاح لكل selector
    const selectorStats = new Map<string, { success: number; total: number }>();

    relevantExperiences.forEach((exp) => {
      const stats = selectorStats.get(exp.selector) || { success: 0, total: 0 };
      stats.total++;
      if (exp.success) stats.success++;
      selectorStats.set(exp.selector, stats);
    });

    // العثور على أفضل selector
    let bestSelector = '';
    let bestSuccessRate = 0;

    selectorStats.forEach((stats, selector) => {
      const successRate = stats.success / stats.total;
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate;
        bestSelector = selector;
      }
    });

    return {
      selector: bestSelector,
      confidence: bestSuccessRate,
    };
  }

  /**
   * التنبؤ بأفضل استراتيجية لمهمة معينة
   */
  async predictBestStrategy(
    taskType: string,
    website: string,
    context: any
  ): Promise<{
    strategy: string;
    steps: any[];
    confidence: number;
    reasoning: string;
  }> {
    const model = this.models.get(website);

    if (!model) {
      return {
        strategy: 'default',
        steps: [],
        confidence: 0.4,
        reasoning: 'لا توجد تجارب سابقة - استخدام الاستراتيجية الافتراضية',
      };
    }

    // تحليل الاستراتيجيات الناجحة
    const strategies = Array.from(model.successfulStrategies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (strategies.length > 0) {
      const [bestStrategy, successCount] = strategies[0];
      const totalAttempts = successCount + (model.failurePatterns.get(bestStrategy) || 0);
      const confidence = totalAttempts > 0 ? successCount / totalAttempts : 0.5;

      return {
        strategy: bestStrategy,
        steps: this.getStrategySteps(bestStrategy, model),
        confidence,
        reasoning: `تم استخدام هذه الاستراتيجية ${successCount} مرة بنجاح`,
      };
    }

    return {
      strategy: 'adaptive',
      steps: [],
      confidence: 0.5,
      reasoning: 'استخدام استراتيجية تكيفية بناءً على السياق',
    };
  }

  /**
   * تحليل أسباب الفشل وتقديم توصيات
   */
  async analyzeFailures(website: string): Promise<{
    commonErrors: Array<{ error: string; count: number; solution: string }>;
    recommendations: string[];
  }> {
    const failedExperiences = this.experiences.filter(
      (e) => e.website === website && !e.success
    );

    // تجميع الأخطاء الشائعة
    const errorCounts = new Map<string, number>();
    failedExperiences.forEach((exp) => {
      if (exp.context.errorMessage) {
        const count = errorCounts.get(exp.context.errorMessage) || 0;
        errorCounts.set(exp.context.errorMessage, count + 1);
      }
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({
        error,
        count,
        solution: this.suggestSolution(error),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // تقديم توصيات
    const recommendations = this.generateRecommendations(
      failedExperiences,
      commonErrors
    );

    return { commonErrors, recommendations };
  }

  /**
   * تحسين النموذج بناءً على التغذية الراجعة
   */
  async optimizeModel(website: string, feedback: any): Promise<void> {
    let model = this.models.get(website);

    if (!model) {
      model = {
        domain: website,
        patterns: [],
        successfulStrategies: new Map(),
        failurePatterns: new Map(),
        optimizations: new Map(),
        lastUpdated: new Date(),
      };
      this.models.set(website, model);
    }

    // تطبيق التحسينات
    if (feedback.type === 'success') {
      const count = model.successfulStrategies.get(feedback.strategy) || 0;
      model.successfulStrategies.set(feedback.strategy, count + 1);
    } else {
      const count = model.failurePatterns.get(feedback.strategy) || 0;
      model.failurePatterns.set(feedback.strategy, count + 1);
    }

    model.lastUpdated = new Date();

    // حفظ التحسينات
    await this.persistModel(model);
  }

  /**
   * الحصول على إحصائيات التعلم
   */
  getStatistics(): {
    totalExperiences: number;
    totalPatterns: number;
    totalModels: number;
    averageSuccessRate: number;
    topPerformingWebsites: Array<{ website: string; successRate: number }>;
  } {
    const totalExperiences = this.experiences.length;
    const successfulExperiences = this.experiences.filter((e) => e.success).length;
    const averageSuccessRate =
      totalExperiences > 0 ? successfulExperiences / totalExperiences : 0;

    // حساب أفضل المواقع أداءً
    const websiteStats = new Map<string, { success: number; total: number }>();
    this.experiences.forEach((exp) => {
      const stats = websiteStats.get(exp.website) || { success: 0, total: 0 };
      stats.total++;
      if (exp.success) stats.success++;
      websiteStats.set(exp.website, stats);
    });

    const topPerformingWebsites = Array.from(websiteStats.entries())
      .map(([website, stats]) => ({
        website,
        successRate: stats.success / stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      totalExperiences,
      totalPatterns: this.patterns.size,
      totalModels: this.models.size,
      averageSuccessRate,
      topPerformingWebsites,
    };
  }

  /**
   * الحصول على جميع التجارب
   */
  getAllExperiences(): Experience[] {
    return [...this.experiences];
  }

  /**
   * الحصول على جميع الأنماط
   */
  getAllPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * مسح جميع البيانات
   */
  clearAll(): void {
    this.experiences = [];
    this.patterns.clear();
    this.models.clear();
  }

  /**
   * تصدير النموذج المُدرب
   */
  exportModel(website: string): LearningModel | null {
    return this.models.get(website) || null;
  }

  /**
   * استيراد نموذج مُدرب
   */
  importModel(model: LearningModel): void {
    this.models.set(model.domain, model);
  }

  // ====== وظائف مساعدة خاصة ======

  private async updatePatterns(experience: Experience): Promise<void> {
    const patternKey = `${experience.taskType}_${experience.selector}`;
    let pattern = this.patterns.get(patternKey);

    if (!pattern) {
      pattern = {
        id: patternKey,
        type: 'selector',
        pattern: experience.selector,
        successRate: 0,
        occurrences: 0,
        contexts: [],
        lastUsed: new Date(),
        effectiveness: 0,
      };
      this.patterns.set(patternKey, pattern);
    }

    pattern.occurrences++;
    pattern.lastUsed = new Date();

    if (experience.success) {
      pattern.successRate =
        (pattern.successRate * (pattern.occurrences - 1) + 1) / pattern.occurrences;
    } else {
      pattern.successRate =
        (pattern.successRate * (pattern.occurrences - 1)) / pattern.occurrences;
    }

    pattern.effectiveness = pattern.successRate * Math.log(pattern.occurrences + 1);

    if (!pattern.contexts.includes(experience.website)) {
      pattern.contexts.push(experience.website);
    }
  }

  private async updateModel(website: string, experience: Experience): Promise<void> {
    let model = this.models.get(website);

    if (!model) {
      model = {
        domain: website,
        patterns: [],
        successfulStrategies: new Map(),
        failurePatterns: new Map(),
        optimizations: new Map(),
        lastUpdated: new Date(),
      };
      this.models.set(website, model);
    }

    // تحديث الاستراتيجيات
    const strategyKey = `${experience.taskType}_${experience.action}`;
    if (experience.success) {
      const count = model.successfulStrategies.get(strategyKey) || 0;
      model.successfulStrategies.set(strategyKey, count + 1);
    } else {
      const count = model.failurePatterns.get(strategyKey) || 0;
      model.failurePatterns.set(strategyKey, count + 1);
    }

    model.lastUpdated = new Date();
  }

  private getDefaultSelector(taskType: string): string {
    const defaults: { [key: string]: string } = {
      login_email: 'input[type="email"], #email, input[name="email"]',
      login_password: 'input[type="password"], #password',
      login_submit: 'button[type="submit"], .login-button',
      signup_email: 'input[type="email"], #email',
      signup_username: '#username, input[name="username"]',
      signup_password: 'input[type="password"], #password',
    };

    return defaults[taskType] || 'input';
  }

  private getStrategySteps(strategy: string, model: LearningModel): any[] {
    // استخراج الخطوات من الاستراتيجية
    return [];
  }

  private suggestSolution(error: string): string {
    const solutions: { [key: string]: string } = {
      'element not found': 'جرب استخدام selectors بديلة أو انتظر تحميل الصفحة',
      timeout: 'زيادة وقت الانتظار أو التحقق من سرعة الاتصال',
      'invalid selector': 'تحديث الـ selector ليتطابق مع بنية الصفحة الحالية',
      captcha: 'استخدام خدمة حل CAPTCHA أو التبديل لاستراتيجية مختلفة',
    };

    const errorLower = error.toLowerCase();
    for (const [key, solution] of Object.entries(solutions)) {
      if (errorLower.includes(key)) {
        return solution;
      }
    }

    return 'تحليل السبب الجذري والمحاولة مرة أخرى';
  }

  private generateRecommendations(
    failures: Experience[],
    commonErrors: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (failures.length > 10) {
      recommendations.push('معدل الفشل مرتفع - يُنصح بمراجعة الاستراتيجية العامة');
    }

    if (commonErrors.some((e) => e.error.includes('timeout'))) {
      recommendations.push('زيادة أوقات الانتظار أو استخدام انتظار ديناميكي');
    }

    if (commonErrors.some((e) => e.error.includes('selector'))) {
      recommendations.push('تحديث الـ selectors أو استخدام استراتيجيات كشف ذكية');
    }

    const avgRetries =
      failures.reduce((sum, f) => sum + f.metadata.retryCount, 0) / failures.length;
    if (avgRetries > 2) {
      recommendations.push('معدل المحاولات مرتفع - تحسين منطق إعادة المحاولة');
    }

    return recommendations;
  }

  private async persistExperience(experience: Experience): Promise<void> {
    // حفظ في قاعدة البيانات (Supabase)
    // سيتم التنفيذ عند الدمج مع Supabase
    console.log('💾 حفظ التجربة:', experience.id);
  }

  private async persistModel(model: LearningModel): Promise<void> {
    // حفظ النموذج في قاعدة البيانات
    console.log('💾 حفظ النموذج:', model.domain);
  }
}

// مثيل مشترك
export const learningEngine = new LearningEngine();
