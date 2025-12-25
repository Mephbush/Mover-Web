/**
 * نظام محدد العناصر المحسّن
 * Enhanced Selector System - تقوية شاملة لاختيار وإيجاد العناصر
 * 
 * يتضمن:
 * 1. اختيار ذكي للمحددات بناءً على التعلم
 * 2. تقييم فوري لجودة المحدد
 * 3. استراتيجيات بديلة متقدمة
 * 4. تتبع دقيق لأداء كل محدد
 * 5. تصحيح ذاتي وتحسين مستمر
 */

export interface SelectorMetric {
  selector: string;
  successRate: number;
  failureRate: number;
  averageExecutionTime: number;
  uniqueIdentification: number; // كم عدد العناصر التي يحددها (1 = مثالي)
  stability: number; // كم مرة أعطى نفس النتيجة
  reliability: number; // درجة موثوقية المحدد الإجمالية (0-100)
  lastUsed: Date;
  usageCount: number;
  successCount: number;
  failureCount: number;
  score: number; // النقاط المرجحة
}

export interface SelectorEvaluation {
  selector: string;
  quality: number; // 0-100
  confidence: number; // 0-100
  uniqueness: number; // 0-100
  stability: number; // 0-100
  recommendations: string[];
  alternatives: string[];
}

export interface SelectionStrategy {
  name: string;
  description: string;
  priority: number;
  confidence: number;
  selectors: string[];
  fallbacks: string[];
}

/**
 * محرك الاختيار الذكي المحسّن
 */
export class EnhancedSelectorIntelligence {
  private selectorMetrics: Map<string, SelectorMetric> = new Map();
  private selectorPatterns: Map<string, any> = new Map();
  private learnedStrategies: SelectionStrategy[] = [];
  private domainStrategies: Map<string, SelectionStrategy[]> = new Map();
  private failureHistory: Array<{ selector: string; reason: string; timestamp: Date }> = [];

  constructor() {
    this.initializeCommonPatterns();
  }

  /**
   * تهيئة الأنماط الشائعة والناجحة
   */
  private initializeCommonPatterns(): void {
    this.selectorPatterns.set('id-based', {
      patterns: ['#[id]', '[id="[id]"]'],
      priority: 95,
      description: 'محددات قائمة على معرف فريد',
    });

    this.selectorPatterns.set('class-based', {
      patterns: ['.[class]', '[class*="[class]"]', '[class~="[class]"]'],
      priority: 85,
      description: 'محددات قائمة على الفئات',
    });

    this.selectorPatterns.set('attribute-based', {
      patterns: ['[data-*]', '[aria-*]', '[role="[role]"]'],
      priority: 80,
      description: 'محددات قائمة على الخصائص',
    });

    this.selectorPatterns.set('semantic', {
      patterns: ['button:has-text("[text]")', 'a:has-text("[text]")', 'input[placeholder*="[placeholder]"]'],
      priority: 75,
      description: 'محددات دلالية بناءً على المحتوى',
    });

    this.selectorPatterns.set('structural', {
      patterns: ['parent > child', 'ancestor descendant', 'sibling + next'],
      priority: 65,
      description: 'محددات بناءً على البنية الهرمية',
    });

    this.selectorPatterns.set('pseudo-classes', {
      patterns: [':first-child', ':last-child', ':nth-child(n)', ':visible'],
      priority: 60,
      description: 'محددات باستخدام فئات وهمية',
    });
  }

  /**
   * تحليل وتقييم المحدد
   */
  evaluateSelector(
    selector: string,
    pageContent: string,
    foundElements: number = 1
  ): SelectorEvaluation {
    const metric = this.selectorMetrics.get(selector);
    
    // جودة المحدد
    let quality = 80;
    quality -= Math.abs(foundElements - 1) * 10; // -10 لكل عنصر إضافي أو ناقص
    quality = Math.max(0, Math.min(100, quality));

    // الثقة بناءً على التاريخ
    let confidence = 50;
    if (metric) {
      confidence = metric.reliability;
    } else {
      // تقدير أولي بناءً على جودة المحدد
      if (selector.includes('#')) confidence += 30; // معرفات قوية
      if (selector.includes('[')) confidence += 15; // خصائص جيدة
      if (selector.includes(':')) confidence += 10; // فئات وهمية معقولة
    }

    // التفرد
    let uniqueness = 100;
    if (foundElements > 1) uniqueness = Math.max(0, 100 - foundElements * 10);
    if (foundElements === 0) uniqueness = 0;

    // الاستقرار
    let stability = 70;
    if (metric && metric.stability > 0) {
      stability = metric.stability;
    }

    // التوصيات
    const recommendations: string[] = [];
    if (foundElements === 0) {
      recommendations.push('❌ المحدد لم يعثر على أي عنصر');
    }
    if (foundElements > 1) {
      recommendations.push(`⚠️ المحدد يحدد ${foundElements} عناصر، يجب توضيحه أكثر`);
    }
    if (quality < 70) {
      recommendations.push('💡 حاول استخدام معرف فريد أو خاصية مميزة');
    }
    if (!selector.includes('#') && !selector.includes('[')) {
      recommendations.push('💡 إضافة معرف أو خاصية قد تحسن موثوقية المحدد');
    }

    // الخيارات البديلة
    const alternatives = this.generateAlternativeSelectors(selector, foundElements);

    return {
      selector,
      quality: Math.round(quality),
      confidence: Math.round(confidence),
      uniqueness: Math.round(uniqueness),
      stability: Math.round(stability),
      recommendations,
      alternatives,
    };
  }

  /**
   * توليد محددات بديلة
   */
  private generateAlternativeSelectors(selector: string, foundElements: number): string[] {
    const alternatives: string[] = [];

    // إذا كان المحدد يوجد عنصراً واحداً، اقترح نسخاً أخرى
    if (foundElements === 1) {
      if (!selector.includes('[')) {
        alternatives.push(`${selector}[type]:first-of-type`);
      }
      if (!selector.includes(':')) {
        alternatives.push(`${selector}:visible`);
      }
      return alternatives;
    }

    // إذا كان يوجد عدة عناصر، حاول توضيح المحدد
    if (foundElements > 1) {
      alternatives.push(`${selector}:first-of-type`);
      alternatives.push(`${selector}[data-active="true"]`);
      alternatives.push(`${selector}:visible:first`);
      alternatives.push(`${selector}.active`);
    }

    return alternatives.slice(0, 3); // أرجع أفضل 3 خيارات
  }

  /**
   * تسجيل محاولة استخدام المحدد
   */
  recordSelectorUsage(
    selector: string,
    success: boolean,
    executionTime: number,
    foundElements: number = 1
  ): void {
    let metric = this.selectorMetrics.get(selector);

    if (!metric) {
      metric = {
        selector,
        successRate: 0,
        failureRate: 0,
        averageExecutionTime: 0,
        uniqueIdentification: 0,
        stability: 0,
        reliability: 0,
        lastUsed: new Date(),
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        score: 0,
      };
    }

    // تحديث الإحصائيات
    metric.usageCount++;
    metric.lastUsed = new Date();

    if (success) {
      metric.successCount++;
      metric.successRate = (metric.successCount / metric.usageCount) * 100;
    } else {
      metric.failureCount++;
      metric.failureRate = (metric.failureCount / metric.usageCount) * 100;
    }

    // تحديث متوسط وقت التنفيذ
    metric.averageExecutionTime =
      metric.averageExecutionTime * 0.7 + executionTime * 0.3;

    // تحديث التفرد (كم عدد العناصر المطابقة)
    metric.uniqueIdentification = Math.max(
      0,
      100 - Math.abs(foundElements - 1) * 10
    );

    // تحديث الاستقرار
    metric.stability = Math.min(100, metric.usageCount * (metric.successRate / 100) * 10);

    // حساب الموثوقية
    metric.reliability =
      metric.successRate * 0.4 +
      metric.uniqueIdentification * 0.3 +
      metric.stability * 0.2 +
      Math.max(0, 100 - metric.averageExecutionTime / 10) * 0.1;

    // حساب النقاط المرجحة
    metric.score =
      metric.successRate * 0.3 +
      metric.uniqueIdentification * 0.3 +
      (100 - metric.failureRate) * 0.2 +
      metric.stability * 0.2;

    this.selectorMetrics.set(selector, metric);

    // تسجيل في السجل إذا فشل
    if (!success) {
      this.failureHistory.push({
        selector,
        reason: 'استخدام فشل',
        timestamp: new Date(),
      });

      // الاحتفاظ بآخر 100 فشل فقط
      if (this.failureHistory.length > 100) {
        this.failureHistory.shift();
      }
    }
  }

  /**
   * الحصول على أفضل محدد من قائمة المحددات
   */
  selectBestSelector(selectors: string[]): string {
    if (selectors.length === 0) return '';
    if (selectors.length === 1) return selectors[0];

    // ترتيب المحددات حسب الموثوقية
    const scored = selectors.map((sel) => {
      const metric = this.selectorMetrics.get(sel);
      const score = metric ? metric.score : this.estimateSelectorScore(sel);
      return { selector: sel, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].selector;
  }

  /**
   * تقدير نقاط المحدد الجديد
   */
  private estimateSelectorScore(selector: string): number {
    let score = 50;

    if (selector.includes('#')) score += 30;
    if (selector.includes('[id=')) score += 25;
    if (selector.includes('[data-')) score += 15;
    if (selector.includes('[aria-')) score += 10;
    if (selector.includes(':visible')) score += 5;
    if (selector.includes(':first')) score += 3;

    // تقليل النقاط للمحددات المعقدة جداً
    if ((selector.match(/>/g) || []).length > 3) score -= 10;
    if (selector.length > 100) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * تعلم استراتيجية جديدة من النجاح
   */
  learnSelectionStrategy(
    domain: string,
    selectors: string[],
    success: boolean,
    confidence: number
  ): void {
    if (!success || confidence < 0.6) return;

    // البحث عن استراتيجية موجودة
    let strategies = this.domainStrategies.get(domain) || [];
    const existingStrategy = strategies.find((s) =>
      s.selectors.every((sel) => selectors.includes(sel))
    );

    if (existingStrategy) {
      existingStrategy.confidence = Math.min(100, existingStrategy.confidence + 5);
      existingStrategy.priority = Math.min(100, existingStrategy.priority + 2);
    } else {
      // إنشاء استراتيجية جديدة
      const newStrategy: SelectionStrategy = {
        name: `Strategy-${domain}-${Date.now()}`,
        description: `استراتيجية ناجحة للعثور على العناصر في ${domain}`,
        priority: Math.round(confidence * 100),
        confidence: Math.round(confidence * 100),
        selectors,
        fallbacks: this.generateFallbackSelectors(selectors),
      };

      strategies.push(newStrategy);
      this.learnedStrategies.push(newStrategy);
    }

    // الاحتفاظ بأفضل 10 استراتيجيات فقط لكل مجال
    strategies.sort((a, b) => b.priority - a.priority);
    if (strategies.length > 10) {
      strategies = strategies.slice(0, 10);
    }

    this.domainStrategies.set(domain, strategies);
  }

  /**
   * توليد محددات بديلة للاستراتيجية
   */
  private generateFallbackSelectors(selectors: string[]): string[] {
    const fallbacks: string[] = [];

    for (const selector of selectors) {
      // محدد الدخول (أول عنصر)
      fallbacks.push(`${selector}:first`);

      // نسخة مع تصفية الدخول المخفية
      fallbacks.push(`${selector}:visible`);

      // نسخة مع بحث الآباء
      fallbacks.push(`${selector.split(' ')[0]}`);
    }

    return fallbacks.slice(0, 3);
  }

  /**
   * الحصول على أفضل استراتيجية للمجال
   */
  getBestStrategyForDomain(domain: string): SelectionStrategy | null {
    const strategies = this.domainStrategies.get(domain) || [];
    if (strategies.length === 0) return null;

    strategies.sort((a, b) => b.priority - a.priority);
    return strategies[0];
  }

  /**
   * استخراج محددات متعلمة من قاعدة المعرفة
   */
  getLearnedSelectors(domain: string): string[] {
    const strategy = this.getBestStrategyForDomain(domain);
    if (!strategy) {
      // إرجاع المحددات الناجحة من هذا المجال
      return Array.from(this.selectorMetrics.entries())
        .filter(([_, metric]) => metric.successRate > 70)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([selector]) => selector);
    }

    return strategy.selectors;
  }

  /**
   * تحسين محدد قديم بناءً على الأخطاء السابقة
   */
  improveSelector(
    selector: string,
    pageStructure: any,
    previousFailures: number = 0
  ): string {
    // إذا كان لدينا فشل سابق، حاول توضيح المحدد
    if (previousFailures > 0) {
      // إضافة :visible
      if (!selector.includes(':visible')) {
        return `${selector}:visible`;
      }

      // إضافة :first
      if (!selector.includes(':first')) {
        return `${selector}:first`;
      }

      // تقسيم واختيار الجزء الأول
      const parts = selector.split(' ');
      if (parts.length > 1) {
        return parts[parts.length - 1];
      }
    }

    return selector;
  }

  /**
   * تحليل الفشل واستخراج الدروس
   */
  analyzeFailurePattern(): any {
    const patterns: Map<string, number> = new Map();

    for (const failure of this.failureHistory) {
      const pattern = failure.selector.split('[')[0]; // استخرج النمط الأساسي
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // ترتيب حسب التكرار
    const sorted = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      mostFailedPatterns: sorted.map(([pattern, count]) => ({
        pattern,
        failureCount: count,
      })),
      insights: this.generateInsights(sorted),
    };
  }

  /**
   * توليد رؤى من أنماط الفشل
   */
  private generateInsights(patterns: Array<[string, number]>): string[] {
    const insights: string[] = [];

    if (patterns.length === 0) {
      insights.push('✅ لا توجد أنماط فشل واضحة');
      return insights;
    }

    const topPattern = patterns[0];
    if (topPattern[1] > 5) {
      insights.push(
        `⚠️ المحدد "${topPattern[0]}" فشل ${topPattern[1]} مرات، يجب مراجعته`
      );
    }

    const totalFailures = patterns.reduce((sum, [_, count]) => sum + count, 0);
    if (totalFailures > 10) {
      insights.push('⚠️ هناك نسبة عالية من الفشل، قد تحتاج إلى إعادة تدريب');
    }

    if (patterns.some(([pat]) => pat.includes('button'))) {
      insights.push(
        '💡 المحددات للأزرار تفشل كثيراً، جرب استخدام [role="button"] بدلاً من ذلك'
      );
    }

    return insights;
  }

  /**
   * الحصول على تقرير أداء كامل
   */
  getPerformanceReport(): any {
    const metrics = Array.from(this.selectorMetrics.values());

    if (metrics.length === 0) {
      return {
        totalSelectors: 0,
        averageSuccessRate: 0,
        averageReliability: 0,
        topPerformers: [],
        bottomPerformers: [],
        insights: ['لم تسجل أي بيانات بعد'],
      };
    }

    const averageSuccessRate =
      metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
    const averageReliability =
      metrics.reduce((sum, m) => sum + m.reliability, 0) / metrics.length;

    // أفضل المحددات
    const topPerformers = metrics
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((m) => ({
        selector: m.selector,
        score: Math.round(m.score),
        successRate: Math.round(m.successRate),
        usageCount: m.usageCount,
      }));

    // أسوأ المحددات
    const bottomPerformers = metrics
      .filter((m) => m.usageCount >= 3) // فقط التي تُستخدم 3 مرات على الأقل
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((m) => ({
        selector: m.selector,
        score: Math.round(m.score),
        successRate: Math.round(m.successRate),
        usageCount: m.usageCount,
      }));

    return {
      totalSelectors: metrics.length,
      averageSuccessRate: Math.round(averageSuccessRate),
      averageReliability: Math.round(averageReliability),
      topPerformers,
      bottomPerformers,
      insights: this.analyzeFailurePattern().insights,
    };
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  reset(): void {
    this.selectorMetrics.clear();
    this.selectorPatterns.clear();
    this.learnedStrategies = [];
    this.domainStrategies.clear();
    this.failureHistory = [];
    this.initializeCommonPatterns();
  }

  /**
   * الحصول على جميع المقاييس
   */
  getMetrics(): SelectorMetric[] {
    return Array.from(this.selectorMetrics.values());
  }
}

// تصدير مثيل فردي
export const enhancedSelectorIntelligence = new EnhancedSelectorIntelligence();
