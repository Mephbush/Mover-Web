/**
 * نظام تعلم المحددات المتقدم
 * Advanced Selector Learning System - تعلم ذكي من التجارب السابقة
 * 
 * يتعلم من:
 * 1. المحددات الناجحة والفاشلة
 * 2. أنماط الصفحات المختلفة
 * 3. الأخطاء الشائعة والحلول
 * 4. السياق والبيئة
 */

export interface SelectorLearningRecord {
  id: string;
  selector: string;
  domain: string;
  pageStructure: string;
  targetElement: string;
  success: boolean;
  confidence: number;
  executionTime: number;
  context: {
    pageUrl: string;
    pageTitle: string;
    timestamp: Date;
    elementType: string;
    elementText?: string;
    elementClasses?: string[];
    elementAttributes?: Record<string, string>;
  };
  metadata: {
    selectorComplexity: number;
    foundElements: number;
    matchingScore: number;
  };
}

export interface SelectorPattern {
  name: string;
  pattern: RegExp;
  effectiveFor: string[]; // أنواع العناصر
  avgSuccessRate: number;
  lastUpdated: Date;
  usageCount: number;
  recommendations: string;
}

export interface DomainKnowledge {
  domain: string;
  successfulSelectors: Map<string, number>; // Selector -> success count
  failedSelectors: Set<string>;
  commonPatterns: SelectorPattern[];
  elementTypeStrategies: Map<string, string[]>; // Element type -> best selectors
  lastUpdated: Date;
}

/**
 * محرك التعلم المتقدم للمحددات
 */
export class SelectorLearningEngine {
  private learningRecords: SelectorLearningRecord[] = [];
  private domainKnowledge: Map<string, DomainKnowledge> = new Map();
  private globalPatterns: SelectorPattern[] = [];
  private successCluster: Map<string, string[]> = new Map(); // Cluster successful selectors
  private failureCluster: Map<string, string[]> = new Map(); // Cluster failed selectors
  private readonly maxRecords = 10000; // حد أقصى للسجلات المحفوظة

  constructor() {
    this.initializeGlobalPatterns();
  }

  /**
   * تهيئة الأنماط العامة
   */
  private initializeGlobalPatterns(): void {
    this.globalPatterns.push({
      name: 'ID Pattern',
      pattern: /#[\w-]+/,
      effectiveFor: ['all'],
      avgSuccessRate: 95,
      lastUpdated: new Date(),
      usageCount: 0,
      recommendations: 'استخدم معرف فريد كلما كان متاحاً',
    });

    this.globalPatterns.push({
      name: 'Data Attribute Pattern',
      pattern: /\[data-[\w-]+/,
      effectiveFor: ['form', 'button', 'input'],
      avgSuccessRate: 85,
      lastUpdated: new Date(),
      usageCount: 0,
      recommendations: 'تجاه المحددات data-* للعناصر التفاعلية',
    });

    this.globalPatterns.push({
      name: 'ARIA Pattern',
      pattern: /\[aria-[\w-]+/,
      effectiveFor: ['button', 'link', 'menu', 'modal'],
      avgSuccessRate: 80,
      lastUpdated: new Date(),
      usageCount: 0,
      recommendations: 'استخدم ARIA لعناصر التحكم التفاعلية',
    });

    this.globalPatterns.push({
      name: 'Text Content Pattern',
      pattern: /:has-text\(|:contains\(/,
      effectiveFor: ['button', 'link', 'label'],
      avgSuccessRate: 70,
      lastUpdated: new Date(),
      usageCount: 0,
      recommendations: 'استخدم النص للعثور على الأزرار والروابط',
    });

    this.globalPatterns.push({
      name: 'Class Pattern',
      pattern: /\.[\w-]+/,
      effectiveFor: ['form', 'div', 'span'],
      avgSuccessRate: 60,
      lastUpdated: new Date(),
      usageCount: 0,
      recommendations: 'الفئات قد تتغير، استخدمها كحل بديل',
    });
  }

  /**
   * تسجيل تجربة التعلم
   */
  recordLearningExperience(record: SelectorLearningRecord): void {
    // حساب مقاييس إضافية
    const complexity = this.calculateSelectorComplexity(record.selector);
    record.metadata.selectorComplexity = complexity;
    record.metadata.matchingScore = record.success ? 100 - complexity : complexity / 2;

    this.learningRecords.push(record);

    // الاحتفاظ بحد أقصى من السجلات
    if (this.learningRecords.length > this.maxRecords) {
      this.learningRecords.shift();
    }

    // تحديث المعرفة الخاصة بالمجال
    this.updateDomainKnowledge(record);

    // تحديث الأنماط
    this.updatePatterns(record);

    // تحديث المجموعات
    this.updateClusters(record);
  }

  /**
   * حساب تعقيد المحدد
   */
  private calculateSelectorComplexity(selector: string): number {
    let complexity = 0;

    // عدد المسافات (العلاقات الهرمية)
    complexity += (selector.match(/ /g) || []).length * 10;

    // عدد الأقواس والعوامل
    complexity += (selector.match(/\[/g) || []).length * 5;
    complexity += (selector.match(/>/g) || []).length * 8;
    complexity += (selector.match(/\+/g) || []).length * 8;
    complexity += (selector.match(/~/g) || []).length * 5;

    // الفئات الوهمية
    complexity += (selector.match(/:/g) || []).length * 3;

    // طول المحدد
    complexity += Math.floor(selector.length / 20);

    return Math.min(100, complexity);
  }

  /**
   * تحديث معرفة المجال
   */
  private updateDomainKnowledge(record: SelectorLearningRecord): void {
    let knowledge = this.domainKnowledge.get(record.domain);

    if (!knowledge) {
      knowledge = {
        domain: record.domain,
        successfulSelectors: new Map(),
        failedSelectors: new Set(),
        commonPatterns: [],
        elementTypeStrategies: new Map(),
        lastUpdated: new Date(),
      };
    }

    if (record.success) {
      const count = knowledge.successfulSelectors.get(record.selector) || 0;
      knowledge.successfulSelectors.set(record.selector, count + 1);
    } else {
      knowledge.failedSelectors.add(record.selector);
    }

    // تحديث استراتيجيات نوع العنصر
    const elementType = record.context.elementType;
    let strategies = knowledge.elementTypeStrategies.get(elementType) || [];

    if (record.success && !strategies.includes(record.selector)) {
      strategies = [record.selector, ...strategies].slice(0, 5); // احفظ أفضل 5
      knowledge.elementTypeStrategies.set(elementType, strategies);
    }

    knowledge.lastUpdated = new Date();
    this.domainKnowledge.set(record.domain, knowledge);
  }

  /**
   * تحديث الأنماط العامة
   */
  private updatePatterns(record: SelectorLearningRecord): void {
    for (const pattern of this.globalPatterns) {
      if (pattern.pattern.test(record.selector)) {
        // تحديث معدل النجاح
        const oldRate = pattern.avgSuccessRate;
        const newRate = record.success ? 100 : 0;
        pattern.avgSuccessRate = oldRate * 0.8 + newRate * 0.2;

        pattern.usageCount++;
        pattern.lastUpdated = new Date();
      }
    }

    // ترتيب الأنماط حسب معدل النجاح
    this.globalPatterns.sort((a, b) => b.avgSuccessRate - a.avgSuccessRate);
  }

  /**
   * تحديث المجموعات (Clustering)
   */
  private updateClusters(record: SelectorLearningRecord): void {
    // استخراج السمات المشتركة
    const features = this.extractSelectorFeatures(record.selector);
    const clusterKey = features.join('|');

    if (record.success) {
      const cluster = this.successCluster.get(clusterKey) || [];
      if (!cluster.includes(record.selector)) {
        cluster.push(record.selector);
      }
      this.successCluster.set(clusterKey, cluster);
    } else {
      const cluster = this.failureCluster.get(clusterKey) || [];
      if (!cluster.includes(record.selector)) {
        cluster.push(record.selector);
      }
      this.failureCluster.set(clusterKey, cluster);
    }
  }

  /**
   * استخراج سمات المحدد
   */
  private extractSelectorFeatures(selector: string): string[] {
    const features: string[] = [];

    if (selector.includes('#')) features.push('id');
    if (selector.includes('[data-')) features.push('data-attr');
    if (selector.includes('[aria-')) features.push('aria');
    if (selector.includes(':has-text')) features.push('text-content');
    if (selector.includes('.')) features.push('class');
    if (selector.includes('[role=')) features.push('role');
    if (selector.includes('>')) features.push('child');
    if (selector.includes('+')) features.push('adjacent');
    if (selector.includes(' ')) features.push('descendant');

    return features;
  }

  /**
   * الحصول على أفضل استراتيجية لنوع عنصر معين
   */
  getBestStrategyForElementType(domain: string, elementType: string): string[] {
    const knowledge = this.domainKnowledge.get(domain);

    if (knowledge) {
      const strategies = knowledge.elementTypeStrategies.get(elementType);
      if (strategies && strategies.length > 0) {
        return strategies;
      }
    }

    // إذا لم نجد في المجال، استخدم الأنماط العامة
    return this.globalPatterns
      .filter((p) => p.effectiveFor.includes(elementType) || p.effectiveFor.includes('all'))
      .slice(0, 3)
      .map((p) => p.name);
  }

  /**
   * التنبؤ بنجاح المحدد
   */
  predictSelectorSuccess(selector: string, domain: string, elementType: string): number {
    const features = this.extractSelectorFeatures(selector);
    const clusterKey = features.join('|');

    // البحث عن مجموعات ناجحة مشابهة
    const successCluster = this.successCluster.get(clusterKey);
    if (successCluster && successCluster.length > 0) {
      return 0.8; // 80% نجاح للمجموعات الناجحة المعروفة
    }

    // البحث عن مجموعات فاشلة
    const failureCluster = this.failureCluster.get(clusterKey);
    if (failureCluster && failureCluster.length > 0) {
      return 0.2; // 20% فقط للمجموعات الفاشلة
    }

    // تقدير بناءً على الأنماط المطابقة
    let predictions: number[] = [];
    for (const pattern of this.globalPatterns) {
      if (pattern.pattern.test(selector)) {
        predictions.push(pattern.avgSuccessRate / 100);
      }
    }

    if (predictions.length === 0) {
      return 0.5; // قيمة افتراضية محايدة
    }

    return Math.max(...predictions);
  }

  /**
   * توليد توصيات لتحسين المحدد
   */
  generateSelectorRecommendations(selector: string, domain: string, elementType: string): string[] {
    const recommendations: string[] = [];

    // التحقق من استخدام الأنماط الفعالة
    const bestPatterns = this.globalPatterns.filter((p) =>
      p.effectiveFor.includes(elementType) || p.effectiveFor.includes('all')
    );

    for (const pattern of bestPatterns) {
      if (!pattern.pattern.test(selector)) {
        recommendations.push(`💡 ${pattern.recommendations}`);
      }
    }

    // التحقق من تعقيد المحدد
    const complexity = this.calculateSelectorComplexity(selector);
    if (complexity > 70) {
      recommendations.push('💡 المحدد معقد جداً، حاول تبسيطه');
    }

    // استخراج من المعرفة المجال
    const knowledge = this.domainKnowledge.get(domain);
    if (knowledge) {
      const bestSelectors = Array.from(knowledge.successfulSelectors.entries())
        .filter(([sel]) => sel !== selector)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([sel]) => sel);

      if (bestSelectors.length > 0) {
        recommendations.push(`💡 جرب هذه المحددات الناجحة: ${bestSelectors.join(', ')}`);
      }
    }

    return recommendations;
  }

  /**
   * الحصول على رؤى التعلم
   */
  getLearningInsights(): any {
    const totalRecords = this.learningRecords.length;
    const successRecords = this.learningRecords.filter((r) => r.success).length;
    const successRate = totalRecords > 0 ? (successRecords / totalRecords) * 100 : 0;

    // أكثر المحددات استخداماً
    const selectorUsage = new Map<string, number>();
    for (const record of this.learningRecords) {
      selectorUsage.set(record.selector, (selectorUsage.get(record.selector) || 0) + 1);
    }

    const topSelectors = Array.from(selectorUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // أسوأ أداء
    const failureCount = new Map<string, number>();
    for (const record of this.learningRecords.filter((r) => !r.success)) {
      failureCount.set(record.selector, (failureCount.get(record.selector) || 0) + 1);
    }

    const worstPerformers = Array.from(failureCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalExperiences: totalRecords,
      overallSuccessRate: Math.round(successRate),
      topSelectors: topSelectors.map(([sel, count]) => ({ selector: sel, usageCount: count })),
      worstPerformers: worstPerformers.map(([sel, count]) => ({
        selector: sel,
        failureCount: count,
      })),
      totalDomains: this.domainKnowledge.size,
      totalPatterns: this.globalPatterns.length,
      bestPatterns: this.globalPatterns
        .slice(0, 3)
        .map((p) => ({
          name: p.name,
          successRate: Math.round(p.avgSuccessRate),
        })),
    };
  }

  /**
   * الحصول على سجلات التعلم
   */
  getLearningRecords(domain?: string, limit: number = 100): SelectorLearningRecord[] {
    let records = this.learningRecords;

    if (domain) {
      records = records.filter((r) => r.domain === domain);
    }

    return records.slice(-limit);
  }

  /**
   * تصدير معرفة المجال
   */
  exportDomainKnowledge(domain: string): any {
    const knowledge = this.domainKnowledge.get(domain);

    if (!knowledge) {
      return null;
    }

    return {
      domain,
      successfulSelectors: Array.from(knowledge.successfulSelectors.entries()),
      failedSelectors: Array.from(knowledge.failedSelectors),
      elementTypeStrategies: Array.from(knowledge.elementTypeStrategies.entries()),
      lastUpdated: knowledge.lastUpdated,
    };
  }

  /**
   * استيراد معرفة المجال
   */
  importDomainKnowledge(knowledgeData: any): void {
    const knowledge: DomainKnowledge = {
      domain: knowledgeData.domain,
      successfulSelectors: new Map(knowledgeData.successfulSelectors || []),
      failedSelectors: new Set(knowledgeData.failedSelectors || []),
      commonPatterns: knowledgeData.commonPatterns || [],
      elementTypeStrategies: new Map(knowledgeData.elementTypeStrategies || []),
      lastUpdated: new Date(knowledgeData.lastUpdated || new Date()),
    };

    this.domainKnowledge.set(knowledge.domain, knowledge);
  }

  /**
   * إعادة تعيين النظام
   */
  reset(): void {
    this.learningRecords = [];
    this.domainKnowledge.clear();
    this.successCluster.clear();
    this.failureCluster.clear();
    this.initializeGlobalPatterns();
  }
}

// تصدير مثيل فردي
export const selectorLearningEngine = new SelectorLearningEngine();
