/**
 * 📚 نظام التعلم الفائق السرعة
 * Ultra-Fast Learning System
 * 
 * يتعلم النظام من كل محاولة ويتحسن تلقائياً
 * مع الاحتفاظ بأفضل الاستراتيجيات للمستقبل
 */

export interface LearningExperience {
  id: string;
  timestamp: number;
  selector: string;
  target: string;
  domain: string;
  success: boolean;
  timeMs: number;
  confidence: number;
  difficulty: string;
  alternativesTried?: string[];
  reason?: string;
  tags?: string[];
}

export interface PatternRecognition {
  pattern: string;
  selectorType: string; // 'id', 'data-testid', 'xpath', etc
  successRate: number;
  averageTime: number;
  domain?: string;
  contexts: string[]; // where this pattern works
  weight: number; // importance in decision making
}

export interface DomainKnowledge {
  domain: string;
  totalAttempts: number;
  successRate: number;
  commonPatterns: PatternRecognition[];
  difficultElements: Map<string, { attempts: number; successRate: number }>;
  averageTime: number;
  lastUpdated: number;
}

/**
 * محرك الذاكرة الذكية
 */
class SmartMemoryEngine {
  private memories: Map<string, LearningExperience[]> = new Map();
  private patterns: Map<string, PatternRecognition> = new Map();
  private domainKnowledge: Map<string, DomainKnowledge> = new Map();
  private readonly MAX_MEMORIES_PER_KEY = 1000;
  private readonly PATTERN_THRESHOLD = 5; // minimum experiences to form pattern

  /**
   * تسجيل تجربة جديدة وتعلم منها فوراً
   */
  recordExperience(experience: LearningExperience): void {
    const key = `${experience.domain}:${experience.target}`;
    
    // حفظ في الذاكرة
    if (!this.memories.has(key)) {
      this.memories.set(key, []);
    }
    
    const memories = this.memories.get(key)!;
    memories.unshift(experience); // الأحدث أولاً
    
    if (memories.length > this.MAX_MEMORIES_PER_KEY) {
      memories.pop();
    }

    // تحديث معرفة المجال
    this.updateDomainKnowledge(experience);

    // البحث عن أنماط جديدة
    this.detectNewPatterns(experience);

    // تحديث الأوزان والأولويات
    this.adjustWeights(experience);
  }

  /**
   * تحديث معرفة المجال
   */
  private updateDomainKnowledge(experience: LearningExperience): void {
    let domain = this.domainKnowledge.get(experience.domain);
    
    if (!domain) {
      domain = {
        domain: experience.domain,
        totalAttempts: 0,
        successRate: 0,
        commonPatterns: [],
        difficultElements: new Map(),
        averageTime: 0,
        lastUpdated: Date.now(),
      };
      this.domainKnowledge.set(experience.domain, domain);
    }

    const oldCount = domain.totalAttempts;
    domain.totalAttempts++;
    
    // تحديث معدل النجاح
    const successes = Math.floor(domain.successRate * oldCount) + (experience.success ? 1 : 0);
    domain.successRate = successes / domain.totalAttempts;

    // تحديث متوسط الوقت
    domain.averageTime = (domain.averageTime * oldCount + experience.timeMs) / domain.totalAttempts;

    // تتبع العناصر الصعبة
    if (!experience.success) {
      const elem = domain.difficultElements.get(experience.target) || { attempts: 0, successRate: 0 };
      elem.attempts++;
      domain.difficultElements.set(experience.target, elem);
    }

    domain.lastUpdated = Date.now();
  }

  /**
   * كشف أنماط جديدة من التجارب
   */
  private detectNewPatterns(experience: LearningExperience): void {
    const key = `${experience.domain}:${experience.target}`;
    const memories = this.memories.get(key) || [];

    if (memories.length >= this.PATTERN_THRESHOLD) {
      const successCount = memories.filter(m => m.success).length;
      const successRate = successCount / memories.length;
      const avgTime = memories.reduce((sum, m) => sum + m.timeMs, 0) / memories.length;

      const pattern: PatternRecognition = {
        pattern: key,
        selectorType: this.detectSelectorType(experience.selector),
        successRate,
        averageTime: avgTime,
        domain: experience.domain,
        contexts: memories.map(m => m.target),
        weight: successRate * 0.7 + (1 - avgTime / 1000) * 0.3, // مزيج من النجاح والسرعة
      };

      this.patterns.set(key, pattern);
    }
  }

  /**
   * تعديل أوزان الاستراتيجيات بناءً على الأداء
   */
  private adjustWeights(experience: LearningExperience): void {
    // إذا كانت التجربة ناجحة وسريعة - زد الوزن
    // إذا كانت فاشلة - قلل الوزن
    const selectorType = this.detectSelectorType(experience.selector);
    const patternKey = `strategy:${selectorType}`;

    let pattern = this.patterns.get(patternKey);
    if (!pattern) {
      pattern = {
        pattern: patternKey,
        selectorType,
        successRate: experience.success ? 1 : 0,
        averageTime: experience.timeMs,
        weight: experience.success ? 0.8 : 0.2,
        contexts: [],
      };
    } else {
      // تحديث متدرج
      pattern.weight = pattern.weight * 0.9 + (experience.success ? 0.8 : 0.2) * 0.1;
    }

    this.patterns.set(patternKey, pattern);
  }

  /**
   * الحصول على أفضل الاستراتيجيات للهدف
   */
  getBestStrategies(domain: string, target: string): string[] {
    const key = `${domain}:${target}`;
    const memories = this.memories.get(key) || [];

    // ترتيب حسب النجاح والسرعة
    return memories
      .filter(m => m.success)
      .sort((a, b) => {
        const scoreA = (a.confidence * 0.7) + ((1000 - a.timeMs) / 1000 * 0.3);
        const scoreB = (b.confidence * 0.7) + ((1000 - b.timeMs) / 1000 * 0.3);
        return scoreB - scoreA;
      })
      .map(m => m.selector)
      .slice(0, 5);
  }

  /**
   * الحصول على معرفة المجال
   */
  getDomainKnowledge(domain: string): DomainKnowledge | undefined {
    return this.domainKnowledge.get(domain);
  }

  /**
   * الحصول على الأنماط الناجحة
   */
  getSuccessfulPatterns(): PatternRecognition[] {
    return Array.from(this.patterns.values())
      .filter(p => p.successRate > 0.8)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);
  }

  private detectSelectorType(selector: string): string {
    if (selector.startsWith('#')) return 'id';
    if (selector.includes('[data-testid')) return 'data-testid';
    if (selector.includes('/')) return 'xpath';
    if (selector.includes('[aria')) return 'aria';
    if (selector.includes('::')) return 'pseudo';
    return 'css';
  }

  getStats() {
    return {
      totalMemories: this.memories.size,
      totalPatterns: this.patterns.size,
      totalDomains: this.domainKnowledge.size,
      topDomains: Array.from(this.domainKnowledge.values())
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5)
        .map(d => ({
          domain: d.domain,
          successRate: d.successRate,
          attempts: d.totalAttempts,
          avgTime: Math.round(d.averageTime),
        })),
    };
  }
}

/**
 * محرك التنبؤ الذكي
 */
class PredictionEngine {
  private memoryEngine: SmartMemoryEngine;
  private readonly MIN_CONFIDENCE = 0.6;

  constructor(memoryEngine: SmartMemoryEngine) {
    this.memoryEngine = memoryEngine;
  }

  /**
   * التنبؤ بنجاح محدد معين
   */
  predictSuccess(selector: string, domain: string, target: string): number {
    // البحث في الأنماط الناجحة
    const patterns = this.memoryEngine.getSuccessfulPatterns();
    const selectorType = this.detectSelectorType(selector);

    let baseScore = 0.5; // قاعدة النقاط

    // البحث عن أنماط مشابهة
    const matchingPatterns = patterns.filter(p => p.selectorType === selectorType);
    if (matchingPatterns.length > 0) {
      const avgSuccessRate = matchingPatterns.reduce((sum, p) => sum + p.successRate, 0) / matchingPatterns.length;
      baseScore = Math.max(baseScore, avgSuccessRate * 0.9);
    }

    // معرفة المجال
    const domainKnowledge = this.memoryEngine.getDomainKnowledge(domain);
    if (domainKnowledge && domainKnowledge.commonPatterns.length > 0) {
      const avgScore = domainKnowledge.commonPatterns.reduce((sum, p) => sum + p.weight, 0) / domainKnowledge.commonPatterns.length;
      baseScore = baseScore * 0.6 + avgScore * 0.4;
    }

    // عاقبة إذا كان العنصر صعباً
    if (domainKnowledge?.difficultElements.has(target)) {
      const difficult = domainKnowledge.difficultElements.get(target)!;
      const difficultyPenalty = 1 - (difficult.successRate * 0.5);
      baseScore *= difficultyPenalty;
    }

    return Math.min(1, Math.max(0, baseScore));
  }

  /**
   * التنبؤ بأسرع طريقة للعثور
   */
  predictFastestMethod(domain: string): string {
    const domainKnowledge = this.memoryEngine.getDomainKnowledge(domain);
    if (!domainKnowledge) return 'standard';

    const patterns = domainKnowledge.commonPatterns;
    if (patterns.length === 0) return 'standard';

    // ابحث عن الأسرع
    const fastest = patterns.reduce((best, current) => {
      if (current.averageTime < best.averageTime) return current;
      return best;
    });

    return fastest.selectorType || 'standard';
  }

  private detectSelectorType(selector: string): string {
    if (selector.startsWith('#')) return 'id';
    if (selector.includes('[data-testid')) return 'data-testid';
    if (selector.includes('/')) return 'xpath';
    return 'css';
  }
}

/**
 * 📚 نظام التعلم الفائق السرعة الرئيسي
 */
export class UltraFastLearningSystem {
  private memoryEngine: SmartMemoryEngine;
  private predictionEngine: PredictionEngine;

  constructor() {
    this.memoryEngine = new SmartMemoryEngine();
    this.predictionEngine = new PredictionEngine(this.memoryEngine);
  }

  /**
   * التعلم من تجربة جديدة
   */
  learn(experience: LearningExperience): void {
    console.log(`📚 التعلم من تجربة جديدة...`);
    console.log(`   الهدف: ${experience.target}`);
    console.log(`   المجال: ${experience.domain}`);
    console.log(`   النتيجة: ${experience.success ? '✅ نجح' : '❌ فشل'}`);
    console.log(`   الوقت: ${experience.timeMs}ms`);
    console.log(`   الثقة: ${(experience.confidence * 100).toFixed(1)}%`);

    this.memoryEngine.recordExperience(experience);
  }

  /**
   * الحصول على أفضل الاستراتيجيات المتعلمة
   */
  getBestLearned(domain: string, target: string): {
    strategies: string[];
    predictedSuccess: number;
    reasoning: string[];
  } {
    const strategies = this.memoryEngine.getBestStrategies(domain, target);
    const reasoning: string[] = [];

    if (strategies.length === 0) {
      reasoning.push('لم يتم العثور على تجارب سابقة لهذا الهدف');
      return { strategies: [], predictedSuccess: 0, reasoning };
    }

    const predictedSuccess = this.predictionEngine.predictSuccess(strategies[0], domain, target);
    reasoning.push(`أفضل استراتيجية متعلمة: ${strategies[0]}`);
    reasoning.push(`احتمالية النجاح المتنبأ بها: ${(predictedSuccess * 100).toFixed(1)}%`);
    reasoning.push(`عدد التجارب السابقة: ${strategies.length}`);

    return { strategies, predictedSuccess, reasoning };
  }

  /**
   * الحصول على إحصائيات التعلم
   */
  getStats() {
    return this.memoryEngine.getStats();
  }

  /**
   * توصيات لتحسين الأداء
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.memoryEngine.getStats();
    const recommendations: string[] = [];

    if (stats.topDomains.length === 0) {
      recommendations.push('ابدأ بأداء المزيد من المحاولات لبناء المعرفة');
      return recommendations;
    }

    const topDomain = stats.topDomains[0];
    
    if (topDomain.successRate < 0.7) {
      recommendations.push(`تحسين الاستراتيجيات للمجال "${topDomain.domain}" - معدل النجاح ${(topDomain.successRate * 100).toFixed(1)}%`);
    }

    if (topDomain.avgTime > 500) {
      recommendations.push(`تحسين السرعة للمجال "${topDomain.domain}" - متوسط الوقت ${topDomain.avgTime}ms`);
    }

    // توصيات عامة
    if (stats.topDomains.length === 1) {
      recommendations.push('اختبر مجالات أخرى لبناء معرفة أوسع');
    }

    recommendations.push(`استخدم الأنماط الناجحة: ${stats.totalPatterns > 0 ? 'موجودة' : 'بناء الأنماط'}`);

    return recommendations;
  }
}

// Export singleton
export const ultraFastLearning = new UltraFastLearningSystem();
