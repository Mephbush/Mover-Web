/**
 * لوحة تحكم أداء المحددات
 * Selector Performance Dashboard - مراقبة شاملة لأداء نظام المحددات
 * 
 * تقدم:
 * 1. مقاييس أداء شاملة
 * 2. مقارنات الأداء
 * 3. تقارير مفصلة
 * 4. توصيات تحسين
 * 5. تنبيهات الأداء
 */

export interface SelectorPerformanceMetrics {
  totalSelectors: number;
  successRate: number;
  failureRate: number;
  averageExecutionTime: number;
  averageConfidence: number;
  averageReliability: number;
  topPerformers: Array<{
    selector: string;
    successRate: number;
    usageCount: number;
  }>;
  bottomPerformers: Array<{
    selector: string;
    failureRate: number;
    usageCount: number;
  }>;
  trends: {
    improvement: number; // نسبة التحسن
    stability: number; // الاستقرار
    consistency: number; // الاتساق
  };
}

export interface HealthAlert {
  level: 'critical' | 'warning' | 'info';
  message: string;
  selector?: string;
  timestamp: Date;
  recommendation: string;
}

/**
 * لوحة التحكم الشاملة
 */
export class SelectorPerformanceDashboard {
  private metrics: SelectorPerformanceMetrics = {
    totalSelectors: 0,
    successRate: 0,
    failureRate: 0,
    averageExecutionTime: 0,
    averageConfidence: 0,
    averageReliability: 0,
    topPerformers: [],
    bottomPerformers: [],
    trends: {
      improvement: 0,
      stability: 0,
      consistency: 0,
    },
  };

  private alerts: HealthAlert[] = [];
  private history: Array<{ timestamp: Date; metrics: SelectorPerformanceMetrics }> = [];
  private readonly maxHistorySize = 100;

  /**
   * تحديث المقاييس
   */
  updateMetrics(selectorData: any[]): void {
    if (selectorData.length === 0) {
      return;
    }

    const totalSelectors = selectorData.length;
    const successCount = selectorData.filter((s) => s.success).length;
    const failureCount = totalSelectors - successCount;

    const successRate = (successCount / totalSelectors) * 100;
    const failureRate = (failureCount / totalSelectors) * 100;

    const executionTimes = selectorData.map((s) => s.executionTime || 0);
    const averageExecutionTime =
      executionTimes.reduce((a, b) => a + b, 0) / totalSelectors;

    const confidences = selectorData.map((s) => s.confidence || 50);
    const averageConfidence =
      confidences.reduce((a, b) => a + b, 0) / totalSelectors;

    const reliabilities = selectorData.map((s) => s.reliability || 50);
    const averageReliability =
      reliabilities.reduce((a, b) => a + b, 0) / totalSelectors;

    // الأداء الأفضل
    const topPerformers = selectorData
      .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
      .slice(0, 5)
      .map((s) => ({
        selector: s.selector,
        successRate: s.successRate || 0,
        usageCount: s.usageCount || 0,
      }));

    // الأداء الأسوأ
    const bottomPerformers = selectorData
      .filter((s) => (s.usageCount || 0) >= 3) // فقط التي تُستخدم 3 مرات فأكثر
      .sort((a, b) => (a.successRate || 0) - (b.successRate || 0))
      .slice(0, 5)
      .map((s) => ({
        selector: s.selector,
        failureRate: 100 - (s.successRate || 0),
        usageCount: s.usageCount || 0,
      }));

    // حساب الاتجاهات
    const trends = this.calculateTrends(successRate);

    const newMetrics: SelectorPerformanceMetrics = {
      totalSelectors,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime),
      averageConfidence: Math.round(averageConfidence),
      averageReliability: Math.round(averageReliability),
      topPerformers,
      bottomPerformers,
      trends,
    };

    this.metrics = newMetrics;

    // حفظ في السجل
    this.history.push({
      timestamp: new Date(),
      metrics: JSON.parse(JSON.stringify(newMetrics)),
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // فحص الصحة
    this.checkHealth();
  }

  /**
   * حساب الاتجاهات
   */
  private calculateTrends(currentSuccessRate: number): any {
    if (this.history.length < 2) {
      return {
        improvement: 0,
        stability: 100,
        consistency: 100,
      };
    }

    const previousMetrics = this.history[this.history.length - 2].metrics;
    const improvement = currentSuccessRate - previousMetrics.successRate;

    // الاستقرار (عدم التغير الكبير)
    const recentRates = this.history
      .slice(-10)
      .map((h) => h.metrics.successRate);
    const variance =
      recentRates.reduce((sum, rate) => sum + Math.pow(rate - currentSuccessRate, 2), 0) /
      recentRates.length;
    const stability = Math.max(0, 100 - Math.sqrt(variance));

    // الاتساق (نفس النتائج في نفس الظروف)
    const topSelectorStability =
      this.history.length > 1 &&
      this.metrics.topPerformers.length > 0 &&
      previousMetrics.topPerformers.length > 0
        ? 80 // تقدير
        : 60;

    return {
      improvement: Math.round(improvement * 100) / 100,
      stability: Math.round(stability),
      consistency: topSelectorStability,
    };
  }

  /**
   * فحص صحة النظام
   */
  private checkHealth(): void {
    const alerts: HealthAlert[] = [];

    // فحص معدل الفشل
    if (this.metrics.failureRate > 40) {
      alerts.push({
        level: 'critical',
        message: `معدل الفشل مرتفع جداً: ${this.metrics.failureRate.toFixed(1)}%`,
        timestamp: new Date(),
        recommendation: 'يجب إعادة تدريب النظام أو مراجعة المحددات الرئيسية',
      });
    } else if (this.metrics.failureRate > 20) {
      alerts.push({
        level: 'warning',
        message: `معدل الفشل مرتفع: ${this.metrics.failureRate.toFixed(1)}%`,
        timestamp: new Date(),
        recommendation: 'قم بتحسين المحددات ذات الأداء الضعيف',
      });
    }

    // فحص وقت التنفيذ
    if (this.metrics.averageExecutionTime > 10000) {
      alerts.push({
        level: 'warning',
        message: `وقت التنفيذ بطيء جداً: ${this.metrics.averageExecutionTime}ms`,
        timestamp: new Date(),
        recommendation: 'بسّط المحددات المعقدة أو استخدم محددات أسرع',
      });
    }

    // فحص الموثوقية
    if (this.metrics.averageReliability < 60) {
      alerts.push({
        level: 'warning',
        message: `الموثوقية منخفضة: ${this.metrics.averageReliability.toFixed(1)}%`,
        timestamp: new Date(),
        recommendation: 'قم بتحسين استقرار المحددات',
      });
    }

    // فحص الأداء السيء
    if (this.metrics.bottomPerformers.length > 0) {
      const worstSelector = this.metrics.bottomPerformers[0];
      if (worstSelector.failureRate > 50) {
        alerts.push({
          level: 'warning',
          message: `المحدد "${worstSelector.selector}" له معدل فشل عالي: ${worstSelector.failureRate.toFixed(1)}%`,
          selector: worstSelector.selector,
          timestamp: new Date(),
          recommendation: 'استبدل هذا المحدد بآخر أفضل أو قم بتحسينه',
        });
      }
    }

    // فحص عدم الاستقرار
    if (this.metrics.trends.stability < 70) {
      alerts.push({
        level: 'info',
        message: `النظام غير مستقر: ${this.metrics.trends.stability.toFixed(1)}%`,
        timestamp: new Date(),
        recommendation: 'يتغير الأداء بشكل كبير، قد تحتاج إلى مزيد من البيانات',
      });
    }

    this.alerts = alerts;
  }

  /**
   * الحصول على التنبيهات
   */
  getAlerts(): HealthAlert[] {
    return this.alerts;
  }

  /**
   * الحصول على التنبيهات حسب المستوى
   */
  getAlertsByLevel(level: 'critical' | 'warning' | 'info'): HealthAlert[] {
    return this.alerts.filter((a) => a.level === level);
  }

  /**
   * توليد تقرير مفصل
   */
  generateDetailedReport(): string {
    let report = `📊 تقرير أداء نظام المحددات\n`;
    report += `================================\n\n`;

    report += `📈 المقاييس الرئيسية:\n`;
    report += `• إجمالي المحددات: ${this.metrics.totalSelectors}\n`;
    report += `• معدل النجاح: ${this.metrics.successRate.toFixed(1)}%\n`;
    report += `• معدل الفشل: ${this.metrics.failureRate.toFixed(1)}%\n`;
    report += `• متوسط وقت التنفيذ: ${this.metrics.averageExecutionTime}ms\n`;
    report += `• متوسط الثقة: ${this.metrics.averageConfidence.toFixed(1)}\n`;
    report += `• متوسط الموثوقية: ${this.metrics.averageReliability.toFixed(1)}\n\n`;

    report += `📊 الاتجاهات:\n`;
    report += `• التحسن: ${this.metrics.trends.improvement > 0 ? '+' : ''}${this.metrics.trends.improvement.toFixed(2)}%\n`;
    report += `• الاستقرار: ${this.metrics.trends.stability.toFixed(1)}%\n`;
    report += `• الاتساق: ${this.metrics.trends.consistency.toFixed(1)}%\n\n`;

    report += `🏆 أفضل 5 محددات:\n`;
    this.metrics.topPerformers.forEach((performer, index) => {
      report += `${index + 1}. ${performer.selector}\n`;
      report += `   النجاح: ${performer.successRate.toFixed(1)}% | الاستخدام: ${performer.usageCount}\n`;
    });

    report += `\n⚠️ أسوأ 5 محددات:\n`;
    this.metrics.bottomPerformers.forEach((performer, index) => {
      report += `${index + 1}. ${performer.selector}\n`;
      report += `   الفشل: ${performer.failureRate.toFixed(1)}% | الاستخدام: ${performer.usageCount}\n`;
    });

    report += `\n🚨 التنبيهات:\n`;
    if (this.alerts.length === 0) {
      report += `✅ لا توجد تنبيهات\n`;
    } else {
      const critical = this.alerts.filter((a) => a.level === 'critical');
      const warning = this.alerts.filter((a) => a.level === 'warning');
      const info = this.alerts.filter((a) => a.level === 'info');

      if (critical.length > 0) {
        report += `🔴 حرج (${critical.length}):\n`;
        critical.forEach((alert) => {
          report += `   • ${alert.message}\n`;
          report += `     💡 ${alert.recommendation}\n`;
        });
      }

      if (warning.length > 0) {
        report += `🟡 تحذير (${warning.length}):\n`;
        warning.forEach((alert) => {
          report += `   • ${alert.message}\n`;
          report += `     💡 ${alert.recommendation}\n`;
        });
      }

      if (info.length > 0) {
        report += `ℹ️ معلومات (${info.length}):\n`;
        info.forEach((alert) => {
          report += `   • ${alert.message}\n`;
          report += `     💡 ${alert.recommendation}\n`;
        });
      }
    }

    report += `\n================================\n`;
    report += `التقرير تم إنشاؤه في: ${new Date().toLocaleString('ar-SA')}\n`;

    return report;
  }

  /**
   * توليد توصيات التحسين
   */
  generateImprovementRecommendations(): string[] {
    const recommendations: string[] = [];

    // توصيات بناءً على معدل الفشل
    if (this.metrics.failureRate > 30) {
      recommendations.push(
        '🔴 معدل الفشل عالي جداً - قم بإعادة تدريب النظام على بيانات جديدة'
      );
    } else if (this.metrics.failureRate > 15) {
      recommendations.push(
        '🟡 معدل الفشل مرتفع - استبدل أسوأ 5 محددات بمحددات جديدة'
      );
    } else {
      recommendations.push('✅ معدل الفشل منخفض - النظام يعمل بشكل جيد');
    }

    // توصيات بناءً على وقت التنفيذ
    if (this.metrics.averageExecutionTime > 5000) {
      recommendations.push(
        '⚡ وقت التنفيذ بطيء - استخدم محددات أبسط وأسرع'
      );
    }

    // توصيات بناءً على الموثوقية
    if (this.metrics.averageReliability < 70) {
      recommendations.push(
        '🔒 الموثوقية منخفضة - قم بتحسين استقرار المحددات'
      );
    }

    // توصيات بناءً على الاتجاهات
    if (this.metrics.trends.improvement < -2) {
      recommendations.push(
        '📉 الأداء يتراجع - قم بمراجعة آخر التغييرات'
      );
    } else if (this.metrics.trends.improvement > 2) {
      recommendations.push(
        '📈 الأداء يتحسن - استمر في التدريب والتحسين'
      );
    }

    if (this.metrics.trends.stability < 70) {
      recommendations.push(
        '🌊 النظام غير مستقر - جمع المزيد من البيانات للتدريب'
      );
    }

    // التوصيات المخصصة
    if (this.metrics.bottomPerformers.length > 0) {
      const worst = this.metrics.bottomPerformers[0];
      recommendations.push(
        `🎯 استبدل المحدد "${worst.selector}" - معدل فشله ${worst.failureRate.toFixed(1)}%`
      );
    }

    return recommendations;
  }

  /**
   * الحصول على ملخص الأداء
   */
  getSummary(): any {
    const healthScore = this.calculateHealthScore();

    return {
      healthScore,
      status: this.getHealthStatus(healthScore),
      totalSelectors: this.metrics.totalSelectors,
      successRate: this.metrics.successRate,
      failureRate: this.metrics.failureRate,
      averageExecutionTime: this.metrics.averageExecutionTime,
      trends: this.metrics.trends,
      alertCount: this.alerts.length,
      criticalAlerts: this.alerts.filter((a) => a.level === 'critical').length,
      recommendations: this.generateImprovementRecommendations().slice(0, 3),
    };
  }

  /**
   * حساب درجة صحة النظام
   */
  private calculateHealthScore(): number {
    let score = 100;

    // تأثير معدل الفشل
    score -= Math.min(30, this.metrics.failureRate * 0.5);

    // تأثير وقت التنفيذ
    const executionTimePenalty = Math.min(20, (this.metrics.averageExecutionTime / 1000) * 2);
    score -= executionTimePenalty;

    // تأثير الموثوقية
    const reliabilityGain = (this.metrics.averageReliability / 100) * 20 - 10;
    score += reliabilityGain;

    // تأثير الاستقرار
    const stabilityGain = (this.metrics.trends.stability / 100) * 10 - 5;
    score += stabilityGain;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * الحصول على حالة الصحة
   */
  private getHealthStatus(score: number): string {
    if (score >= 85) return '🌟 ممتاز';
    if (score >= 70) return '✅ جيد';
    if (score >= 50) return '⚡ مقبول';
    return '🔴 ضعيف';
  }

  /**
   * الحصول على سجل الأداء
   */
  getPerformanceHistory(limit: number = 10): any[] {
    return this.history
      .slice(-limit)
      .map((h) => ({
        timestamp: h.timestamp,
        successRate: h.metrics.successRate,
        failureRate: h.metrics.failureRate,
        averageExecutionTime: h.metrics.averageExecutionTime,
      }));
  }

  /**
   * إعادة تعيين
   */
  reset(): void {
    this.metrics = {
      totalSelectors: 0,
      successRate: 0,
      failureRate: 0,
      averageExecutionTime: 0,
      averageConfidence: 0,
      averageReliability: 0,
      topPerformers: [],
      bottomPerformers: [],
      trends: {
        improvement: 0,
        stability: 0,
        consistency: 0,
      },
    };
    this.alerts = [];
    this.history = [];
  }
}

// تصدير مثيل فردي
export const selectorPerformanceDashboard = new SelectorPerformanceDashboard();
