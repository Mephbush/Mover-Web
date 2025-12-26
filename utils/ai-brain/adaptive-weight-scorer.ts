/**
 * نظام الأوزان القابلة للتكيف
 * Adaptive Weight Scoring System
 *
 * يتعلم من أداء المحددات على كل موقع ويضبط الأوزان تلقائياً
 * يستخدم تحليل المجموعات (clustering) لتجميع الأداء المتشابهة
 */

export interface SelectorPerformanceData {
  selector: string;
  domain: string;
  success: boolean;
  executionTime: number;
  confidence: number;
  timestamp: Date;
  selectorType: 'id' | 'class' | 'data-testid' | 'aria-label' | 'xpath' | 'hybrid' | 'text';
}

export interface DomainWeights {
  domain: string;
  weights: {
    id: number;
    class: number;
    dataTestId: number;
    ariaLabel: number;
    xpath: number;
    hybrid: number;
    text: number;
  };
  successRates: {
    [key: string]: number; // selectorType -> success rate
  };
  lastUpdated: Date;
  trainingDataCount: number;
}

export interface AdaptiveWeightConfig {
  learningRate: number; // كم سرعة تكيف الأوزان (0-1)
  minTrainingData: number; // حد أدنى من البيانات قبل التكيف
  decayFactor: number; // معامل تآكل البيانات القديمة
  convergenceThreshold: number; // عتبة التقارب للتوقف عن التعديل
}

/**
 * نظام الأوزان القابلة للتكيف
 */
export class AdaptiveWeightScorer {
  private domainWeights: Map<string, DomainWeights> = new Map();
  private performanceHistory: SelectorPerformanceData[] = [];
  private config: AdaptiveWeightConfig;
  private readonly maxHistorySize = 10000;

  // الأوزان الافتراضية (baseline)
  private defaultWeights = {
    id: 0.95,
    class: 0.75,
    dataTestId: 0.90,
    ariaLabel: 0.85,
    xpath: 0.65,
    hybrid: 0.70,
    text: 0.50,
  };

  constructor(config: Partial<AdaptiveWeightConfig> = {}) {
    this.config = {
      learningRate: 0.1,
      minTrainingData: 30,
      decayFactor: 0.99,
      convergenceThreshold: 0.01,
      ...config,
    };
  }

  /**
   * تسجيل نتيجة تنفيذ محدد
   */
  recordPerformance(data: SelectorPerformanceData): void {
    this.performanceHistory.push(data);

    // محدود حجم السجل
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }

    // تحديث الأوزان للموقع (كل 10 تسجيلات)
    if (this.performanceHistory.length % 10 === 0) {
      this.updateWeightsForDomain(data.domain);
    }
  }

  /**
   * الحصول على الأوزان المحسنة لموقع معين
   */
  getWeightsForDomain(domain: string): DomainWeights {
    if (this.domainWeights.has(domain)) {
      return this.domainWeights.get(domain)!;
    }

    // إنشاء أوزان جديدة بناءً على الافتراضية
    const weights: DomainWeights = {
      domain,
      weights: { ...this.defaultWeights },
      successRates: {},
      lastUpdated: new Date(),
      trainingDataCount: 0,
    };

    this.domainWeights.set(domain, weights);
    return weights;
  }

  /**
   * تحديث الأوزان لموقع معين بناءً على البيانات التاريخية
   */
  private updateWeightsForDomain(domain: string): void {
    // استخرج البيانات الخاصة بهذا الموقع من آخر 100 تسجيل
    const domainData = this.performanceHistory
      .slice(-100)
      .filter(d => d.domain === domain);

    if (domainData.length < this.config.minTrainingData) {
      // بيانات غير كافية للتكيف
      return;
    }

    // حساب معدل النجاح لكل نوع
    const successRates: { [key: string]: number } = {};
    const typeCounts: { [key: string]: { success: number; total: number } } = {};

    domainData.forEach((perf) => {
      if (!typeCounts[perf.selectorType]) {
        typeCounts[perf.selectorType] = { success: 0, total: 0 };
      }
      typeCounts[perf.selectorType].total++;
      if (perf.success) {
        typeCounts[perf.selectorType].success++;
      }
    });

    // حساب معدلات النجاح
    Object.entries(typeCounts).forEach(([type, counts]) => {
      successRates[type] = counts.success / counts.total;
    });

    // تحديث الأوزان بناءً على معدلات النجاح
    this.adaptWeights(domain, successRates);
  }

  /**
   * تكيف الأوزان بناءً على معدلات النجاح الحقيقية
   */
  private adaptWeights(domain: string, successRates: { [key: string]: number }): void {
    const currentWeights = this.getWeightsForDomain(domain);
    let hasSignificantChange = false;

    // استخدام الفارق بين معدل النجاح والوزن الحالي
    Object.entries(successRates).forEach(([type, successRate]) => {
      const weightKey = type as keyof DomainWeights['weights'];
      if (currentWeights.weights[weightKey] === undefined) {
        return;
      }

      const currentWeight = currentWeights.weights[weightKey];
      const difference = successRate - currentWeight;

      // تطبيق learning rate للتغيير التدريجي
      const newWeight = currentWeight + difference * this.config.learningRate;
      const boundedWeight = Math.max(0.1, Math.min(1.0, newWeight));

      // التحقق من التغيير الهام
      if (Math.abs(boundedWeight - currentWeight) > this.config.convergenceThreshold) {
        hasSignificantChange = true;
      }

      currentWeights.weights[weightKey] = boundedWeight;
    });

    // تطبيق عامل التآكل (decay) على الأوزان القديمة
    Object.keys(currentWeights.weights).forEach((key) => {
      if (!successRates[key]) {
        const weightKey = key as keyof DomainWeights['weights'];
        currentWeights.weights[weightKey] *= this.config.decayFactor;
      }
    });

    // تحديث البيانات الوصفية
    currentWeights.successRates = successRates;
    currentWeights.lastUpdated = new Date();
    currentWeights.trainingDataCount = this.performanceHistory
      .filter(d => d.domain === domain).length;

    if (hasSignificantChange) {
      console.log(`📊 تم تحديث الأوزان للموقع: ${domain}`);
      console.log(`   الأوزان الجديدة:`, currentWeights.weights);
      console.log(`   معدلات النجاح:`, successRates);
    }
  }

  /**
   * حساب درجة نهائية مخصصة للموقع
   */
  calculateAdaptiveScore(
    domain: string,
    selectorType: string,
    baseScore: number,
    confidence: number
  ): number {
    const weights = this.getWeightsForDomain(domain);

    // الحصول على الوزن المناسب للنوع
    const typeWeight = weights.weights[selectorType as keyof DomainWeights['weights']] ||
      this.defaultWeights[selectorType as keyof typeof this.defaultWeights] ||
      0.5;

    // الحصول على معدل النجاح للنوع (إن توفر)
    const successRate = weights.successRates[selectorType] || 0.5;

    // حساب الدرجة النهائية المخصصة
    // = الدرجة الأساسية × وزن الموقع × معدل النجاح الفعلي × الثقة
    return baseScore * typeWeight * successRate * confidence;
  }

  /**
   * إعادة تعيين الأوزان للموقع (للاختبار)
   */
  resetDomainWeights(domain: string): void {
    this.domainWeights.delete(domain);
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getPerformanceStats(domain: string): {
    totalAttempts: number;
    successRate: number;
    averageExecutionTime: number;
    bestPerformingType: string;
    worstPerformingType: string;
  } {
    const domainData = this.performanceHistory.filter(d => d.domain === domain);

    if (domainData.length === 0) {
      return {
        totalAttempts: 0,
        successRate: 0,
        averageExecutionTime: 0,
        bestPerformingType: 'unknown',
        worstPerformingType: 'unknown',
      };
    }

    const successCount = domainData.filter(d => d.success).length;
    const successRate = successCount / domainData.length;
    const averageTime = domainData.reduce((sum, d) => sum + d.executionTime, 0) /
      domainData.length;

    // حساب أفضل وأسوأ أنواع المحددات
    const typePerformance: { [key: string]: { success: number; total: number } } = {};

    domainData.forEach((d) => {
      if (!typePerformance[d.selectorType]) {
        typePerformance[d.selectorType] = { success: 0, total: 0 };
      }
      typePerformance[d.selectorType].total++;
      if (d.success) {
        typePerformance[d.selectorType].success++;
      }
    });

    let bestType = 'unknown';
    let worstType = 'unknown';
    let bestRate = -1;
    let worstRate = 2;

    Object.entries(typePerformance).forEach(([type, perf]) => {
      const rate = perf.success / perf.total;
      if (rate > bestRate) {
        bestRate = rate;
        bestType = type;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstType = type;
      }
    });

    return {
      totalAttempts: domainData.length,
      successRate,
      averageExecutionTime: averageTime,
      bestPerformingType: bestType,
      worstPerformingType: worstType,
    };
  }

  /**
   * تصدير البيانات للتدريب خارج العملية
   */
  exportTrainingData(): {
    performanceHistory: SelectorPerformanceData[];
    domainWeights: Record<string, DomainWeights>;
  } {
    const domainWeightsRecord: Record<string, DomainWeights> = {};
    this.domainWeights.forEach((weights, domain) => {
      domainWeightsRecord[domain] = weights;
    });

    return {
      performanceHistory: this.performanceHistory,
      domainWeights: domainWeightsRecord,
    };
  }

  /**
   * استيراد بيانات التدريب المحفوظة
   */
  importTrainingData(data: {
    performanceHistory?: SelectorPerformanceData[];
    domainWeights?: Record<string, DomainWeights>;
  }): void {
    if (data.performanceHistory) {
      this.performanceHistory = [
        ...this.performanceHistory,
        ...data.performanceHistory,
      ].slice(-this.maxHistorySize);
    }

    if (data.domainWeights) {
      Object.entries(data.domainWeights).forEach(([domain, weights]) => {
        this.domainWeights.set(domain, weights);
      });
    }
  }
}

// Singleton instance
export const adaptiveWeightScorer = new AdaptiveWeightScorer({
  learningRate: 0.15,
  minTrainingData: 20,
  decayFactor: 0.995,
  convergenceThreshold: 0.02,
});
