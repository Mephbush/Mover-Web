/**
 * نظام تتبع أداء المحددات
 * Selector Performance Tracker
 * 
 * تتبع دقيق لأداء كل محدد والتعلم من النتائج
 */

export interface SelectorMetrics {
  selector: string;
  website: string;
  taskType: string;
  elementType: string;

  // إحصائيات الاستخدام
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-1

  // إحصائيات الأداء
  averageResponseTime: number; // ms
  minResponseTime: number; // ms
  maxResponseTime: number; // ms
  medianResponseTime: number; // ms

  // إحصائيات الموثوقية
  consistencyScore: number; // 0-1 - كم متسق الأداء
  stabilityScore: number; // 0-1 - كم مستقر المحدد
  degradationRate: number; // نسبة التدهور عبر الوقت

  // بيانات السياق
  lastUsed: Date;
  firstUsed: Date;
  usageFrequency: number; // عدد الاستخدامات يومياً

  // التوصيات
  isReliable: boolean;
  shouldFallback: boolean;
  recommendation: string;

  // التاريخ
  history: MetricEntry[];
}

export interface MetricEntry {
  timestamp: Date;
  success: boolean;
  responseTime: number;
  errorType?: string;
  fallbackUsed: boolean;
  context?: any;
}

export interface SelectorTrend {
  selector: string;
  trend: 'improving' | 'degrading' | 'stable';
  trendScore: number; // -1 (worst) to 1 (best)
  improvement: number; // نسبة التحسن
  forecastedSuccessRate: number;
  confidence: number;
}

export interface SelectorComparison {
  selectors: string[];
  winner: string;
  winnerScore: number;
  scores: Map<string, number>;
  differences: Map<string, number>;
  recommendation: string;
}

/**
 * نظام تتبع أداء المحددات
 */
export class SelectorPerformanceTracker {
  private metrics: Map<string, SelectorMetrics> = new Map();
  private trends: Map<string, SelectorTrend> = new Map();
  private historySize = 1000; // عدد الإدخالات المحفوظة لكل محدد

  /**
   * تسجيل محاولة استخدام محدد
   */
  recordAttempt(
    selector: string,
    website: string,
    taskType: string,
    elementType: string,
    success: boolean,
    responseTime: number,
    errorType?: string,
    fallbackUsed: boolean = false
  ): void {
    const key = this.getMetricsKey(selector, website, taskType, elementType);

    // الحصول على المقاييس الحالية أو إنشاء جديدة
    let metrics = this.metrics.get(key);
    if (!metrics) {
      metrics = this.initializeMetrics(selector, website, taskType, elementType);
      this.metrics.set(key, metrics);
    }

    // تحديث الإحصائيات الأساسية
    metrics.totalAttempts++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }
    metrics.successRate = metrics.successCount / metrics.totalAttempts;

    // تحديث إحصائيات الأداء
    this.updatePerformanceStats(metrics, responseTime);

    // تسجيل الإدخال في السجل
    const entry: MetricEntry = {
      timestamp: new Date(),
      success,
      responseTime,
      errorType,
      fallbackUsed,
    };
    metrics.history.push(entry);

    // الحفاظ على حد أقصى من السجل
    if (metrics.history.length > this.historySize) {
      metrics.history = metrics.history.slice(-this.historySize);
    }

    // تحديث البيانات الزمنية
    metrics.lastUsed = new Date();
    if (metrics.totalAttempts === 1) {
      metrics.firstUsed = new Date();
    }

    // إعادة حساب التوصيات
    this.recalculateRecommendations(metrics);
  }

  /**
   * تحديث إحصائيات الأداء
   */
  private updatePerformanceStats(metrics: SelectorMetrics, responseTime: number): void {
    // تحديث الحد الأدنى والأقصى والمتوسط
    if (metrics.minResponseTime === 0 || responseTime < metrics.minResponseTime) {
      metrics.minResponseTime = responseTime;
    }
    if (responseTime > metrics.maxResponseTime) {
      metrics.maxResponseTime = responseTime;
    }

    // حساب المتوسط المتحرك
    const oldAverage = metrics.averageResponseTime;
    metrics.averageResponseTime =
      (oldAverage * (metrics.totalAttempts - 1) + responseTime) /
      metrics.totalAttempts;

    // حساب الوسيط (median)
    const times = metrics.history
      .slice(-100)
      .map((h) => h.responseTime)
      .sort((a, b) => a - b);
    if (times.length > 0) {
      const mid = Math.floor(times.length / 2);
      metrics.medianResponseTime =
        times.length % 2 === 0
          ? (times[mid - 1] + times[mid]) / 2
          : times[mid];
    }

    // حساب درجة الاتساق (كم القيم قريبة من المتوسط)
    if (metrics.history.length > 10) {
      const variance = this.calculateVariance(
        metrics.history.slice(-100).map((h) => h.responseTime),
        metrics.averageResponseTime
      );
      const stdDev = Math.sqrt(variance);
      // درجة عالية = اختلاف منخفض
      metrics.consistencyScore = Math.max(
        0,
        1 - stdDev / metrics.averageResponseTime
      );
    }

    // حساب درجة الاستقرار (هل يتدهور الأداء؟)
    metrics.stabilityScore = this.calculateStabilityScore(metrics);

    // حساب معدل التدهور
    metrics.degradationRate = this.calculateDegradationRate(metrics);
  }

  /**
   * إعادة حساب التوصيات
   */
  private recalculateRecommendations(metrics: SelectorMetrics): void {
    // المحدد موثوق إذا:
    // - معدل نجاح > 80%
    // - درجة استقرار > 0.7
    // - وقت استجابة معقول
    metrics.isReliable =
      metrics.successRate > 0.8 &&
      metrics.stabilityScore > 0.7 &&
      metrics.averageResponseTime < 10000;

    // يجب التراجع عن المحدد إذا:
    // - معدل نجاح < 60%
    // - درجة استقرار < 0.4
    // - تدهور الأداء
    metrics.shouldFallback =
      metrics.successRate < 0.6 ||
      metrics.stabilityScore < 0.4 ||
      metrics.degradationRate > 0.3;

    // بناء التوصية
    metrics.recommendation = this.buildRecommendation(metrics);
  }

  /**
   * بناء التوصية
   */
  private buildRecommendation(metrics: SelectorMetrics): string {
    if (metrics.totalAttempts < 5) {
      return `⚠️ بيانات محدودة - ${metrics.totalAttempts} محاولات فقط`;
    }

    if (metrics.isReliable) {
      return `✅ محدد موثوق - معدل نجاح ${(metrics.successRate * 100).toFixed(1)}%`;
    }

    if (metrics.shouldFallback) {
      if (metrics.successRate < 0.6) {
        return `⛔ معدل نجاح منخفض - استخدم بديل`;
      }
      if (metrics.degradationRate > 0.3) {
        return `📉 تدهور الأداء - استخدم بديل`;
      }
      return `⚠️ غير مستقر - استخدم بديل`;
    }

    return `🟡 متوسط الأداء - ${(metrics.successRate * 100).toFixed(1)}%`;
  }

  /**
   * حساب درجة الاستقرار
   */
  private calculateStabilityScore(metrics: SelectorMetrics): number {
    if (metrics.history.length < 10) {
      return 0.5; // بيانات غير كافية
    }

    // حساب معدل النجاح في الفترات المختلفة
    const history = metrics.history.slice(-100);
    const windowSize = Math.floor(history.length / 4);

    if (windowSize < 5) return 0.5;

    const windows: number[] = [];
    for (let i = 0; i < history.length - windowSize; i += windowSize) {
      const window = history.slice(i, i + windowSize);
      const successRate = window.filter((h) => h.success).length / window.length;
      windows.push(successRate);
    }

    // حساب التباين بين الفترات
    if (windows.length < 2) return 0.7;

    const variance = this.calculateVariance(windows, 0.5);
    // درجة عالية = تباين منخفض
    return Math.max(0, 1 - variance * 4);
  }

  /**
   * حساب معدل التدهور
   */
  private calculateDegradationRate(metrics: SelectorMetrics): number {
    if (metrics.history.length < 20) {
      return 0; // بيانات غير كافية
    }

    // مقارنة معدل النجاح في النصف الأول مع الثاني
    const mid = Math.floor(metrics.history.length / 2);
    const firstHalf = metrics.history.slice(0, mid);
    const secondHalf = metrics.history.slice(mid);

    const firstRate =
      firstHalf.filter((h) => h.success).length / firstHalf.length;
    const secondRate =
      secondHalf.filter((h) => h.success).length / secondHalf.length;

    // معدل التدهور = كم انخفض الأداء
    return Math.max(0, firstRate - secondRate);
  }

  /**
   * حساب التباين
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
  }

  /**
   * الحصول على اتجاه أداء المحدد
   */
  getTrend(selector: string, website: string, taskType: string, elementType: string): SelectorTrend {
    const key = this.getMetricsKey(selector, website, taskType, elementType);
    const metrics = this.metrics.get(key);

    if (!metrics || metrics.history.length < 10) {
      return {
        selector,
        trend: 'stable',
        trendScore: 0,
        improvement: 0,
        forecastedSuccessRate: metrics?.successRate || 0.5,
        confidence: 0.3,
      };
    }

    // حساب الاتجاه
    const history = metrics.history.slice(-50);
    const midPoint = Math.floor(history.length / 2);

    const firstHalf = history.slice(0, midPoint);
    const secondHalf = history.slice(midPoint);

    const firstSuccessRate = firstHalf.filter((h) => h.success).length / firstHalf.length;
    const secondSuccessRate = secondHalf.filter((h) => h.success).length / secondHalf.length;

    const improvement = secondSuccessRate - firstSuccessRate;

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (improvement > 0.15) {
      trend = 'improving';
    } else if (improvement < -0.15) {
      trend = 'degrading';
    }

    // التنبؤ بمعدل النجاح المستقبلي
    const forecastedSuccessRate = Math.max(
      0,
      Math.min(1, metrics.successRate + improvement * 0.5)
    );

    const trendScore = improvement;

    return {
      selector,
      trend,
      trendScore,
      improvement,
      forecastedSuccessRate,
      confidence: Math.min(0.9, history.length / 50),
    };
  }

  /**
   * مقارنة عدة محددات
   */
  compareSelectors(
    selectors: string[],
    website: string,
    taskType: string,
    elementType: string
  ): SelectorComparison {
    const scores = new Map<string, number>();
    let winner = '';
    let winnerScore = -1;

    selectors.forEach((selector) => {
      const key = this.getMetricsKey(selector, website, taskType, elementType);
      const metrics = this.metrics.get(key);

      let score = 0;
      if (metrics) {
        // درجة متركبة = (معدل النجاح * 0.5) + (درجة الاستقرار * 0.3) + (سرعة * 0.2)
        const speedScore = Math.max(
          0,
          1 - metrics.averageResponseTime / 10000
        );
        score =
          metrics.successRate * 0.5 +
          metrics.stabilityScore * 0.3 +
          speedScore * 0.2;
      }

      scores.set(selector, score);
      if (score > winnerScore) {
        winnerScore = score;
        winner = selector;
      }
    });

    const differences = new Map<string, number>();
    selectors.forEach((selector) => {
      const score = scores.get(selector) || 0;
      differences.set(selector, winnerScore - score);
    });

    const recommendation = this.buildComparisonRecommendation(
      winner,
      winnerScore,
      selectors.length
    );

    return {
      selectors,
      winner,
      winnerScore,
      scores,
      differences,
      recommendation,
    };
  }

  /**
   * بناء التوصية للمقارنة
   */
  private buildComparisonRecommendation(
    winner: string,
    score: number,
    totalCount: number
  ): string {
    if (score < 0.3) {
      return `⚠️ جميع المحددات ضعيفة - تحتاج بدائل جديدة`;
    }
    if (score > 0.8) {
      return `✅ استخدم "${winner}" - أداء عالية جداً`;
    }
    if (score > 0.6) {
      return `👍 استخدم "${winner}" - أداء جيدة`;
    }
    return `⚠️ استخدم "${winner}" - لكن تابع الأداء`;
  }

  /**
   * الحصول على أفضل محددات
   */
  getTopSelectors(
    website: string,
    taskType: string,
    elementType: string,
    limit: number = 5
  ): SelectorMetrics[] {
    const relevant = Array.from(this.metrics.values()).filter(
      (m) => m.website === website &&
        m.taskType === taskType &&
        m.elementType === elementType &&
        m.totalAttempts >= 5
    );

    return relevant
      .sort((a, b) => {
        // ترتيب حسب: معدل النجاح، ثم الاستقرار، ثم السرعة
        const aScore = a.successRate * 0.5 + a.stabilityScore * 0.3 +
          Math.max(0, 1 - a.averageResponseTime / 10000) * 0.2;
        const bScore = b.successRate * 0.5 + b.stabilityScore * 0.3 +
          Math.max(0, 1 - b.averageResponseTime / 10000) * 0.2;
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * الحصول على المحددات الضعيفة
   */
  getWeakSelectors(
    website: string,
    taskType: string,
    elementType: string,
    limit: number = 5
  ): SelectorMetrics[] {
    const relevant = Array.from(this.metrics.values()).filter(
      (m) => m.website === website &&
        m.taskType === taskType &&
        m.elementType === elementType &&
        m.totalAttempts >= 5
    );

    return relevant
      .filter((m) => m.successRate < 0.7)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, limit);
  }

  /**
   * الحصول على تقرير شامل
   */
  getDetailedReport(
    website: string,
    taskType: string,
    elementType: string
  ): {
    totalMetrics: number;
    averageSuccessRate: number;
    topSelectors: SelectorMetrics[];
    weakSelectors: SelectorMetrics[];
    trends: SelectorTrend[];
  } {
    const relevant = Array.from(this.metrics.values()).filter(
      (m) => m.website === website &&
        m.taskType === taskType &&
        m.elementType === elementType
    );

    const averageSuccessRate =
      relevant.length > 0
        ? relevant.reduce((sum, m) => sum + m.successRate, 0) / relevant.length
        : 0;

    return {
      totalMetrics: relevant.length,
      averageSuccessRate,
      topSelectors: this.getTopSelectors(website, taskType, elementType, 5),
      weakSelectors: this.getWeakSelectors(website, taskType, elementType, 5),
      trends: relevant.map((m) =>
        this.getTrend(m.selector, m.website, m.taskType, m.elementType)
      ),
    };
  }

  /**
   * تهيئة مقاييس جديدة
   */
  private initializeMetrics(
    selector: string,
    website: string,
    taskType: string,
    elementType: string
  ): SelectorMetrics {
    return {
      selector,
      website,
      taskType,
      elementType,
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      medianResponseTime: 0,
      consistencyScore: 0.5,
      stabilityScore: 0.5,
      degradationRate: 0,
      lastUsed: new Date(),
      firstUsed: new Date(),
      usageFrequency: 0,
      isReliable: false,
      shouldFallback: false,
      recommendation: 'بيانات جديدة',
      history: [],
    };
  }

  /**
   * الحصول على مفتاح المقاييس
   */
  private getMetricsKey(
    selector: string,
    website: string,
    taskType: string,
    elementType: string
  ): string {
    return `${selector}|${website}|${taskType}|${elementType}`;
  }

  /**
   * مسح المقاييس
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.trends.clear();
    console.log('✅ تم مسح مقاييس المحددات');
  }

  /**
   * الحصول على حجم البيانات المخزنة
   */
  getStorageSize(): {
    totalMetrics: number;
    totalHistoryEntries: number;
    estimatedSizeKB: number;
  } {
    let totalHistoryEntries = 0;
    Array.from(this.metrics.values()).forEach((m) => {
      totalHistoryEntries += m.history.length;
    });

    // تقدير تقريبي للحجم (كل إدخال = ~200 بايت)
    const estimatedSizeKB = (totalHistoryEntries * 200) / 1024;

    return {
      totalMetrics: this.metrics.size,
      totalHistoryEntries,
      estimatedSizeKB,
    };
  }
}

// Export singleton instance
export const selectorPerformanceTracker = new SelectorPerformanceTracker();
