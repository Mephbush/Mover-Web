/**
 * الذكاء التكيفي - يتكيف مع التغييرات والظروف المختلفة
 * Adaptive Intelligence - Adapts to changes and different circumstances
 */

import { PageContext, DecisionResult } from '../ai-decision-engine';
import { learningEngine } from './learning-engine';

export interface AdaptationContext {
  currentState: any;
  previousState?: any;
  changeDetected: boolean;
  changeType?: 'structure' | 'behavior' | 'content' | 'timing';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface AdaptationStrategy {
  name: string;
  type: 'reactive' | 'proactive' | 'predictive';
  actions: Array<{
    condition: string;
    response: string;
    priority: number;
  }>;
  confidence: number;
}

export interface EnvironmentProfile {
  website: string;
  characteristics: {
    structure: 'static' | 'dynamic' | 'spa' | 'hybrid';
    changeFrequency: 'rare' | 'occasional' | 'frequent' | 'constant';
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    antiBot: 'none' | 'basic' | 'moderate' | 'advanced' | 'extreme';
  };
  patterns: {
    selectors: Map<string, number>; // selector -> stability score
    behaviors: Map<string, number>; // behavior -> predictability score
    timings: Map<string, number>; // action -> average duration
  };
  lastUpdated: Date;
}

/**
 * نظام الذكاء التكيفي
 */
export class AdaptiveIntelligence {
  private environmentProfiles: Map<string, EnvironmentProfile> = new Map();
  private adaptationHistory: Map<string, any[]> = new Map();

  /**
   * كشف التغييرات في البيئة
   */
  async detectChanges(
    website: string,
    currentPage: PageContext,
    expectedStructure?: any
  ): Promise<AdaptationContext> {
    console.log(`🔍 فحص التغييرات في ${website}...`);

    const profile = this.environmentProfiles.get(website);

    if (!profile) {
      // أول زيارة - إنشاء profile
      await this.createEnvironmentProfile(website, currentPage);
      return {
        currentState: currentPage,
        changeDetected: false,
        severity: 'minor',
      };
    }

    // مقارنة مع الحالة السابقة
    const structureChanged = this.compareStructure(
      currentPage,
      expectedStructure
    );
    const behaviorChanged = this.compareBehavior(currentPage, profile);
    const contentChanged = this.compareContent(currentPage, profile);

    if (structureChanged || behaviorChanged || contentChanged) {
      const changeType = structureChanged
        ? 'structure'
        : behaviorChanged
        ? 'behavior'
        : 'content';

      const severity = this.assessChangeSeverity(
        changeType,
        currentPage,
        profile
      );

      console.log(`⚠️ تم اكتشاف تغيير: ${changeType} - الخطورة: ${severity}`);

      return {
        currentState: currentPage,
        previousState: profile,
        changeDetected: true,
        changeType,
        severity,
      };
    }

    return {
      currentState: currentPage,
      changeDetected: false,
      severity: 'minor',
    };
  }

  /**
   * التكيف مع التغييرات
   */
  async adapt(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    console.log(`🔄 التكيف مع التغييرات...`);

    if (!context.changeDetected) {
      return {
        name: 'no_adaptation',
        type: 'reactive',
        actions: [],
        confidence: 1.0,
      };
    }

    // اختيار استراتيجية التكيف بناءً على نوع التغيير
    let strategy: AdaptationStrategy;

    switch (context.changeType) {
      case 'structure':
        strategy = await this.adaptToStructureChange(context, taskContext);
        break;
      case 'behavior':
        strategy = await this.adaptToBehaviorChange(context, taskContext);
        break;
      case 'content':
        strategy = await this.adaptToContentChange(context, taskContext);
        break;
      case 'timing':
        strategy = await this.adaptToTimingChange(context, taskContext);
        break;
      default:
        strategy = await this.createGenericAdaptation(context, taskContext);
    }

    // تسجيل التكيف
    await this.recordAdaptation(taskContext.website, {
      context,
      strategy,
      timestamp: new Date(),
    });

    return strategy;
  }

  /**
   * توقع التغييرات المستقبلية
   */
  async predictChanges(
    website: string,
    timeframe: number = 7 * 24 * 60 * 60 * 1000 // أسبوع
  ): Promise<{
    likelihood: number;
    expectedChanges: Array<{
      type: string;
      probability: number;
      impact: string;
    }>;
    recommendations: string[];
  }> {
    const profile = this.environmentProfiles.get(website);

    if (!profile) {
      return {
        likelihood: 0.3,
        expectedChanges: [],
        recommendations: ['بناء profile للموقع أولاً'],
      };
    }

    const history = this.adaptationHistory.get(website) || [];

    // تحليل تاريخ التغييرات
    const recentChanges = history.filter(
      (h) => Date.now() - new Date(h.timestamp).getTime() < timeframe
    );

    const changeProbability = Math.min(recentChanges.length / 10, 1.0);

    // توقع أنواع التغييرات
    const expectedChanges = this.analyzeChangePatterns(recentChanges);

    // تقديم توصيات
    const recommendations = this.generatePredictiveRecommendations(
      profile,
      expectedChanges
    );

    return {
      likelihood: changeProbability,
      expectedChanges,
      recommendations,
    };
  }

  /**
   * التعلم من التكيفات الناجحة
   */
  async learnFromAdaptation(
    website: string,
    adaptation: any,
    success: boolean
  ): Promise<void> {
    const profile = this.environmentProfiles.get(website);

    if (!profile) return;

    if (success) {
      // تحديث الأنماط الناجحة
      if (adaptation.strategy.type === 'reactive') {
        // زيادة ثقة الاستراتيجيات التفاعلية
        adaptation.strategy.actions.forEach((action: any) => {
          // تحديث درجة الثقة
        });
      }
    } else {
      // تعلم من الفشل
      console.log(`📚 تعلم من فشل التكيف: ${adaptation.strategy.name}`);
    }

    profile.lastUpdated = new Date();
    this.environmentProfiles.set(website, profile);
  }

  /**
   * الحصول على توصيات تكيفية
   */
  async getAdaptiveRecommendations(
    website: string,
    taskType: string
  ): Promise<{
    selectors: string[];
    strategies: string[];
    timings: { [key: string]: number };
    warnings: string[];
  }> {
    const profile = this.environmentProfiles.get(website);

    if (!profile) {
      return {
        selectors: [],
        strategies: ['استخدام الاستراتيجية الافتراضية'],
        timings: {},
        warnings: ['لا يوجد profile - قد تحدث أخطاء'],
      };
    }

    // استخراج أفضل selectors
    const bestSelectors = Array.from(profile.patterns.selectors.entries())
      .filter(([_, score]) => score > 0.7)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([selector]) => selector);

    // استخراج أفضل الاستراتيجيات
    const bestStrategies = Array.from(profile.patterns.behaviors.entries())
      .filter(([_, score]) => score > 0.6)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([behavior]) => behavior);

    // استخراج التوقيتات المثلى
    const optimalTimings = Object.fromEntries(
      Array.from(profile.patterns.timings.entries())
    );

    // التحذيرات
    const warnings: string[] = [];

    if (profile.characteristics.antiBot === 'advanced' || 
        profile.characteristics.antiBot === 'extreme') {
      warnings.push('⚠️ نظام مكافحة روبوتات متقدم - استخدم التخفي الكامل');
    }

    if (profile.characteristics.changeFrequency === 'frequent' || 
        profile.characteristics.changeFrequency === 'constant') {
      warnings.push('⚠️ الموقع يتغير بشكل متكرر - توقع فشل selectors');
    }

    return {
      selectors: bestSelectors,
      strategies: bestStrategies,
      timings: optimalTimings,
      warnings,
    };
  }

  /**
   * تحديث ملف البيئة
   */
  async updateEnvironmentProfile(
    website: string,
    pageContext: PageContext,
    executionData: any
  ): Promise<void> {
    let profile = this.environmentProfiles.get(website);

    if (!profile) {
      profile = await this.createEnvironmentProfile(website, pageContext);
    }

    // تحديث الأنماط
    if (executionData.selector) {
      const currentScore = profile.patterns.selectors.get(executionData.selector) || 0;
      const newScore = executionData.success
        ? Math.min(currentScore + 0.1, 1.0)
        : Math.max(currentScore - 0.1, 0);
      profile.patterns.selectors.set(executionData.selector, newScore);
    }

    if (executionData.behavior) {
      const currentScore = profile.patterns.behaviors.get(executionData.behavior) || 0;
      const newScore = executionData.success
        ? Math.min(currentScore + 0.1, 1.0)
        : Math.max(currentScore - 0.1, 0);
      profile.patterns.behaviors.set(executionData.behavior, newScore);
    }

    if (executionData.action && executionData.duration) {
      const currentAvg = profile.patterns.timings.get(executionData.action) || 0;
      const newAvg = currentAvg === 0 
        ? executionData.duration 
        : (currentAvg + executionData.duration) / 2;
      profile.patterns.timings.set(executionData.action, newAvg);
    }

    profile.lastUpdated = new Date();
    this.environmentProfiles.set(website, profile);
  }

  // ====== وظائف مساعدة خاصة ======

  private async createEnvironmentProfile(
    website: string,
    pageContext: PageContext
  ): Promise<EnvironmentProfile> {
    console.log(`🆕 إنشاء profile جديد لـ ${website}`);

    const profile: EnvironmentProfile = {
      website,
      characteristics: {
        structure: this.detectStructureType(pageContext),
        changeFrequency: 'occasional',
        complexity: this.assessComplexity(pageContext),
        antiBot: this.detectAntiBotLevel(pageContext),
      },
      patterns: {
        selectors: new Map(),
        behaviors: new Map(),
        timings: new Map(),
      },
      lastUpdated: new Date(),
    };

    this.environmentProfiles.set(website, profile);
    return profile;
  }

  private detectStructureType(pageContext: PageContext): 'static' | 'dynamic' | 'spa' | 'hybrid' {
    // تحليل بنية الصفحة
    const content = pageContext.content || '';
    
    if (content.includes('react') || content.includes('vue') || content.includes('angular')) {
      return 'spa';
    }
    
    if (content.includes('data-reactroot') || content.includes('ng-app')) {
      return 'hybrid';
    }

    return 'static';
  }

  private assessComplexity(pageContext: PageContext): 'simple' | 'moderate' | 'complex' | 'very_complex' {
    const elements = pageContext.elements?.length || 0;

    if (elements < 50) return 'simple';
    if (elements < 150) return 'moderate';
    if (elements < 300) return 'complex';
    return 'very_complex';
  }

  private detectAntiBotLevel(pageContext: PageContext): 'none' | 'basic' | 'moderate' | 'advanced' | 'extreme' {
    const content = pageContext.content || '';

    if (content.includes('cloudflare') || content.includes('recaptcha')) {
      return 'advanced';
    }

    if (content.includes('captcha')) {
      return 'moderate';
    }

    return 'basic';
  }

  private compareStructure(current: PageContext, expected?: any): boolean {
    if (!expected) return false;
    // مقارنة البنية
    return Math.random() > 0.8; // محاكاة
  }

  private compareBehavior(current: PageContext, profile: EnvironmentProfile): boolean {
    // مقارنة السلوك
    return Math.random() > 0.9; // محاكاة
  }

  private compareContent(current: PageContext, profile: EnvironmentProfile): boolean {
    // مقارنة المحتوى
    return Math.random() > 0.85; // محاكاة
  }

  private assessChangeSeverity(
    changeType: string,
    current: PageContext,
    profile: EnvironmentProfile
  ): 'minor' | 'moderate' | 'major' | 'critical' {
    if (changeType === 'structure') {
      return 'major';
    }
    if (changeType === 'behavior') {
      return 'moderate';
    }
    return 'minor';
  }

  private async adaptToStructureChange(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    return {
      name: 'structure_adaptation',
      type: 'reactive',
      actions: [
        {
          condition: 'selector_not_found',
          response: 'use_alternative_selectors',
          priority: 1,
        },
        {
          condition: 'element_position_changed',
          response: 'recalculate_positions',
          priority: 2,
        },
      ],
      confidence: 0.7,
    };
  }

  private async adaptToBehaviorChange(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    return {
      name: 'behavior_adaptation',
      type: 'reactive',
      actions: [
        {
          condition: 'timing_changed',
          response: 'adjust_wait_times',
          priority: 1,
        },
        {
          condition: 'interaction_pattern_changed',
          response: 'update_interaction_strategy',
          priority: 2,
        },
      ],
      confidence: 0.75,
    };
  }

  private async adaptToContentChange(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    return {
      name: 'content_adaptation',
      type: 'reactive',
      actions: [
        {
          condition: 'text_changed',
          response: 'update_text_matchers',
          priority: 1,
        },
      ],
      confidence: 0.8,
    };
  }

  private async adaptToTimingChange(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    return {
      name: 'timing_adaptation',
      type: 'proactive',
      actions: [
        {
          condition: 'loading_slower',
          response: 'increase_timeouts',
          priority: 1,
        },
      ],
      confidence: 0.85,
    };
  }

  private async createGenericAdaptation(
    context: AdaptationContext,
    taskContext: any
  ): Promise<AdaptationStrategy> {
    return {
      name: 'generic_adaptation',
      type: 'reactive',
      actions: [],
      confidence: 0.5,
    };
  }

  private async recordAdaptation(website: string, record: any): Promise<void> {
    const history = this.adaptationHistory.get(website) || [];
    history.push(record);

    // الحفاظ على آخر 100 تكيف
    if (history.length > 100) {
      history.shift();
    }

    this.adaptationHistory.set(website, history);
  }

  private analyzeChangePatterns(history: any[]): Array<{
    type: string;
    probability: number;
    impact: string;
  }> {
    const patterns: Map<string, number> = new Map();

    history.forEach((h) => {
      const type = h.context.changeType || 'unknown';
      patterns.set(type, (patterns.get(type) || 0) + 1);
    });

    return Array.from(patterns.entries()).map(([type, count]) => ({
      type,
      probability: count / history.length,
      impact: count > history.length / 2 ? 'high' : 'medium',
    }));
  }

  private generatePredictiveRecommendations(
    profile: EnvironmentProfile,
    expectedChanges: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (expectedChanges.some((c) => c.type === 'structure' && c.probability > 0.5)) {
      recommendations.push('استخدم selectors مرنة وقابلة للتكيف');
      recommendations.push('أضف fallbacks متعددة لكل عنصر');
    }

    if (profile.characteristics.changeFrequency === 'frequent') {
      recommendations.push('فعّل وضع التكيف التلقائي');
      recommendations.push('قلل الاعتماد على selectors محددة');
    }

    return recommendations;
  }
}

// مثيل مشترك
export const adaptiveIntelligence = new AdaptiveIntelligence();
