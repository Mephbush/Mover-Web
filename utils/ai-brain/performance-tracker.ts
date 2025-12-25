/**
 * نظام تتبع الأداء - يراقب فعالية نظام عقل AI
 * Performance Tracker - Monitors AI Brain system effectiveness
 */

import { Experience, Pattern } from './learning-engine';
import { databaseSync } from './database-sync';

export interface PerformanceMetrics {
  // الإحصائيات العامة
  totalExperiences: number;
  successfulExperiences: number;
  failedExperiences: number;
  overallSuccessRate: number;
  averageExecutionTime: number;
  averageRetryCount: number;
  
  // إحصائيات حسب الموقع
  websiteMetrics: Map<string, WebsiteMetrics>;
  
  // إحصائيات حسب نوع المهمة
  taskTypeMetrics: Map<string, TaskTypeMetrics>;
  
  // تحليل الأخطاء
  errorFrequency: Map<string, ErrorMetric>;
  topErrors: ErrorMetric[];
  
  // سرعة التعلم
  learningVelocity: number; // معدل تحسن الأداء
  recentSuccessRate: number; // معدل النجاح في آخر 100 تجربة
  
  // توقيت
  lastUpdated: Date;
  metricsCalculationTime: number; // ms
}

export interface WebsiteMetrics {
  website: string;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  averageExecutionTime: number;
  commonPatterns: string[];
  topErrors: string[];
  trendingImprovement: number; // النسبة المئوية للتحسن
  lastActivityTime: Date;
}

export interface TaskTypeMetrics {
  taskType: string;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  averageExecutionTime: number;
  averageRetryCount: number;
  topFailingWebsites: Array<{ website: string; failures: number }>;
  improvement: number; // النسبة المئوية للتحسن
}

export interface ErrorMetric {
  error: string;
  count: number;
  successRateWhenErrorOccurs: number;
  lastOccurred: Date;
  affectedWebsites: string[];
  affectedTaskTypes: string[];
}

export interface PerformanceTrend {
  timestamp: Date;
  successRate: number;
  averageExecutionTime: number;
  errorCount: number;
}

/**
 * نظام تتبع الأداء الشامل
 */
export class PerformanceTracker {
  private metrics: PerformanceMetrics | null = null;
  private trends: PerformanceTrend[] = [];
  private readonly maxTrends = 1000;
  private isInitialized = false;
  private metricsCache: Map<string, any> = new Map();
  private lastCalculationTime = 0;
  private calculateInterval = 30000; // إعادة حساب كل 30 ثانية

  /**
   * تهيئة نظام تتبع الأداء
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📊 Initializing PerformanceTracker...');
      
      // تحميل البيانات المحفوظة
      await this.loadSavedMetrics(userId);
      
      this.isInitialized = true;
      console.log('✅ PerformanceTracker initialized');
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize PerformanceTracker:', error.message);
      this.initializeEmptyMetrics();
      this.isInitialized = true;
    }
  }

  /**
   * حساب المقاييس بناءً على التجارب
   */
  async calculateMetrics(experiences: Experience[]): Promise<PerformanceMetrics> {
    const startTime = performance.now();

    if (experiences.length === 0) {
      return this.getEmptyMetrics();
    }

    const successfulExperiences = experiences.filter(e => e.success);
    const failedExperiences = experiences.filter(e => !e.success);

    // إحصائيات عامة
    const totalExperiences = experiences.length;
    const successfulCount = successfulExperiences.length;
    const failedCount = failedExperiences.length;
    const overallSuccessRate = totalExperiences > 0 ? successfulCount / totalExperiences : 0;

    const executionTimes = experiences
      .filter(e => e.metadata.executionTime > 0)
      .map(e => e.metadata.executionTime);
    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    const retryCounts = experiences.map(e => e.metadata.retryCount);
    const averageRetryCount = retryCounts.reduce((a, b) => a + b, 0) / retryCounts.length;

    // إحصائيات حسب الموقع
    const websiteMap = new Map<string, Experience[]>();
    experiences.forEach(exp => {
      const website = exp.website;
      if (!websiteMap.has(website)) {
        websiteMap.set(website, []);
      }
      websiteMap.get(website)!.push(exp);
    });

    const websiteMetrics = new Map<string, WebsiteMetrics>();
    websiteMap.forEach((exps, website) => {
      const successful = exps.filter(e => e.success).length;
      const successRate = exps.length > 0 ? successful / exps.length : 0;
      const times = exps
        .filter(e => e.metadata.executionTime > 0)
        .map(e => e.metadata.executionTime);
      const avgTime = times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0;

      // حساب الاتجاه التحسن
      const lastHalf = exps.slice(Math.max(0, exps.length - 10));
      const lastHalfSuccess = lastHalf.filter(e => e.success).length / lastHalf.length;
      const trendingImprovement = lastHalfSuccess > successRate 
        ? ((lastHalfSuccess - successRate) / successRate) * 100
        : 0;

      websiteMetrics.set(website, {
        website,
        totalAttempts: exps.length,
        successfulAttempts: successful,
        successRate,
        averageExecutionTime: avgTime,
        commonPatterns: this.extractCommonPatterns(exps),
        topErrors: this.extractTopErrors(exps, 3),
        trendingImprovement,
        lastActivityTime: exps[exps.length - 1].timestamp,
      });
    });

    // إحصائيات حسب نوع المهمة
    const taskTypeMap = new Map<string, Experience[]>();
    experiences.forEach(exp => {
      const taskType = exp.taskType;
      if (!taskTypeMap.has(taskType)) {
        taskTypeMap.set(taskType, []);
      }
      taskTypeMap.get(taskType)!.push(exp);
    });

    const taskTypeMetrics = new Map<string, TaskTypeMetrics>();
    taskTypeMap.forEach((exps, taskType) => {
      const successful = exps.filter(e => e.success).length;
      const successRate = exps.length > 0 ? successful / exps.length : 0;
      const times = exps
        .filter(e => e.metadata.executionTime > 0)
        .map(e => e.metadata.executionTime);
      const avgTime = times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0;

      const retries = exps.map(e => e.metadata.retryCount);
      const avgRetries = retries.reduce((a, b) => a + b, 0) / retries.length;

      // حساب الفشل حسب الموقع
      const failuresByWebsite = new Map<string, number>();
      exps.filter(e => !e.success).forEach(exp => {
        const count = failuresByWebsite.get(exp.website) || 0;
        failuresByWebsite.set(exp.website, count + 1);
      });

      const topFailingWebsites = Array.from(failuresByWebsite.entries())
        .map(([website, failures]) => ({ website, failures }))
        .sort((a, b) => b.failures - a.failures)
        .slice(0, 3);

      // حساب التحسن
      const firstHalf = exps.slice(0, Math.floor(exps.length / 2));
      const secondHalf = exps.slice(Math.floor(exps.length / 2));
      const firstHalfSuccess = firstHalf.filter(e => e.success).length / Math.max(1, firstHalf.length);
      const secondHalfSuccess = secondHalf.filter(e => e.success).length / Math.max(1, secondHalf.length);
      const improvement = secondHalfSuccess > firstHalfSuccess
        ? ((secondHalfSuccess - firstHalfSuccess) / firstHalfSuccess) * 100
        : 0;

      taskTypeMetrics.set(taskType, {
        taskType,
        totalAttempts: exps.length,
        successfulAttempts: successful,
        successRate,
        averageExecutionTime: avgTime,
        averageRetryCount: avgRetries,
        topFailingWebsites,
        improvement,
      });
    });

    // تحليل الأخطاء
    const errorMap = new Map<string, Experience[]>();
    failedExperiences.forEach(exp => {
      const error = exp.context.errorMessage || 'Unknown Error';
      if (!errorMap.has(error)) {
        errorMap.set(error, []);
      }
      errorMap.get(error)!.push(exp);
    });

    const errorFrequency = new Map<string, ErrorMetric>();
    const errorMetrics: ErrorMetric[] = [];

    errorMap.forEach((exps, error) => {
      // حساب معدل النجاح عندما يحدث هذا الخطأ
      const associatedExperiences = experiences.filter(
        e => e.context.errorMessage === error
      );
      const successWhenError = associatedExperiences.filter(e => e.success).length;
      const successRate = associatedExperiences.length > 0
        ? successWhenError / associatedExperiences.length
        : 0;

      const affectedWebsites = Array.from(new Set(exps.map(e => e.website)));
      const affectedTaskTypes = Array.from(new Set(exps.map(e => e.taskType)));

      const metric: ErrorMetric = {
        error,
        count: exps.length,
        successRateWhenErrorOccurs: successRate,
        lastOccurred: exps[exps.length - 1].timestamp,
        affectedWebsites,
        affectedTaskTypes,
      };

      errorFrequency.set(error, metric);
      errorMetrics.push(metric);
    });

    const topErrors = errorMetrics
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // حساب سرعة التعلم
    const recentExperiences = experiences.slice(-100);
    const recentSuccessRate = recentExperiences.length > 0
      ? recentExperiences.filter(e => e.success).length / recentExperiences.length
      : overallSuccessRate;

    const learningVelocity = recentExperiences.length === 100
      ? ((recentSuccessRate - overallSuccessRate) / overallSuccessRate) * 100
      : 0;

    const calculationTime = performance.now() - startTime;

    const metrics: PerformanceMetrics = {
      totalExperiences,
      successfulExperiences: successfulCount,
      failedExperiences: failedCount,
      overallSuccessRate,
      averageExecutionTime,
      averageRetryCount,
      websiteMetrics,
      taskTypeMetrics,
      errorFrequency,
      topErrors,
      learningVelocity,
      recentSuccessRate,
      lastUpdated: new Date(),
      metricsCalculationTime: calculationTime,
    };

    this.metrics = metrics;
    this.recordTrend(metrics);
    this.lastCalculationTime = Date.now();

    return metrics;
  }

  /**
   * الحصول على المقاييس الحالية
   */
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * الحصول على إحصائيات الموقع
   */
  getWebsiteMetrics(website: string): WebsiteMetrics | undefined {
    return this.metrics?.websiteMetrics.get(website);
  }

  /**
   * الحصول على إحصائيات نوع المهمة
   */
  getTaskTypeMetrics(taskType: string): TaskTypeMetrics | undefined {
    return this.metrics?.taskTypeMetrics.get(taskType);
  }

  /**
   * تسجيل اتجاه الأداء
   */
  private recordTrend(metrics: PerformanceMetrics): void {
    const trend: PerformanceTrend = {
      timestamp: metrics.lastUpdated,
      successRate: metrics.overallSuccessRate,
      averageExecutionTime: metrics.averageExecutionTime,
      errorCount: metrics.topErrors.reduce((sum, e) => sum + e.count, 0),
    };

    this.trends.push(trend);

    if (this.trends.length > this.maxTrends) {
      this.trends = this.trends.slice(-this.maxTrends);
    }
  }

  /**
   * الحصول على الاتجاهات التاريخية
   */
  getTrends(limit: number = 100): PerformanceTrend[] {
    return this.trends.slice(-limit);
  }

  /**
   * استخراج الأنماط الشائعة من التجارب
   */
  private extractCommonPatterns(experiences: Experience[], limit: number = 5): string[] {
    const selectorMap = new Map<string, number>();
    experiences
      .filter(e => e.success)
      .forEach(exp => {
        const count = selectorMap.get(exp.selector) || 0;
        selectorMap.set(exp.selector, count + 1);
      });

    return Array.from(selectorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([selector]) => selector);
  }

  /**
   * استخراج أكثر الأخطاء شيوعاً
   */
  private extractTopErrors(experiences: Experience[], limit: number = 3): string[] {
    const errorMap = new Map<string, number>();
    experiences
      .filter(e => !e.success && e.context.errorMessage)
      .forEach(exp => {
        const error = exp.context.errorMessage!;
        const count = errorMap.get(error) || 0;
        errorMap.set(error, count + 1);
      });

    return Array.from(errorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([error]) => error);
  }

  /**
   * إنشاء تقرير الأداء الشامل
   */
  generatePerformanceReport(): {
    summary: string;
    highlights: string[];
    concerns: string[];
    recommendations: string[];
  } {
    if (!this.metrics) {
      return {
        summary: 'No metrics available yet',
        highlights: [],
        concerns: [],
        recommendations: [],
      };
    }

    const highlights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // تحليل معدل النجاح العام
    if (this.metrics.overallSuccessRate >= 0.9) {
      highlights.push(`✅ Excellent success rate: ${(this.metrics.overallSuccessRate * 100).toFixed(1)}%`);
    } else if (this.metrics.overallSuccessRate >= 0.7) {
      highlights.push(`👍 Good success rate: ${(this.metrics.overallSuccessRate * 100).toFixed(1)}%`);
    } else {
      concerns.push(`⚠️ Low success rate: ${(this.metrics.overallSuccessRate * 100).toFixed(1)}%`);
      recommendations.push('Consider reviewing failed tasks and improving strategies');
    }

    // تحليل سرعة التعلم
    if (this.metrics.learningVelocity > 10) {
      highlights.push(`🚀 Strong learning velocity: +${this.metrics.learningVelocity.toFixed(1)}%`);
    } else if (this.metrics.learningVelocity < -5) {
      concerns.push(`📉 Declining performance: ${this.metrics.learningVelocity.toFixed(1)}%`);
      recommendations.push('System performance is declining, consider retraining');
    }

    // تحليل الأخطاء الشائعة
    if (this.metrics.topErrors.length > 0) {
      const topError = this.metrics.topErrors[0];
      concerns.push(`🔴 Most common error: "${topError.error}" (${topError.count} occurrences)`);
      recommendations.push(`Focus on resolving: ${topError.error}`);
    }

    // تحليل الأداء حسب الموقع
    let bestWebsite = '';
    let bestRate = 0;
    let worstWebsite = '';
    let worstRate = 1;

    this.metrics.websiteMetrics.forEach(metric => {
      if (metric.successRate > bestRate) {
        bestRate = metric.successRate;
        bestWebsite = metric.website;
      }
      if (metric.successRate < worstRate && metric.totalAttempts > 0) {
        worstRate = metric.successRate;
        worstWebsite = metric.website;
      }
    });

    if (bestWebsite) {
      highlights.push(`⭐ Best performing website: ${bestWebsite} (${(bestRate * 100).toFixed(1)}%)`);
    }

    if (worstWebsite && worstRate < 0.5) {
      concerns.push(`❌ Struggling with: ${worstWebsite} (${(worstRate * 100).toFixed(1)}%)`);
      recommendations.push(`Improve strategies for: ${worstWebsite}`);
    }

    // تحليل وقت التنفيذ
    if (this.metrics.averageExecutionTime > 30000) {
      concerns.push(`⏱️ Slow execution: ${(this.metrics.averageExecutionTime / 1000).toFixed(1)}s average`);
      recommendations.push('Optimize task execution for faster performance');
    } else if (this.metrics.averageExecutionTime < 5000) {
      highlights.push(`⚡ Fast execution: ${(this.metrics.averageExecutionTime / 1000).toFixed(1)}s average`);
    }

    const summary = `${this.metrics.totalExperiences} experiences | ${(this.metrics.overallSuccessRate * 100).toFixed(1)}% success | ${(this.metrics.averageExecutionTime / 1000).toFixed(1)}s avg time`;

    return {
      summary,
      highlights,
      concerns,
      recommendations,
    };
  }

  /**
   * تحميل المقاييس المحفوظة
   */
  private async loadSavedMetrics(userId: string): Promise<void> {
    try {
      const data = await databaseSync.loadPerformanceMetrics?.(userId);
      if (data) {
        console.log('📊 Loaded saved performance metrics');
      }
    } catch (error: any) {
      console.warn('⚠️ Failed to load saved metrics:', error.message);
    }
  }

  /**
   * إنشاء مقاييس فارغة
   */
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalExperiences: 0,
      successfulExperiences: 0,
      failedExperiences: 0,
      overallSuccessRate: 0,
      averageExecutionTime: 0,
      averageRetryCount: 0,
      websiteMetrics: new Map(),
      taskTypeMetrics: new Map(),
      errorFrequency: new Map(),
      topErrors: [],
      learningVelocity: 0,
      recentSuccessRate: 0,
      lastUpdated: new Date(),
      metricsCalculationTime: 0,
    };
  }

  /**
   * تهيئة المقاييس الفارغة
   */
  private initializeEmptyMetrics(): void {
    this.metrics = this.getEmptyMetrics();
  }

  /**
   * إعادة تعيين المقاييس
   */
  resetMetrics(): void {
    this.metrics = this.getEmptyMetrics();
    this.trends = [];
    this.metricsCache.clear();
  }

  /**
   * الحصول على إحصائيات مختصرة
   */
  getSummaryStats(): {
    totalExperiences: number;
    successRate: number;
    learningVelocity: number;
    topError: string | null;
  } {
    return {
      totalExperiences: this.metrics?.totalExperiences || 0,
      successRate: this.metrics?.overallSuccessRate || 0,
      learningVelocity: this.metrics?.learningVelocity || 0,
      topError: this.metrics?.topErrors[0]?.error || null,
    };
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();
