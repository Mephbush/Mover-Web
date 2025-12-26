/**
 * 🧠 نظام عقل الروبوت الموحد المتقدم
 * Integrated Supreme Brain System
 * 
 * يجمع كل القوى معاً:
 * - البحث الفائق السرعة
 * - التعلم المستمر
 * - الذكاء العميق
 * - اتخاذ القرارات السريعة
 */

import { SupremeRobotBrain } from './supreme-robot-brain';
import { UltraFastLearningSystem, LearningExperience } from './ultra-fast-learning';

export interface RobotBrainConfig {
  enableLearning?: boolean;
  enableCaching?: boolean;
  enablePrediction?: boolean;
  maxConcurrentSearches?: number;
  searchTimeout?: number;
  verboseLogging?: boolean;
}

export interface BrainAction {
  id: string;
  type: 'click' | 'fill' | 'extract' | 'wait' | 'navigate';
  target: string;
  value?: string;
  domain?: string;
  priority?: number;
}

export interface BrainActionResult {
  actionId: string;
  success: boolean;
  data?: any;
  selector?: string;
  timeMs: number;
  confidence: number;
  error?: string;
  learned?: boolean;
}

export interface BrainHealthStatus {
  isHealthy: boolean;
  successRate: number;
  averageResponseTime: number;
  knowledgeSize: number;
  lastAction?: Date;
  issues?: string[];
}

/**
 * مدير تسلسل الإجراءات الذكي
 */
class SmartActionOrchestrator {
  private queue: BrainAction[] = [];
  private executing = false;
  private supremeBrain: SupremeRobotBrain;
  private learningSystem: UltraFastLearningSystem;
  private config: RobotBrainConfig;

  constructor(
    supremeBrain: SupremeRobotBrain,
    learningSystem: UltraFastLearningSystem,
    config: RobotBrainConfig
  ) {
    this.supremeBrain = supremeBrain;
    this.learningSystem = learningSystem;
    this.config = config;
  }

  /**
   * إضافة إجراء إلى الطابور
   */
  addAction(action: BrainAction): void {
    this.queue.push(action);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * تنفيذ الإجراء التالي
   */
  async executeNext(page: any): Promise<BrainActionResult | null> {
    if (this.queue.length === 0 || this.executing) return null;

    this.executing = true;
    const action = this.queue.shift();
    
    if (!action) {
      this.executing = false;
      return null;
    }

    const startTime = Date.now();
    
    try {
      const result = await this.executeAction(page, action);
      
      // التعلم من النتيجة
      if (this.config.enableLearning && result.selector) {
        const experience: LearningExperience = {
          id: action.id,
          timestamp: Date.now(),
          selector: result.selector,
          target: action.target,
          domain: action.domain || 'unknown',
          success: result.success,
          timeMs: Date.now() - startTime,
          confidence: result.confidence,
          difficulty: this.estimateDifficulty(result.timeMs),
          reason: result.error,
        };
        
        this.learningSystem.learn(experience);
      }

      this.executing = false;
      return result;
    } catch (error: any) {
      this.executing = false;
      return {
        actionId: action.id,
        success: false,
        timeMs: Date.now() - startTime,
        confidence: 0,
        error: error.message,
      };
    }
  }

  private async executeAction(page: any, action: BrainAction): Promise<BrainActionResult> {
    const startTime = Date.now();

    // الحصول على أفضل الاستراتيجيات المتعلمة
    let prioritySelectors: string[] = [];
    if (this.config.enableLearning) {
      const learned = this.learningSystem.getBestLearned(action.domain || 'default', action.target);
      prioritySelectors = learned.strategies;
    }

    // تنفيذ الإجراء باستخدام عقل الروبوت الفائق
    const result = await this.supremeBrain.findAndInteract(page, action.target, action.type as any);

    return {
      actionId: action.id,
      success: result.success,
      selector: result.selector,
      timeMs: Date.now() - startTime,
      confidence: result.confidence,
      error: result.success ? undefined : 'العنصر غير متاح',
      learned: prioritySelectors.length > 0,
    };
  }

  private estimateDifficulty(timeMs: number): string {
    if (timeMs < 100) return 'easy';
    if (timeMs < 500) return 'medium';
    if (timeMs < 1000) return 'hard';
    return 'extreme';
  }
}

/**
 * نظام مراقبة صحة العقل
 */
class BrainHealthMonitor {
  private stats = {
    totalActions: 0,
    successCount: 0,
    totalTime: 0,
    errors: [] as string[],
  };

  recordAction(success: boolean, timeMs: number, error?: string): void {
    this.stats.totalActions++;
    if (success) this.stats.successCount++;
    this.stats.totalTime += timeMs;
    if (error) this.stats.errors.push(error);
  }

  getStatus(): BrainHealthStatus {
    const successRate = this.stats.totalActions > 0 
      ? this.stats.successCount / this.stats.totalActions 
      : 0;
    const avgTime = this.stats.totalActions > 0 
      ? this.stats.totalTime / this.stats.totalActions 
      : 0;

    const issues: string[] = [];
    if (successRate < 0.7) issues.push('معدل النجاح منخفض');
    if (avgTime > 1000) issues.push('الاستجابة بطيئة');
    if (this.stats.errors.length > 10) issues.push('عدد الأخطاء مرتفع');

    return {
      isHealthy: issues.length === 0,
      successRate,
      averageResponseTime: Math.round(avgTime),
      knowledgeSize: 0,
      issues,
    };
  }

  reset(): void {
    this.stats = {
      totalActions: 0,
      successCount: 0,
      totalTime: 0,
      errors: [],
    };
  }
}

/**
 * 🧠 نظام عقل الروبوت الموحد الرئيسي
 */
export class IntegratedSupremeBrain {
  private supremeBrain: SupremeRobotBrain;
  private learningSystem: UltraFastLearningSystem;
  private orchestrator: SmartActionOrchestrator;
  private healthMonitor: BrainHealthMonitor;
  private config: RobotBrainConfig;
  private page: any = null;

  constructor(config: RobotBrainConfig = {}) {
    this.config = {
      enableLearning: true,
      enableCaching: true,
      enablePrediction: true,
      maxConcurrentSearches: 8,
      searchTimeout: 5000,
      verboseLogging: true,
      ...config,
    };

    this.supremeBrain = new SupremeRobotBrain();
    this.learningSystem = new UltraFastLearningSystem();
    this.orchestrator = new SmartActionOrchestrator(
      this.supremeBrain,
      this.learningSystem,
      this.config
    );
    this.healthMonitor = new BrainHealthMonitor();
  }

  /**
   * تهيئة عقل الروبوت
   */
  async initialize(page: any): Promise<void> {
    this.page = page;
    console.log('\n🧠 تهيئة عقل الروبوت الفائق...');
    console.log('   ✅ نظام البحث السريع');
    console.log('   ✅ نظام التعلم الفائق');
    console.log('   ✅ نظام اتخاذ القرارات');
    console.log('   ✅ نظام المراقبة');
    console.log('   العقل جاهز للعمل! 🚀\n');
  }

  /**
   * تنفيذ إجراء ذكي
   */
  async execute(action: BrainAction): Promise<BrainActionResult> {
    if (!this.page) {
      throw new Error('العقل لم يتم تهيئته. استدعِ initialize أولاً');
    }

    this.orchestrator.addAction(action);
    const result = await this.orchestrator.executeNext(this.page);

    if (result) {
      this.healthMonitor.recordAction(result.success, result.timeMs, result.error);
    }

    return result || {
      actionId: action.id,
      success: false,
      timeMs: 0,
      confidence: 0,
      error: 'فشل تنفيذ الإجراء',
    };
  }

  /**
   * البحث الذكي عن عنصر
   */
  async findElement(
    description: string,
    domain?: string
  ): Promise<{
    found: boolean;
    selector?: string;
    confidence: number;
    timeMs: number;
    reasoning: string[];
  }> {
    if (!this.page) {
      throw new Error('العقل لم يتم تهيئته');
    }

    const startTime = Date.now();

    // الحصول على أفضل الاستراتيجيات المتعلمة
    let suggestions: string[] = [];
    if (this.config.enableLearning && domain) {
      const learned = this.learningSystem.getBestLearned(domain, description);
      suggestions = learned.strategies;
    }

    // البحث باستخدام عقل الروبوت الفائق
    const result = await this.supremeBrain.findAndInteract(this.page, description, 'extract');

    this.healthMonitor.recordAction(result.success, Date.now() - startTime, 
      result.success ? undefined : 'لم يتم العثور على العنصر');

    return {
      found: result.success,
      selector: result.selector,
      confidence: result.confidence,
      timeMs: Date.now() - startTime,
      reasoning: [
        ...result.reasoning,
        suggestions.length > 0 ? `اقتراحات متعلمة: ${suggestions.slice(0, 2).join(', ')}` : 'لا توجد تجارب سابقة',
      ],
    };
  }

  /**
   * الحصول على حالة صحة العقل
   */
  getHealth(): BrainHealthStatus {
    return this.healthMonitor.getStatus();
  }

  /**
   * الحصول على إحصائيات التعلم
   */
  getLearningStats() {
    return this.learningSystem.getStats();
  }

  /**
   * توصيات لتحسين الأداء
   */
  getOptimizations(): string[] {
    return this.learningSystem.getOptimizationRecommendations();
  }

  /**
   * تقرير شامل عن صحة النظام
   */
  getComprehensiveReport() {
    const health = this.getHealth();
    const learning = this.getLearningStats();
    const optimizations = this.getOptimizations();

    return {
      timestamp: new Date().toISOString(),
      health,
      learning,
      recommendations: optimizations,
      summary: {
        isOperational: health.isHealthy,
        successRate: `${(health.successRate * 100).toFixed(1)}%`,
        avgResponseTime: `${health.averageResponseTime}ms`,
        knowledgeSize: `${learning.totalMemories} ذكريات`,
        patterns: `${learning.totalPatterns} نمط`,
        domains: `${learning.totalDomains} مجال`,
      },
    };
  }

  /**
   * إعادة تعيين العقل
   */
  reset(): void {
    console.log('🔄 إعادة تعيين عقل الروبوت...');
    this.healthMonitor.reset();
  }
}

// تصدير الحالة الموحدة
export const integratedBrain = new IntegratedSupremeBrain({
  enableLearning: true,
  enableCaching: true,
  verboseLogging: true,
});
