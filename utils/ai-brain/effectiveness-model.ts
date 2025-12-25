/**
 * نموذج تقييم فعالية عقل الذكاء الاصطناعي
 * AI Brain Effectiveness Model - تقييم شامل لأداء النظام
 * 
 * يقيس:
 * 1. معدل النجاح (Success Rate)
 * 2. سرعة التعلم (Learning Velocity)
 * 3. جودة القرارات (Decision Quality)
 * 4. كفاءة المعرفة (Knowledge Efficiency)
 * 5. التكيف مع التغييرات (Adaptation Capability)
 */

export interface EffectivenessMetrics {
  // معدل النجاح الإجمالي
  overallSuccessRate: number;
  
  // معدل النجاح بالمجالات المختلفة
  successRateByDomain: Map<string, number>;
  
  // سرعة التعلم
  learningVelocity: number;
  
  // جودة القرارات
  decisionQuality: {
    confidence: number;
    accuracy: number;
    consistency: number;
  };
  
  // كفاءة المعرفة
  knowledgeEfficiency: {
    utilizationRate: number;
    relevanceScore: number;
    updateFrequency: number;
  };
  
  // القدرة على التكيف
  adaptationMetrics: {
    changeDetectionRate: number;
    adaptationSpeed: number;
    recoveryRate: number;
  };
  
  // أداء الأنظمة الفرعية
  subsystemPerformance: {
    learningEngine: number;
    knowledgeBase: number;
    selectorSystem: number;
    strategicPlanner: number;
    adaptiveIntelligence: number;
  };
  
  // مؤشرات الصحة
  healthIndicators: {
    memoryUsage: number;
    processingSpeed: number;
    errorRate: number;
    recoveryCapability: number;
  };
  
  // النقاط الضعيفة والقوية
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // الدرجة النهائية (0-100)
  overallScore: number;
}

export interface EffectivenessReport {
  timestamp: Date;
  metrics: EffectivenessMetrics;
  comparison?: {
    previousScore: number;
    improvement: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  status: 'excellent' | 'good' | 'acceptable' | 'poor';
  summary: string;
}

/**
 * محرك تقييم فعالية العقل الذكي
 */
export class AiBrainEffectivenessEvaluator {
  private experiences: any[] = [];
  private patterns: any[] = [];
  private knowledgeEntries: any[] = [];
  private selectorMetrics: any = {};
  private previousScore: number = 0;
  private scoreHistory: number[] = [];

  /**
   * إضافة تجربة للتقييم
   */
  addExperience(experience: any): void {
    this.experiences.push({
      ...experience,
      timestamp: new Date(),
    });
  }

  /**
   * تعيين الأنماط المكتشفة
   */
  setPatterns(patterns: any[]): void {
    this.patterns = patterns;
  }

  /**
   * تعيين إدخالات المعرفة
   */
  setKnowledgeEntries(entries: any[]): void {
    this.knowledgeEntries = entries;
  }

  /**
   * تعيين مقاييس الأداء
   */
  setSelectorMetrics(metrics: any): void {
    this.selectorMetrics = metrics;
  }

  /**
   * حساب معدل النجاح الإجمالي
   */
  private calculateOverallSuccessRate(): number {
    if (this.experiences.length === 0) return 0;
    
    const successfulExperiences = this.experiences.filter((exp) => exp.success).length;
    return (successfulExperiences / this.experiences.length) * 100;
  }

  /**
   * حساب معدل النجاح حسب المجال
   */
  private calculateSuccessRateByDomain(): Map<string, number> {
    const domainMap = new Map<string, { success: number; total: number }>();

    for (const experience of this.experiences) {
      const domain = experience.domain || 'unknown';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { success: 0, total: 0 });
      }

      const stats = domainMap.get(domain)!;
      stats.total++;
      if (experience.success) stats.success++;
    }

    const result = new Map<string, number>();
    for (const [domain, stats] of domainMap.entries()) {
      result.set(domain, (stats.success / stats.total) * 100);
    }

    return result;
  }

  /**
   * حساب سرعة التعلم
   * يقيس معدل تحسن الأداء مع الوقت
   */
  private calculateLearningVelocity(): number {
    if (this.experiences.length < 2) return 0;

    // تقسيم التجارب إلى فترات زمنية
    const sortedExps = [...this.experiences].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const periods = 5;
    const periodSize = Math.ceil(sortedExps.length / periods);
    let velocity = 0;

    for (let i = 1; i < periods; i++) {
      const prevPeriod = sortedExps.slice((i - 1) * periodSize, i * periodSize);
      const currentPeriod = sortedExps.slice(i * periodSize, (i + 1) * periodSize);

      if (prevPeriod.length === 0 || currentPeriod.length === 0) continue;

      const prevRate =
        prevPeriod.filter((e) => e.success).length / prevPeriod.length;
      const currentRate =
        currentPeriod.filter((e) => e.success).length / currentPeriod.length;

      velocity += (currentRate - prevRate) * 100;
    }

    return Math.max(0, velocity / (periods - 1));
  }

  /**
   * حساب جودة القرارات
   */
  private calculateDecisionQuality(): { confidence: number; accuracy: number; consistency: number } {
    const recentExperiences = this.experiences.slice(-100); // آخر 100 تجربة
    
    if (recentExperiences.length === 0) {
      return { confidence: 0, accuracy: 0, consistency: 0 };
    }

    // الدقة
    const accuracy =
      (recentExperiences.filter((e) => e.success).length / recentExperiences.length) * 100;

    // الثقة (متوسط confidence metadata إن وُجد)
    const confidences = recentExperiences
      .map((e) => e.metadata?.confidence || 0.5)
      .filter((c) => c > 0);
    const confidence =
      confidences.length > 0
        ? (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100
        : 0;

    // الاتساق (معدل تقلب النتائج)
    const successRates: number[] = [];
    const windowSize = 10;
    for (let i = 0; i < recentExperiences.length - windowSize; i++) {
      const window = recentExperiences.slice(i, i + windowSize);
      const rate = (window.filter((e) => e.success).length / window.length) * 100;
      successRates.push(rate);
    }

    let consistency = 100;
    if (successRates.length > 0) {
      const variance =
        successRates.reduce((sum, rate) => sum + Math.pow(rate - accuracy, 2), 0) /
        successRates.length;
      const standardDeviation = Math.sqrt(variance);
      consistency = Math.max(0, 100 - standardDeviation);
    }

    return { confidence, accuracy, consistency };
  }

  /**
   * حساب كفاءة المعرفة
   */
  private calculateKnowledgeEfficiency(): { utilizationRate: number; relevanceScore: number; updateFrequency: number } {
    // معدل الاستخدام (كم عدد المعارف المستخدمة فعلاً)
    const usedKnowledge = this.knowledgeEntries.filter((k) => k.usage_count > 0).length;
    const utilizationRate =
      this.knowledgeEntries.length > 0
        ? (usedKnowledge / this.knowledgeEntries.length) * 100
        : 0;

    // درجة الملاءمة (معدل النجاح للمعارف المستخدمة)
    const relevantKnowledge = this.knowledgeEntries.filter((k) => k.success_rate > 0.7);
    const relevanceScore =
      this.knowledgeEntries.length > 0
        ? (relevantKnowledge.length / this.knowledgeEntries.length) * 100
        : 0;

    // تكرار التحديث (عدد المعارف المضافة حديثاً)
    const recentKnowledge = this.knowledgeEntries.filter((k) => {
      const created = new Date(k.metadata?.created || new Date());
      const daysSinceCreation = (new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation < 7;
    }).length;
    const updateFrequency = recentKnowledge > 0 ? Math.min(100, recentKnowledge * 10) : 0;

    return { utilizationRate, relevanceScore, updateFrequency };
  }

  /**
   * حساب القدرة على التكيف
   */
  private calculateAdaptationMetrics(): { changeDetectionRate: number; adaptationSpeed: number; recoveryRate: number } {
    const adaptiveExperiences = this.experiences.filter((e) => e.metadata?.adaptationApplied);
    
    // معدل كشف التغييرات
    const changeDetectionRate =
      this.experiences.length > 0
        ? (adaptiveExperiences.length / this.experiences.length) * 100
        : 0;

    // سرعة التكيف (كم يستغرق من الوقت للاستجابة)
    let adaptationSpeed = 0;
    if (adaptiveExperiences.length > 0) {
      const speeds = adaptiveExperiences
        .map((e) => e.metadata?.executionTime || 0)
        .filter((s) => s > 0);
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      adaptationSpeed = Math.max(0, 100 - (avgSpeed / 30000) * 100); // 30 ثانية هي الحد الأقصى
    }

    // معدل التعافي (كم نسبة محاولات الاسترجاع الناجحة)
    const failedExperiences = this.experiences.filter((e) => !e.success);
    const recoveredExperiences = failedExperiences.filter((e) => {
      // افترض أن التجربة التالية نجحت كاسترجاع
      const index = this.experiences.indexOf(e);
      return index < this.experiences.length - 1 && this.experiences[index + 1].success;
    });

    const recoveryRate =
      failedExperiences.length > 0
        ? (recoveredExperiences.length / failedExperiences.length) * 100
        : 100;

    return { changeDetectionRate, adaptationSpeed, recoveryRate };
  }

  /**
   * حساب أداء الأنظمة الفرعية
   */
  private calculateSubsystemPerformance(): any {
    const overallRate = this.calculateOverallSuccessRate();

    return {
      // Learning Engine: يقيس من خلال تحسن الأداء
      learningEngine: this.calculateLearningVelocity(),
      
      // Knowledge Base: يقيس من خلال استخدام المعرفة
      knowledgeBase: this.calculateKnowledgeEfficiency().relevanceScore,
      
      // Selector System: أداء اختيار العناصر
      selectorSystem: this.selectorMetrics.successRate || 0,
      
      // Strategic Planner: دقة التخطيط
      strategicPlanner: overallRate * 0.9, // 90% من معدل النجاح
      
      // Adaptive Intelligence: القدرة على التكيف
      adaptiveIntelligence: this.calculateAdaptationMetrics().adaptationSpeed,
    };
  }

  /**
   * حساب مؤشرات الصحة
   */
  private calculateHealthIndicators(): any {
    return {
      // استهلاك الذاكرة (محاكاة)
      memoryUsage: Math.min(
        100,
        (this.experiences.length * 0.01 + this.knowledgeEntries.length * 0.05)
      ),
      
      // سرعة المعالجة
      processingSpeed: Math.max(
        0,
        100 - (this.experiences.reduce((sum, e) => sum + (e.metadata?.executionTime || 0), 0) / this.experiences.length) / 300
      ),
      
      // معدل الأخطاء
      errorRate: (this.experiences.filter((e) => !e.success).length / Math.max(1, this.experiences.length)) * 100,
      
      // القدرة على الاسترجاع
      recoveryCapability: this.calculateAdaptationMetrics().recoveryRate,
    };
  }

  /**
   * تحديد النقاط القوية
   */
  private identifyStrengths(metrics: EffectivenessMetrics): string[] {
    const strengths: string[] = [];

    if (metrics.decisionQuality.accuracy > 80) {
      strengths.push('✅ دقة القرارات عالية جداً (>80%)');
    }

    if (metrics.learningVelocity > 5) {
      strengths.push('✅ سرعة التعلم ممتازة');
    }

    if (metrics.knowledgeEfficiency.utilizationRate > 70) {
      strengths.push('✅ استخدام فعّال للمعرفة المتراكمة');
    }

    if (metrics.adaptationMetrics.recoveryRate > 75) {
      strengths.push('✅ قدرة عالية على التعافي من الأخطاء');
    }

    if (metrics.overallSuccessRate > 75) {
      strengths.push('✅ معدل النجاح الإجمالي قوي');
    }

    if (metrics.subsystemPerformance.learningEngine > 60) {
      strengths.push('✅ محرك التعلم يعمل بكفاءة');
    }

    return strengths;
  }

  /**
   * تحديد النقاط الضعيفة
   */
  private identifyWeaknesses(metrics: EffectivenessMetrics): string[] {
    const weaknesses: string[] = [];

    if (metrics.overallSuccessRate < 60) {
      weaknesses.push('⚠️ معدل النجاح منخفض (<60%)');
    }

    if (metrics.learningVelocity < 2) {
      weaknesses.push('⚠️ سرعة التعلم بطيئة جداً');
    }

    if (metrics.knowledgeEfficiency.utilizationRate < 40) {
      weaknesses.push('⚠️ معظم المعرفة لا تُستخدم');
    }

    if (metrics.adaptationMetrics.changeDetectionRate < 50) {
      weaknesses.push('⚠️ ضعف في اكتشاف التغييرات');
    }

    if (metrics.healthIndicators.errorRate > 30) {
      weaknesses.push('⚠️ معدل الأخطاء مرتفع جداً');
    }

    if (metrics.decisionQuality.consistency < 60) {
      weaknesses.push('⚠️ نتائج غير متسقة وغير موثوقة');
    }

    return weaknesses;
  }

  /**
   * توليد التوصيات
   */
  private generateRecommendations(metrics: EffectivenessMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.learningVelocity < 5) {
      recommendations.push(
        '💡 زيادة عدد التجارب والبيانات لتحسين سرعة التعلم'
      );
    }

    if (metrics.knowledgeEfficiency.utilizationRate < 70) {
      recommendations.push(
        '💡 مراجعة المعرفة المخزنة وإزالة المعرفة غير المستخدمة'
      );
    }

    if (metrics.adaptationMetrics.changeDetectionRate < 70) {
      recommendations.push(
        '💡 تحسين آليات كشف التغييرات في الصفحات'
      );
    }

    if (metrics.decisionQuality.consistency < 70) {
      recommendations.push(
        '💡 توحيد معايير اتخاذ القرارات وتقليل العشوائية'
      );
    }

    if (metrics.subsystemPerformance.selectorSystem < 70) {
      recommendations.push(
        '💡 تدريب نظام اختيار العناصر على صفحات أكثر تنوعاً'
      );
    }

    if (metrics.healthIndicators.errorRate > 25) {
      recommendations.push(
        '💡 تحسين معالجة الأخطاء والاستثناءات'
      );
    }

    return recommendations;
  }

  /**
   * تقييم شامل للفعالية
   */
  evaluateEffectiveness(): EffectivenessMetrics {
    const overallSuccessRate = this.calculateOverallSuccessRate();
    const successRateByDomain = this.calculateSuccessRateByDomain();
    const learningVelocity = this.calculateLearningVelocity();
    const decisionQuality = this.calculateDecisionQuality();
    const knowledgeEfficiency = this.calculateKnowledgeEfficiency();
    const adaptationMetrics = this.calculateAdaptationMetrics();
    const subsystemPerformance = this.calculateSubsystemPerformance();
    const healthIndicators = this.calculateHealthIndicators();

    // حساب الدرجة النهائية (مرجح)
    const overallScore = Math.round(
      overallSuccessRate * 0.3 + // 30%
      learningVelocity * 0.15 + // 15%
      decisionQuality.accuracy * 0.2 + // 20%
      knowledgeEfficiency.utilizationRate * 0.15 + // 15%
      adaptationMetrics.adaptationSpeed * 0.1 + // 10%
      (100 - healthIndicators.errorRate) * 0.1 // 10%
    );

    const metrics: EffectivenessMetrics = {
      overallSuccessRate,
      successRateByDomain,
      learningVelocity,
      decisionQuality,
      knowledgeEfficiency,
      adaptationMetrics,
      subsystemPerformance,
      healthIndicators,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      overallScore: Math.round(overallScore),
    };

    // تحديد النقاط القوية والضعيفة
    metrics.strengths = this.identifyStrengths(metrics);
    metrics.weaknesses = this.identifyWeaknesses(metrics);
    metrics.recommendations = this.generateRecommendations(metrics);

    // حفظ الدرجة للمقارنة
    this.scoreHistory.push(overallScore);
    this.previousScore = overallScore;

    return metrics;
  }

  /**
   * تقرير الفعالية الشامل
   */
  generateEffectivenessReport(): EffectivenessReport {
    const metrics = this.evaluateEffectiveness();

    // تحديد حالة النظام
    let status: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (metrics.overallScore >= 85) {
      status = 'excellent';
    } else if (metrics.overallScore >= 70) {
      status = 'good';
    } else if (metrics.overallScore >= 50) {
      status = 'acceptable';
    } else {
      status = 'poor';
    }

    // حساب التحسن
    let comparison = undefined;
    if (this.scoreHistory.length > 1) {
      const previousScore = this.scoreHistory[this.scoreHistory.length - 2];
      const improvement = metrics.overallScore - previousScore;
      comparison = {
        previousScore,
        improvement,
        trend:
          improvement > 2
            ? 'improving'
            : improvement < -2
            ? 'declining'
            : 'stable',
      };
    }

    // ملخص التقرير
    const summary = this.generateSummary(metrics, status);

    return {
      timestamp: new Date(),
      metrics,
      comparison,
      status,
      summary,
    };
  }

  /**
   * توليد ملخص التقرير
   */
  private generateSummary(metrics: EffectivenessMetrics, status: string): string {
    let summary = `🧠 تقييم فعالية عقل الذكاء الاصطناعي\n\n`;
    summary += `الحالة: ${this.getStatusEmoji(status)} ${status}\n`;
    summary += `الدرجة الإجمالية: ${metrics.overallScore}/100\n\n`;

    summary += `📊 المقاييس الرئيسية:\n`;
    summary += `• معدل النجاح: ${metrics.overallSuccessRate.toFixed(1)}%\n`;
    summary += `• سرعة التعلم: ${metrics.learningVelocity.toFixed(1)}\n`;
    summary += `• دقة القرارات: ${metrics.decisionQuality.accuracy.toFixed(1)}%\n`;
    summary += `• استخدام المعرفة: ${metrics.knowledgeEfficiency.utilizationRate.toFixed(1)}%\n\n`;

    summary += `💪 النقاط القوية (${metrics.strengths.length}):\n`;
    metrics.strengths.forEach((s) => (summary += `${s}\n`));

    summary += `\n⚠️ النقاط الضعيفة (${metrics.weaknesses.length}):\n`;
    metrics.weaknesses.forEach((w) => (summary += `${w}\n`));

    summary += `\n💡 التوصيات (${metrics.recommendations.length}):\n`;
    metrics.recommendations.forEach((r) => (summary += `${r}\n`));

    return summary;
  }

  /**
   * الحصول على رمز الحالة
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'excellent':
        return '🌟';
      case 'good':
        return '✅';
      case 'acceptable':
        return '⚡';
      case 'poor':
        return '🔴';
      default:
        return '❓';
    }
  }

  /**
   * الحصول على سجل الدرجات
   */
  getScoreHistory(): number[] {
    return this.scoreHistory;
  }

  /**
   * إعادة تعيين التقييم
   */
  reset(): void {
    this.experiences = [];
    this.patterns = [];
    this.knowledgeEntries = [];
    this.selectorMetrics = {};
    this.previousScore = 0;
    this.scoreHistory = [];
  }
}
