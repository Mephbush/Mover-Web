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

export interface PatternCluster {
  id: string;
  name: string;
  patterns: Pattern[];
  centroid: any;
  similarity: number;
  commonFeatures: string[];
  representativePattern: Pattern;
}

export interface ClusteringResult {
  clusters: PatternCluster[];
  totalPatterns: number;
  clusteringQuality: number;
  timestamp: Date;
}

/**
 * محرك التعلم الآلي للروبوت
 */
export class LearningEngine {
  private experiences: Experience[] = [];
  private patterns: Map<string, Pattern> = new Map();
  private models: Map<string, LearningModel> = new Map();
  private readonly maxExperiences = 10000;
  private isInitialized = false;

  /**
   * Initialize learning engine and load persisted data
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Initializing LearningEngine with persistence...');

      // Initialize database sync
      await databaseSync.initialize(userId);

      // Load experiences from database
      const loadedExperiences = await databaseSync.loadExperiences(undefined, this.maxExperiences);
      if (loadedExperiences.length > 0) {
        // Convert database format to Experience format
        this.experiences = loadedExperiences.map((exp: any) => ({
          id: exp.experience_id,
          taskType: exp.task_type,
          website: exp.website,
          action: exp.action,
          selector: exp.selector,
          success: exp.success,
          timestamp: new Date(exp.timestamp),
          context: exp.context,
          metadata: {
            executionTime: exp.execution_time,
            retryCount: exp.retry_count,
            confidence: exp.confidence,
          },
        }));

        // Rebuild patterns from loaded experiences
        for (const exp of this.experiences) {
          await this.updatePatterns(exp);
          await this.updateModel(exp.website, exp);
        }

        console.log(`✅ Loaded ${this.experiences.length} experiences from database`);
      }

      this.isInitialized = true;
      console.log('✅ LearningEngine initialized with persistence');
    } catch (error: any) {
      console.warn('⚠️ Failed to initialize with persistence:', error.message);
      // Continue with empty engine
      this.isInitialized = true;
    }
  }

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

  /**
   * تجميع الأنماط المتشابهة
   */
  async clusterPatterns(minSimilarity: number = 0.7): Promise<ClusteringResult> {
    console.log('🔍 Starting pattern clustering...');
    const startTime = Date.now();

    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) {
      return {
        clusters: [],
        totalPatterns: 0,
        clusteringQuality: 0,
        timestamp: new Date(),
      };
    }

    const clusters: PatternCluster[] = [];
    const clusterMap = new Map<string, string>(); // pattern id -> cluster id
    let clusterCounter = 0;

    // خوارزمية التجميع البسيطة (Single-pass clustering)
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];

      // تحقق مما إذا تم تجميع هذا النمط بالفعل
      if (clusterMap.has(pattern.id)) {
        continue;
      }

      // إنشاء مجموعة جديدة
      const clusterId = `cluster_${clusterCounter++}`;
      const cluster: PatternCluster = {
        id: clusterId,
        name: `${pattern.type} - ${pattern.pattern.substring(0, 20)}`,
        patterns: [pattern],
        centroid: this.calculateCentroid([pattern]),
        similarity: 1.0,
        commonFeatures: this.extractFeatures(pattern),
        representativePattern: pattern,
      };

      clusterMap.set(pattern.id, clusterId);

      // ابحث عن أنماط مشابهة
      for (let j = i + 1; j < patterns.length; j++) {
        const otherPattern = patterns[j];

        if (clusterMap.has(otherPattern.id)) {
          continue;
        }

        const similarity = this.calculateSimilarity(pattern, otherPattern);

        if (similarity >= minSimilarity) {
          cluster.patterns.push(otherPattern);
          clusterMap.set(otherPattern.id, clusterId);

          // تحديث الوسيط
          cluster.centroid = this.calculateCentroid(cluster.patterns);

          // تحديث الميزات المشتركة
          cluster.commonFeatures = this.findCommonFeatures(
            cluster.patterns.map(p => this.extractFeatures(p))
          );
        }
      }

      clusters.push(cluster);
    }

    // حساب جودة التجميع
    const clusteringQuality = this.calculateClusteringQuality(clusters, patterns);

    const processingTime = Date.now() - startTime;

    console.log(`✅ Clustering complete: ${clusters.length} clusters formed`);
    console.log(`📊 Quality score: ${clusteringQuality.toFixed(2)}`);
    console.log(`⏱️ Processing time: ${processingTime}ms`);

    return {
      clusters,
      totalPatterns: patterns.length,
      clusteringQuality,
      timestamp: new Date(),
    };
  }

  /**
   * حساب التشابه بين نمطين
   */
  private calculateSimilarity(pattern1: Pattern, pattern2: Pattern): number {
    let similarity = 0;

    // تشابه النوع
    if (pattern1.type === pattern2.type) {
      similarity += 0.3;
    }

    // تشابه النص (Levenshtein distance)
    const textSimilarity = this.levenshteinSimilarity(
      pattern1.pattern,
      pattern2.pattern
    );
    similarity += textSimilarity * 0.4;

    // تشابه معدل النجاح
    const successRateDiff = Math.abs(pattern1.successRate - pattern2.successRate);
    similarity += Math.max(0, 1 - successRateDiff) * 0.2;

    // تشابه السياقات المشتركة
    const commonContexts = pattern1.contexts.filter(c =>
      pattern2.contexts.includes(c)
    ).length;
    const totalContexts = new Set([...pattern1.contexts, ...pattern2.contexts])
      .size;
    const contextSimilarity =
      totalContexts > 0 ? commonContexts / totalContexts : 0;
    similarity += contextSimilarity * 0.1;

    return Math.min(1, similarity);
  }

  /**
   * حساب تشابه Levenshtein بين نصين
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  /**
   * حساب مسافة Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * استخراج الميزات من نمط
   */
  private extractFeatures(pattern: Pattern): string[] {
    const features: string[] = [];

    features.push(`type:${pattern.type}`);

    // استخراج الميزات من النص (كلمات مفتاحية)
    const keywords = pattern.pattern.match(/[a-zA-Z]+/g) || [];
    features.push(...keywords.map(k => `keyword:${k}`));

    // إضافة النطاق الرقمي
    if (pattern.successRate > 0.8) {
      features.push('high_success');
    } else if (pattern.successRate < 0.3) {
      features.push('low_success');
    }

    if (pattern.occurrences > 10) {
      features.push('frequently_used');
    }

    return features;
  }

  /**
   * إيجاد الميزات المشتركة بين مجموعة من الأنماط
   */
  private findCommonFeatures(featuresList: string[][]): string[] {
    if (featuresList.length === 0) {
      return [];
    }

    // عد تكرار كل ميزة
    const featureCount = new Map<string, number>();
    for (const features of featuresList) {
      for (const feature of features) {
        featureCount.set(feature, (featureCount.get(feature) || 0) + 1);
      }
    }

    // أرجع الميزات التي تظهر في أكثر من 50% من الأنماط
    const threshold = featuresList.length / 2;
    return Array.from(featureCount.entries())
      .filter(([, count]) => count >= threshold)
      .map(([feature]) => feature);
  }

  /**
   * حساب الوسيط للمجموعة
   */
  private calculateCentroid(patterns: Pattern[]): any {
    if (patterns.length === 0) {
      return {};
    }

    return {
      avgSuccessRate:
        patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length,
      avgOccurrences:
        patterns.reduce((sum, p) => sum + p.occurrences, 0) / patterns.length,
      avgEffectiveness:
        patterns.reduce((sum, p) => sum + p.effectiveness, 0) / patterns.length,
      types: Array.from(new Set(patterns.map(p => p.type))),
    };
  }

  /**
   * حساب جودة التجميع
   */
  private calculateClusteringQuality(
    clusters: PatternCluster[],
    allPatterns: Pattern[]
  ): number {
    if (clusters.length === 0 || allPatterns.length === 0) {
      return 0;
    }

    let qualityScore = 0;

    // التوازن بين عدد المجموعات وحجم النمط
    const clusterBalance =
      1 - Math.abs(clusters.length - Math.sqrt(allPatterns.length)) / allPatterns.length;
    qualityScore += clusterBalance * 0.3;

    // متوسط التشابه داخل المجموعات
    let intraClusterSimilarity = 0;
    let totalComparisons = 0;

    for (const cluster of clusters) {
      for (let i = 0; i < cluster.patterns.length; i++) {
        for (let j = i + 1; j < cluster.patterns.length; j++) {
          intraClusterSimilarity += this.calculateSimilarity(
            cluster.patterns[i],
            cluster.patterns[j]
          );
          totalComparisons++;
        }
      }
    }

    const avgIntraSimilarity =
      totalComparisons > 0 ? intraClusterSimilarity / totalComparisons : 0;
    qualityScore += avgIntraSimilarity * 0.7;

    return Math.min(1, qualityScore);
  }

  /**
   * الحصول على المجموعات الموصى بها للموقع
   */
  async getRecommendedClusters(
    website: string,
    limit: number = 5
  ): Promise<PatternCluster[]> {
    const websitePatterns = Array.from(this.patterns.values()).filter(p =>
      p.contexts.includes(website)
    );

    if (websitePatterns.length === 0) {
      return [];
    }

    const result = await this.clusterPatterns(0.6);
    return result.clusters.sort((a, b) => {
      // ترتيب حسب الفعالية والاستخدام
      const aScore = a.representativePattern.effectiveness;
      const bScore = b.representativePattern.effectiveness;
      return bScore - aScore;
    }).slice(0, limit);
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
    try {
      // Save experience to Supabase via DatabaseSync
      await databaseSync.saveExperience(experience);
      console.log('💾 Experience saved:', experience.id);
    } catch (error: any) {
      // Fallback to local storage if database sync fails
      console.warn('⚠️ Failed to persist experience to database:', error.message);
      // Keep in memory as fallback
    }
  }

  private async persistModel(model: LearningModel): Promise<void> {
    try {
      // Save model to Supabase via DatabaseSync
      await databaseSync.saveModel({
        id: model.domain,
        website: model.domain,
        type: 'learning_model',
        data: {
          patterns: Array.from(model.patterns),
          strategies: Array.from(model.successfulStrategies.entries()),
          failures: Array.from(model.failurePatterns.entries()),
          optimizations: Array.from(model.optimizations.entries()),
        },
        samples: Array.from(model.successfulStrategies.values()).reduce((a, b) => a + b, 0),
        accuracy: this.calculateModelAccuracy(model),
        active: true,
        metadata: {
          lastUpdated: model.lastUpdated,
        },
      });
      console.log('💾 Model saved:', model.domain);
    } catch (error: any) {
      // Fallback if database sync fails
      console.warn('⚠️ Failed to persist model to database:', error.message);
      // Keep in memory as fallback
    }
  }

  private calculateModelAccuracy(model: LearningModel): number {
    if (model.patterns.length === 0) return 0;

    const avgSuccessRate =
      Array.from(model.patterns).reduce((sum, p) => sum + (p[1]?.successRate || 0), 0) /
      model.patterns.length;

    return Math.min(avgSuccessRate, 1.0);
  }
}

// مثيل مشترك
export const learningEngine = new LearningEngine();
