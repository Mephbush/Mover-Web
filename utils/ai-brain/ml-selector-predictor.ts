/**
 * نظام التنبؤ الذكي بالمحددات باستخدام التعلم الآلي
 * ML-Based Selector Prediction System - Using Neural Networks & Clustering
 * 
 * يتضمن:
 * 1. شبكة عصبية بسيطة للتنبؤ بنجاح المحددات
 * 2. تجميع الأنماط المتشابهة
 * 3. توصيات ديناميكية بناءً على السياق
 * 4. تحسين مستمر مع كل تجربة
 */

export interface SelectorContext {
  domain: string;
  elementType: string;
  elementText?: string;
  pageStructure?: string;
  previousAttempts?: string[];
}

export interface SelectorPrediction {
  selector: string;
  successProbability: number; // 0-1
  confidence: number; // 0-1
  reasoning: string[];
  rank: number;
  features: {
    specificity: number;
    stability: number;
    reliability: number;
    coverage: number;
  };
}

export interface MLModel {
  weights: Map<string, number>;
  biases: Map<string, number>;
  activations: string[];
  trainingSamples: number;
  accuracy: number;
}

/**
 * نموذج عصبي بسيط للتنبؤ بنجاح المحددات
 */
class SimpleNeuralNetwork {
  private weights: Map<string, number> = new Map();
  private biases: Map<string, number> = new Map();
  private learningRate = 0.01;
  private layers = ['input', 'hidden1', 'hidden2', 'output'];

  constructor() {
    this.initializeWeights();
  }

  /**
   * تهيئة الأوزان العشوائية
   */
  private initializeWeights(): void {
    const features = ['specificity', 'stability', 'reliability', 'coverage', 'historical'];

    for (const feature of features) {
      this.weights.set(feature, Math.random() * 0.5);
      this.biases.set(feature, Math.random() * 0.1);
    }
  }

  /**
   * دالة التفعيل (ReLU)
   */
  private relu(x: number): number {
    return Math.max(0, x);
  }

  /**
   * دالة السيجمويد (للإخراج الاحتمالي)
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.min(x, 500)));
  }

  /**
   * التنبؤ بنجاح محدد معين
   */
  predict(features: { [key: string]: number }): number {
    let score = 0;

    // الطبقة الأولى
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.weights.get(feature) || 0.5;
      const bias = this.biases.get(feature) || 0.05;
      score += value * weight + bias;
    }

    // التفعيل
    score = this.relu(score);

    // تطبيع النتيجة بين 0 و 1
    return this.sigmoid(score / 10);
  }

  /**
   * تدريب الشبكة على بيانات جديدة
   */
  train(features: { [key: string]: number }, expectedOutput: number): void {
    const prediction = this.predict(features);
    const error = expectedOutput - prediction;

    // تحديث الأوزان
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.weights.get(feature) || 0.5;
      const newWeight = weight + this.learningRate * error * value;
      this.weights.set(feature, newWeight);
    }
  }

  /**
   * الحصول على الأوزان
   */
  getWeights(): Map<string, number> {
    return new Map(this.weights);
  }
}

/**
 * نظام التجميع (Clustering) لتجميع الأنماط المتشابهة
 */
class PatternClusterer {
  private clusters: Map<string, any[]> = new Map();
  private centroids: Map<string, any> = new Map();

  /**
   * تجميع الأنماط باستخدام K-means
   */
  clusterPatterns(patterns: any[], k: number = 5): Map<string, any[]> {
    if (patterns.length === 0) return new Map();

    // اختيار نقاط مركزية أولية عشوائية
    const initialCentroids = this.selectRandomCentroids(patterns, k);
    let centroids = initialCentroids;
    let converged = false;
    let iterations = 0;
    const maxIterations = 50;

    while (!converged && iterations < maxIterations) {
      // تعيين الأنماط للمجموعات
      const newClusters = new Map<string, any[]>();
      for (let i = 0; i < k; i++) {
        newClusters.set(`cluster_${i}`, []);
      }

      for (const pattern of patterns) {
        const closestCluster = this.findClosestCluster(pattern, centroids);
        const clusterPatterns = newClusters.get(closestCluster.id) || [];
        clusterPatterns.push(pattern);
        newClusters.set(closestCluster.id, clusterPatterns);
      }

      // حساب النقاط المركزية الجديدة
      const newCentroids = this.calculateCentroids(newClusters);

      // التحقق من التقارب
      converged = this.isClustersConverged(centroids, newCentroids);
      centroids = newCentroids;
      iterations++;
    }

    this.clusters = this.assignPatternsToClusters(patterns, centroids);
    this.centroids = centroids;
    return this.clusters;
  }

  /**
   * اختيار نقاط مركزية عشوائية
   */
  private selectRandomCentroids(patterns: any[], k: number): Map<string, any> {
    const centroids = new Map<string, any>();
    const shuffled = [...patterns].sort(() => Math.random() - 0.5);

    for (let i = 0; i < k && i < shuffled.length; i++) {
      centroids.set(`centroid_${i}`, shuffled[i]);
    }

    return centroids;
  }

  /**
   * إيجاد أقرب مجموعة لنمط معين
   */
  private findClosestCluster(
    pattern: any,
    centroids: Map<string, any>
  ): { id: string; distance: number } {
    let closestCluster = { id: '', distance: Infinity };

    for (const [id, centroid] of centroids.entries()) {
      const distance = this.calculateDistance(pattern, centroid);
      if (distance < closestCluster.distance) {
        closestCluster = { id, distance };
      }
    }

    return closestCluster;
  }

  /**
   * حساب المسافة بين نقطتين
   */
  private calculateDistance(p1: any, p2: any): number {
    // استخدام المسافة الإقليدية
    let distance = 0;
    const keys = Object.keys(p1);

    for (const key of keys) {
      if (typeof p1[key] === 'number' && typeof p2[key] === 'number') {
        distance += Math.pow(p1[key] - p2[key], 2);
      }
    }

    return Math.sqrt(distance);
  }

  /**
   * حساب النقاط المركزية الجديدة
   */
  private calculateCentroids(clusters: Map<string, any[]>): Map<string, any> {
    const newCentroids = new Map<string, any>();

    for (const [clusterId, patterns] of clusters.entries()) {
      if (patterns.length === 0) continue;

      const centroid: any = {};
      const keys = Object.keys(patterns[0]);

      for (const key of keys) {
        if (typeof patterns[0][key] === 'number') {
          const sum = patterns.reduce((acc, p) => acc + (p[key] || 0), 0);
          centroid[key] = sum / patterns.length;
        }
      }

      newCentroids.set(clusterId, centroid);
    }

    return newCentroids;
  }

  /**
   * التحقق من تقارب المجموعات
   */
  private isClustersConverged(oldCentroids: Map<string, any>, newCentroids: Map<string, any>): boolean {
    let totalDistance = 0;

    for (const [id, oldCentroid] of oldCentroids.entries()) {
      const newCentroid = newCentroids.get(id);
      if (!newCentroid) continue;

      totalDistance += this.calculateDistance(oldCentroid, newCentroid);
    }

    return totalDistance < 0.01; // عتبة التقارب
  }

  /**
   * تعيين الأنماط للمجموعات
   */
  private assignPatternsToClusters(patterns: any[], centroids: Map<string, any>): Map<string, any[]> {
    const clusters = new Map<string, any[]>();

    for (const [clusterId, _] of centroids.entries()) {
      clusters.set(clusterId, []);
    }

    for (const pattern of patterns) {
      const closest = this.findClosestCluster(pattern, centroids);
      const clusterPatterns = clusters.get(closest.id) || [];
      clusterPatterns.push(pattern);
      clusters.set(closest.id, clusterPatterns);
    }

    return clusters;
  }

  /**
   * الحصول على المجموعات
   */
  getClusters(): Map<string, any[]> {
    return this.clusters;
  }

  /**
   * الحصول على النقاط المركزية
   */
  getCentroids(): Map<string, any> {
    return this.centroids;
  }
}

/**
 * نظام التنبؤ الذكي بالمحددات
 */
export class MLSelectorPredictor {
  private neuralNetwork: SimpleNeuralNetwork;
  private clusterer: PatternClusterer;
  private trainingData: Array<{ context: SelectorContext; selector: string; success: boolean }> = [];
  private selectorFeatures: Map<string, any> = new Map();
  private domainPatterns: Map<string, string[]> = new Map();

  constructor() {
    this.neuralNetwork = new SimpleNeuralNetwork();
    this.clusterer = new PatternClusterer();
    this.initializeDomainPatterns();
  }

  /**
   * تهيئة الأنماط المعروفة للمجالات
   */
  private initializeDomainPatterns(): void {
    // أنماط معروفة لمواقع معروفة
    this.domainPatterns.set('google.com', [
      '#searchboxinput',
      '[name="q"]',
      'input[aria-label*="Search"]',
      '[role="combobox"]',
    ]);

    this.domainPatterns.set('github.com', [
      '[placeholder="Search GitHub"]',
      '[name="query-builder-test"]',
      'input[aria-label="Search GitHub"]',
      '[data-testid="query-builder-input"]',
    ]);

    this.domainPatterns.set('amazon.com', [
      '#twotabsearchtextbox',
      '[name="field-keywords"]',
      'input[placeholder="Search Amazon"]',
      '[aria-label="Search Amazon"]',
    ]);
  }

  /**
   * التنبؤ بأفضل المحددات
   */
  predictBestSelectors(context: SelectorContext, availableSelectors: string[]): SelectorPrediction[] {
    const predictions: SelectorPrediction[] = [];

    for (const selector of availableSelectors) {
      const prediction = this.predictSelector(context, selector);
      predictions.push(prediction);
    }

    // ترتيب التنبؤات بناءً على احتمالية النجاح
    predictions.sort((a, b) => b.successProbability - a.successProbability);

    // إضافة الترتيب
    predictions.forEach((p, i) => {
      p.rank = i + 1;
    });

    return predictions;
  }

  /**
   * التنبؤ بنجاح محدد واحد
   */
  private predictSelector(context: SelectorContext, selector: string): SelectorPrediction {
    const features = this.extractFeatures(context, selector);
    const successProbability = this.neuralNetwork.predict(features);
    const confidence = this.calculateConfidence(context, selector);

    const reasoning = this.generateReasoning(context, selector, features, successProbability);

    return {
      selector,
      successProbability,
      confidence,
      reasoning,
      rank: 0,
      features: {
        specificity: features.specificity,
        stability: features.stability,
        reliability: features.reliability,
        coverage: features.coverage,
      },
    };
  }

  /**
   * استخراج المميزات من المحدد والسياق
   */
  private extractFeatures(context: SelectorContext, selector: string): { [key: string]: number } {
    return {
      // 1. الخصوصية (Specificity)
      specificity: this.calculateSpecificity(selector),

      // 2. الاستقرار (Stability)
      stability: this.calculateStability(selector, context),

      // 3. الموثوقية (Reliability)
      reliability: this.calculateReliability(selector, context),

      // 4. التغطية (Coverage)
      coverage: this.calculateCoverage(selector, context),

      // 5. التاريخ (Historical Success)
      historical: this.calculateHistoricalSuccess(selector),
    };
  }

  /**
   * حساب الخصوصية (كم محددة هي العبارة)
   */
  private calculateSpecificity(selector: string): number {
    let score = 0;

    // المعرف الفريد: أعلى خصوصية
    if (selector.startsWith('#')) score = 1.0;
    // البيانات والسمات: عالية الخصوصية
    else if (selector.includes('[data-') || selector.includes('[aria-')) score = 0.9;
    // النوع + السمة: متوسطة الخصوصية
    else if (selector.match(/^\w+\[/)) score = 0.7;
    // الفئة: منخفضة الخصوصية
    else if (selector.includes('.')) score = 0.5;
    // العام: الأقل خصوصية
    else score = 0.3;

    return score;
  }

  /**
   * حساب الاستقرار (كم مستقر المحدد عبر الزمن)
   */
  private calculateStability(selector: string, context: SelectorContext): number {
    // البحث في بيانات التدريب
    const relevantData = this.trainingData.filter(
      d => d.selector === selector && d.context.domain === context.domain
    );

    if (relevantData.length === 0) return 0.5; // افتراضي إذا لم يكن هناك بيانات

    // حساب التقلب
    const successCount = relevantData.filter(d => d.success).length;
    const failureCount = relevantData.length - successCount;
    const ratio = Math.min(successCount, failureCount) / relevantData.length;

    // كلما قل التقلب، زاد الاستقرار
    return 1 - ratio;
  }

  /**
   * حساب الموثوقية (معدل النجاح التاريخي)
   */
  private calculateReliability(selector: string, context: SelectorContext): number {
    const relevantData = this.trainingData.filter(
      d => d.selector === selector && d.context.domain === context.domain
    );

    if (relevantData.length === 0) return 0.5;

    const successCount = relevantData.filter(d => d.success).length;
    return successCount / relevantData.length;
  }

  /**
   * حساب التغطية (كم عدد الحالات التي يعمل فيها المحدد)
   */
  private calculateCoverage(selector: string, context: SelectorContext): number {
    // بناءً على عدد استخدامات المحدد
    const usageCount = this.trainingData.filter(d => d.selector === selector).length;
    const maxUsagePerSelector = 1000;
    const coverage = Math.min(usageCount / maxUsagePerSelector, 1.0);

    return coverage;
  }

  /**
   * حساب النجاح التاريخي
   */
  private calculateHistoricalSuccess(selector: string): number {
    const allData = this.trainingData.filter(d => d.selector === selector);

    if (allData.length === 0) return 0.5;

    const successCount = allData.filter(d => d.success).length;
    return successCount / allData.length;
  }

  /**
   * حساب درجة الثقة
   */
  private calculateConfidence(context: SelectorContext, selector: string): number {
    // الثقة بناءً على عدد بيانات التدريب
    const trainingCount = this.trainingData.filter(d => d.selector === selector).length;
    const dataConfidence = Math.min(trainingCount / 100, 1.0);

    // الثقة بناءً على توافق السياق
    const contextConfidence = this.calculateContextMatch(context, selector);

    return (dataConfidence + contextConfidence) / 2;
  }

  /**
   * حساب توافق السياق
   */
  private calculateContextMatch(context: SelectorContext, selector: string): number {
    let score = 0.5; // افتراضي

    // التحقق من الأنماط المعروفة
    const knownPatterns = this.domainPatterns.get(context.domain);
    if (knownPatterns && knownPatterns.includes(selector)) {
      score += 0.3;
    }

    // التحقق من توافق نوع العنصر
    if (context.elementType === 'button' && selector.includes('button')) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * توليد التوضيحات
   */
  private generateReasoning(
    context: SelectorContext,
    selector: string,
    features: { [key: string]: number },
    probability: number
  ): string[] {
    const reasoning: string[] = [];

    // إذا كانت الخصوصية عالية
    if (features.specificity > 0.8) {
      reasoning.push('✅ محدد عالي الخصوصية');
    }

    // إذا كان الاستقرار عالي
    if (features.stability > 0.8) {
      reasoning.push('✅ محدد مستقر عبر الزمن');
    }

    // إذا كانت الموثوقية عالية
    if (features.reliability > 0.85) {
      reasoning.push('✅ معدل نجاح عالي تاريخياً');
    }

    // إذا كانت احتمالية النجاح عالية
    if (probability > 0.85) {
      reasoning.push('✅ احتمالية نجاح عالية جداً');
    } else if (probability < 0.5) {
      reasoning.push('⚠️ احتمالية نجاح منخفضة');
    }

    // إذا كان المحدد مطابقاً لمحدد معروف
    const knownPatterns = this.domainPatterns.get(context.domain);
    if (knownPatterns && knownPatterns.includes(selector)) {
      reasoning.push('✅ محدد معروف ومختبر على هذا المجال');
    }

    if (reasoning.length === 0) {
      reasoning.push('📊 بيانات محدودة، لكن التنبؤ معقول');
    }

    return reasoning;
  }

  /**
   * تدريب النموذج على بيانات جديدة
   */
  trainOnData(context: SelectorContext, selector: string, success: boolean): void {
    // إضافة البيانات لسجل التدريب
    this.trainingData.push({ context, selector, success });

    // استخراج المميزات
    const features = this.extractFeatures(context, selector);

    // تدريب الشبكة العصبية
    const target = success ? 1 : 0;
    this.neuralNetwork.train(features, target);

    // إضافة البيانات لقائمة المميزات
    const key = `${context.domain}_${selector}`;
    this.selectorFeatures.set(key, features);
  }

  /**
   * تجميع الأنماط المتشابهة
   */
  clusterSelectors(): Map<string, string[]> {
    const selectors = Array.from(new Set(this.trainingData.map(d => d.selector)));
    const featureArrays = selectors.map(selector => ({
      selector,
      specificity: this.calculateSpecificity(selector),
      stability: this.calculateStability(selector, { domain: 'generic', elementType: 'generic' }),
      reliability: this.calculateReliability(selector, { domain: 'generic', elementType: 'generic' }),
      coverage: this.calculateCoverage(selector, { domain: 'generic', elementType: 'generic' }),
    }));

    const clusters = this.clusterer.clusterPatterns(featureArrays, 5);
    const result = new Map<string, string[]>();

    for (const [clusterId, clusterData] of clusters.entries()) {
      const selectorList = clusterData.map((d: any) => d.selector);
      result.set(clusterId, selectorList);
    }

    return result;
  }

  /**
   * الحصول على إحصائيات النموذج
   */
  getModelStats(): { trainingDataCount: number; accuracy: number; weights: { [key: string]: number } } {
    const weights: { [key: string]: number } = {};
    const networkWeights = this.neuralNetwork.getWeights();

    for (const [key, value] of networkWeights.entries()) {
      weights[key] = value;
    }

    // حساب الدقة
    let correctPredictions = 0;
    for (const data of this.trainingData) {
      const features = this.extractFeatures(data.context, data.selector);
      const prediction = this.neuralNetwork.predict(features);
      const predicted = prediction > 0.5;
      const actual = data.success;

      if (predicted === actual) {
        correctPredictions++;
      }
    }

    const accuracy =
      this.trainingData.length > 0 ? (correctPredictions / this.trainingData.length) * 100 : 0;

    return {
      trainingDataCount: this.trainingData.length,
      accuracy,
      weights,
    };
  }
}

/**
 * دالة مساعدة لإنشاء نموذج التنبؤ
 */
export function createMLSelectorPredictor(): MLSelectorPredictor {
  return new MLSelectorPredictor();
}
