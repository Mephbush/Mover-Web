/**
 * العقل الرئيسي للروبوت - يدمج جميع أنظمة الذكاء الاصطناعي
 * Master AI Brain - Integrates all AI systems
 */

import { aiDecisionEngine, PageContext, DecisionResult } from '../ai-decision-engine';
import { learningEngine, Experience } from './learning-engine';
import { strategicPlanner, Goal, Plan } from './strategic-planner';
import { adaptiveIntelligence, AdaptationContext } from './adaptive-intelligence';
import { knowledgeBase, KnowledgeEntry } from './knowledge-base';
import { codeIntelligence, CodeError, CodeAnalysisResult } from './code-intelligence';
import { databaseSync } from './database-sync';
import { SmartTaskExecutor, SmartAction } from '../smart-task-executor';
import { SmartErrorAnalyzer, ErrorContext } from '../error-handler';

export interface AIContext {
  task: {
    id: string;
    type: string;
    goal: string;
    target: string;
  };
  environment: {
    website: string;
    currentUrl: string;
    pageContext?: PageContext;
  };
  history: {
    previousActions: any[];
    outcomes: any[];
    learnings: any[];
  };
  constraints: {
    timeLimit?: number;
    resourceLimit?: any;
    stealthMode?: boolean;
  };
}

export interface AIDecision {
  action: string;
  reasoning: string;
  confidence: number;
  alternatives: Array<{
    action: string;
    confidence: number;
  }>;
  metadata: {
    learningSource?: string;
    adaptationApplied?: boolean;
    knowledgeUsed?: string[];
  };
}

export interface ExecutionPlan {
  strategy: string;
  phases: any[];
  estimatedTime: number;
  confidence: number;
  risks: any[];
  checkpoints: Array<{
    step: number;
    validation: string;
    fallback: string;
  }>;
}

export interface AIPerformance {
  successRate: number;
  averageExecutionTime: number;
  adaptationCount: number;
  learningProgress: number;
  knowledgeGrowth: number;
  confidence: number;
}

/**
 * العقل الرئيسي للذكاء الاصطناعي
 */
export class MasterAI {
  private executionHistory: Map<string, any[]> = new Map();
  private performanceMetrics: Map<string, AIPerformance> = new Map();
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize the Master AI with persistence and real browser
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Initializing Master AI Brain...');

    this.userId = userId;

    try {
      // Initialize persistence layer
      await learningEngine.initialize(userId);
      await databaseSync.initialize(userId);

      // Initialize real browser automation
      await SmartTaskExecutor.initializeBrowser();

      this.isInitialized = true;
      console.log('✅ Master AI Brain initialized with real execution');
    } catch (error: any) {
      console.error('❌ Failed to initialize Master AI:', error.message);
      throw error;
    }
  }

  /**
   * Shutdown the Master AI and cleanup resources
   */
  async shutdown(): Promise<void> {
    console.log('🧠 Shutting down Master AI Brain...');

    try {
      // Sync any pending data
      await databaseSync.syncAll();

      // Close browser
      await SmartTaskExecutor.closeBrowser();

      this.isInitialized = false;
      console.log('✅ Master AI Brain shutdown complete');
    } catch (error: any) {
      console.error('❌ Error during shutdown:', error.message);
    }
  }

  /**
   * اتخاذ قرار ذكي شامل
   */
  async makeDecision(context: AIContext): Promise<AIDecision> {
    console.log(`🧠 المعالج الرئيسي: تحليل الموقف...`);

    // 1. البحث في قاعدة المعرفة
    const relevantKnowledge = await this.consultKnowledgeBase(context);
    console.log(`📚 تم العثور على ${relevantKnowledge.length} معرفة ذات صلة`);

    // 2. التحقق من التعلم السابق
    const learnedStrategy = await learningEngine.predictBestStrategy(
      context.task.type,
      context.environment.website,
      context
    );
    console.log(`🎓 استراتيجية متعلمة: ${learnedStrategy.strategy} (ثقة: ${learnedStrategy.confidence})`);

    // 3. تحليل التكيف المطلوب
    let adaptationContext: AdaptationContext | null = null;
    if (context.environment.pageContext) {
      adaptationContext = await adaptiveIntelligence.detectChanges(
        context.environment.website,
        context.environment.pageContext
      );

      if (adaptationContext.changeDetected) {
        console.log(`🔄 تغيير مكتشف: ${adaptationContext.changeType} - ${adaptationContext.severity}`);
      }
    }

    // 4. اتخاذ القرار من محرك القرارات
    let basicDecision: DecisionResult;
    if (context.environment.pageContext) {
      basicDecision = await this.analyzePageAndDecide(
        context.environment.pageContext,
        context.task.type
      );
    } else {
      basicDecision = {
        action: 'analyze_environment',
        confidence: 0.6,
        reasoning: 'بحاجة لمزيد من المعلومات عن البيئة',
      };
    }

    // 5. دمج جميع المصادر لاتخاذ القرار النهائي
    const finalDecision = await this.synthesizeDecision(
      basicDecision,
      learnedStrategy,
      relevantKnowledge,
      adaptationContext,
      context
    );

    console.log(`✅ القرار النهائي: ${finalDecision.action} (ثقة: ${finalDecision.confidence})`);

    return finalDecision;
  }

  /**
   * إنشاء خطة تنفيذ ذكية
   */
  async createExecutionPlan(goal: Goal): Promise<ExecutionPlan> {
    console.log(`📋 إنشاء خطة تنفيذ لـ: ${goal.type}`);

    // 1. الحصول على توصيات تكيفية
    const adaptiveRecs = await adaptiveIntelligence.getAdaptiveRecommendations(
      goal.target.website,
      goal.type
    );

    // 2. إنشاء الخطة الاستراتيجية
    const strategicPlan = await strategicPlanner.createPlan(goal);

    // 3. إثراء الخطة بالمعرفة
    const enrichedPlan = await this.enrichPlanWithKnowledge(
      strategicPlan,
      adaptiveRecs
    );

    // 4. تحويل إلى خطة تنفيذ
    const executionPlan: ExecutionPlan = {
      strategy: enrichedPlan.id,
      phases: enrichedPlan.phases,
      estimatedTime: enrichedPlan.estimatedDuration,
      confidence: enrichedPlan.confidence,
      risks: enrichedPlan.risks,
      checkpoints: this.generateCheckpoints(enrichedPlan),
    };

    console.log(`✅ تم إنشاء خطة بـ ${executionPlan.phases.length} مرحلة`);

    return executionPlan;
  }

  /**
   * تنفيذ مهمة مع مراقبة ذكية
   */
  async executeTask(
    plan: ExecutionPlan,
    context: AIContext,
    onProgress?: (update: any) => void
  ): Promise<{
    success: boolean;
    results: any;
    learnings: any[];
    improvements: string[];
  }> {
    console.log(`🚀 بدء تنفيذ المهمة: ${context.task.id}`);

    const startTime = Date.now();
    const learnings: any[] = [];
    const improvements: string[] = [];

    try {
      // تحويل الخطة إلى Goal للمخطط الاستراتيجي
      const goal: Goal = {
        id: context.task.id,
        type: context.task.type as any,
        description: context.task.goal,
        target: {
          website: context.environment.website,
          url: context.environment.currentUrl,
        },
        requirements: {},
        constraints: context.constraints,
      };

      // إعادة إنشاء Plan كامل
      const fullPlan = await strategicPlanner.createPlan(goal);

      // تنفيذ الخطة
      const result = await strategicPlanner.executePlan(
        fullPlan,
        (phase, step, progress) => {
          onProgress?.({
            phase,
            step,
            progress,
            timestamp: new Date(),
          });

          // تسجيل التقدم للتعلم
          this.recordProgress(context.task.id, { phase, step, progress });
        }
      );

      // تسجيل التجربة للتعلم
      const experience: Experience = {
        id: `exp_${Date.now()}`,
        taskType: context.task.type,
        website: context.environment.website,
        action: 'complete_task',
        selector: '',
        success: result.success,
        timestamp: new Date(),
        context: {
          url: context.environment.currentUrl,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          retryCount: 0,
          confidence: plan.confidence,
        },
      };

      await learningEngine.recordExperience(experience);

      // تحليل النتائج وتوليد تعلمات
      if (result.success) {
        learnings.push({
          type: 'success',
          message: 'تم تنفيذ المهمة بنجاح',
          details: result.statistics,
        });

        improvements.push('استراتيجية التنفيذ كانت فعالة');
      } else {
        learnings.push({
          type: 'failure',
          message: 'فشل تنفيذ المهمة',
          errors: result.errors,
        });

        // تحليل الفشل
        const failureAnalysis = await learningEngine.analyzeFailures(
          context.environment.website
        );

        improvements.push(...failureAnalysis.recommendations);
      }

      // حفظ المعرفة المكتسبة
      await this.saveNewKnowledge(context, result, learnings);

      // تحديث مقاييس الأداء
      await this.updatePerformanceMetrics(
        context.environment.website,
        result.success,
        Date.now() - startTime
      );

      console.log(`✅ اكتمل التنفيذ: ${result.success ? 'نجح' : 'فشل'}`);

      return {
        success: result.success,
        results: result.results,
        learnings,
        improvements,
      };
    } catch (error: any) {
      console.error(`❌ خطأ في التنفيذ:`, error.message);

      // تسجيل الفشل للتعلم
      const experience: Experience = {
        id: `exp_${Date.now()}`,
        taskType: context.task.type,
        website: context.environment.website,
        action: 'complete_task',
        selector: '',
        success: false,
        timestamp: new Date(),
        context: {
          url: context.environment.currentUrl,
          errorMessage: error.message,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          retryCount: 0,
          confidence: plan.confidence,
        },
      };

      await learningEngine.recordExperience(experience);

      return {
        success: false,
        results: null,
        learnings: [
          {
            type: 'error',
            message: error.message,
            stack: error.stack,
          },
        ],
        improvements: ['مراجعة الاستراتيجية', 'تحسين معالجة الأخطاء'],
      };
    }
  }

  /**
   * تحسين الأداء بشكل مستمر
   */
  async selfImprove(domain?: string): Promise<{
    insights: any[];
    optimizations: string[];
    newKnowledge: number;
  }> {
    console.log('🔧 بدء عملية التحسين الذاتي...');

    // 1. توليد رؤى من قاعدة المعرفة
    const insights = await knowledgeBase.generateInsights(domain);
    console.log(`💡 تم توليد ${insights.length} رؤية`);

    // 2. تحليل الأداء
    const stats = learningEngine.getStatistics();
    console.log(`📊 معدل النجاح الإجمالي: ${(stats.averageSuccessRate * 100).toFixed(1)}%`);

    // 3. اقتراح تحسينات
    const optimizations: string[] = [];

    if (stats.averageSuccessRate < 0.7) {
      optimizations.push('معدل النجاح منخفض - يُنصح بمراجعة الاستراتيجيات');
    }

    if (stats.totalPatterns < 50) {
      optimizations.push('قليل من الأنماط المكتشفة - المزيد من التجارب مطلوبة');
    }

    // 4. البحث عن معرفة جديدة
    const knowledgeStats = knowledgeBase.getStatistics();
    const newKnowledge = knowledgeStats.totalEntries;

    console.log(`✅ التحسين الذاتي اكتمل`);

    return {
      insights,
      optimizations,
      newKnowledge,
    };
  }

  /**
   * الحصول على تقرير أداء شامل
   */
  async getPerformanceReport(domain?: string): Promise<{
    overall: AIPerformance;
    byDomain: Map<string, AIPerformance>;
    learningStats: any;
    knowledgeStats: any;
    recommendations: string[];
  }> {
    const learningStats = learningEngine.getStatistics();
    const knowledgeStats = knowledgeBase.getStatistics();

    // حساب الأداء الإجمالي
    const overall: AIPerformance = {
      successRate: learningStats.averageSuccessRate,
      averageExecutionTime: 0, // TODO: حساب من السجلات
      adaptationCount: 0, // TODO: حساب من التكيفات
      learningProgress: Math.min(learningStats.totalExperiences / 1000, 1.0),
      knowledgeGrowth: Math.min(knowledgeStats.totalEntries / 500, 1.0),
      confidence: (learningStats.averageSuccessRate + knowledgeStats.averageConfidence) / 2,
    };

    // توصيات التحسين
    const recommendations: string[] = [];

    if (overall.successRate < 0.8) {
      recommendations.push('💡 تحسين معدل النجاح عبر جمع المزيد من التجارب');
    }

    if (overall.knowledgeGrowth < 0.5) {
      recommendations.push('📚 توسيع قاعدة المعرفة في مجالات جديدة');
    }

    if (overall.learningProgress < 0.3) {
      recommendations.push('🎓 زيادة عدد التجار لتحسين التعلم');
    }

    return {
      overall,
      byDomain: this.performanceMetrics,
      learningStats,
      knowledgeStats,
      recommendations,
    };
  }

  /**
   * تصدير العقل المُدرب
   */
  async exportBrain(domain?: string): Promise<{
    version: string;
    exportDate: Date;
    learning: any;
    knowledge: any;
    adaptations: any;
    performance: any;
  }> {
    console.log('📦 تصدير العقل المُدرب...');

    return {
      version: '1.0.0',
      exportDate: new Date(),
      learning: {
        statistics: learningEngine.getStatistics(),
        models: domain ? learningEngine.exportModel(domain) : null,
      },
      knowledge: {
        entries: knowledgeBase.exportKnowledge(domain),
        statistics: knowledgeBase.getStatistics(),
      },
      adaptations: {
        // TODO: تصدير بيانات التكيف
      },
      performance: await this.getPerformanceReport(domain),
    };
  }

  /**
   * استيراد عقل مُدرب
   */
  async importBrain(brainData: any): Promise<{
    imported: boolean;
    stats: any;
  }> {
    console.log('📥 استيراد عقل مُدرب...');

    try {
      // استيراد المعرفة
      if (brainData.knowledge?.entries) {
        await knowledgeBase.importKnowledge(brainData.knowledge.entries);
      }

      // استيراد نماذج التعلم
      if (brainData.learning?.models) {
        learningEngine.importModel(brainData.learning.models);
      }

      console.log('✅ تم الاستيراد بنجاح');

      return {
        imported: true,
        stats: {
          knowledgeImported: brainData.knowledge?.entries?.length || 0,
          modelsImported: brainData.learning?.models ? 1 : 0,
        },
      };
    } catch (error: any) {
      console.error('❌ فشل الاستيراد:', error.message);

      return {
        imported: false,
        stats: {},
      };
    }
  }

  /**
   * تحليل وإصلاح كود المهمة تلقائياً
   */
  async analyzeAndFixTaskCode(taskCode: string): Promise<{
    success: boolean;
    originalCode: string;
    fixedCode: string;
    analysis: CodeAnalysisResult;
    appliedFixes: any[];
    improvements: string[];
  }> {
    console.log('🔍 بدء تحليل وإصلاح كود المهمة...');

    try {
      // 1. تحليل الكود
      const analysis = await codeIntelligence.analyzeCode(taskCode, 'javascript');
      console.log(`📊 نتائج التحليل: ${analysis.errors.length} أخطاء، ${analysis.warnings.length} تحذيرات`);

      // 2. إصلاح تلقائي إذا كانت هناك أخطاء
      let fixedCode = taskCode;
      let appliedFixes: any[] = [];

      if (analysis.errors.length > 0 || analysis.warnings.length > 0) {
        const fixResult = await codeIntelligence.autoFixCode(taskCode, analysis);
        
        if (fixResult.success) {
          fixedCode = fixResult.fixedCode;
          appliedFixes = fixResult.appliedFixes;
          console.log(`✅ تم إصلاح ${appliedFixes.length} مشكلة تلقائياً`);
        }
      }

      // 3. تحسين الكود
      const improveResult = await codeIntelligence.improveCode(fixedCode);
      
      if (improveResult.qualityAfter > improveResult.qualityBefore) {
        fixedCode = improveResult.improvedCode;
        console.log(`✨ تحسنت جودة الكود من ${improveResult.qualityBefore} إلى ${improveResult.qualityAfter}`);
      }

      // 4. تسجيل التعلم من الأخطاء
      for (const error of analysis.errors) {
        await codeIntelligence.learnFromError(error, taskCode);
      }

      // 5. حفظ المعرفة المكتسبة
      if (appliedFixes.length > 0) {
        await knowledgeBase.addKnowledge({
          category: 'code_fixes',
          domain: 'code_intelligence',
          content: {
            errors: analysis.errors,
            fixes: appliedFixes,
            beforeQuality: analysis.quality.score,
          },
          tags: ['code_fix', 'auto_fix'],
          confidence: 0.85,
          usage_count: 1,
          success_rate: 1.0,
          metadata: {
            source: 'code_intelligence',
            timestamp: new Date(),
          },
        });
      }

      return {
        success: analysis.errors.length === 0 || appliedFixes.length > 0,
        originalCode: taskCode,
        fixedCode,
        analysis,
        appliedFixes,
        improvements: improveResult.improvements || [],
      };
    } catch (error: any) {
      console.error('❌ خطأ في تحليل الكود:', error.message);

      return {
        success: false,
        originalCode: taskCode,
        fixedCode: taskCode,
        analysis: {
          valid: false,
          errors: [{
            type: 'syntax',
            severity: 'critical',
            message: error.message,
            autoFixable: false,
          }],
          warnings: [],
          suggestions: [],
          quality: { score: 0, readability: 0, maintainability: 0, performance: 0, security: 0 },
          fixes: [],
        },
        appliedFixes: [],
        improvements: [],
      };
    }
  }

  /**
   * التحقق من صحة كود المهمة قبل التنفيذ
   */
  async validateTaskCode(taskCode: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    console.log('✓ التحقق من صحة كود المهمة...');

    const validation = await codeIntelligence.validateCode(taskCode);
    const analysis = await codeIntelligence.analyzeCode(taskCode);

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      suggestions: analysis.suggestions,
    };
  }

  /**
   * تحسين كود المهمة بشكل ذكي
   */
  async optimizeTaskCode(taskCode: string): Promise<{
    optimizedCode: string;
    improvements: string[];
    qualityImprovement: number;
    performanceGain: number;
  }> {
    console.log('⚡ تحسين كود المهمة...');

    try {
      // 1. الحصول على التحليل الأولي
      const beforeAnalysis = await codeIntelligence.analyzeCode(taskCode);

      // 2. تحسين الكود
      const improveResult = await codeIntelligence.improveCode(taskCode);

      // 3. حساب التحسينات
      const qualityImprovement = improveResult.qualityAfter - improveResult.qualityBefore;
      const performanceGain = beforeAnalysis.quality.performance < improveResult.qualityAfter ? 
        (improveResult.qualityAfter - beforeAnalysis.quality.performance) : 0;

      console.log(`✅ تم التحسين: جودة +${qualityImprovement.toFixed(1)}، أداء +${performanceGain.toFixed(1)}`);

      return {
        optimizedCode: improveResult.improvedCode,
        improvements: improveResult.improvements,
        qualityImprovement,
        performanceGain,
      };
    } catch (error: any) {
      console.error('❌ فشل تحسين الكود:', error.message);

      return {
        optimizedCode: taskCode,
        improvements: [],
        qualityImprovement: 0,
        performanceGain: 0,
      };
    }
  }

  /**
   * تشخيص وإصلاح أخطاء التنفيذ
   */
  async diagnoseAndFixExecutionError(
    taskCode: string,
    error: any,
    context: AIContext
  ): Promise<{
    diagnosis: string;
    fixedCode: string;
    suggestions: string[];
    autoFixed: boolean;
  }> {
    console.log('🩺 تشخيص خطأ التنفيذ...');

    try {
      // 1. تحليل رسالة الخطأ
      const errorType = this.identifyErrorType(error);
      console.log(`🔍 نوع الخطأ: ${errorType}`);

      // 2. البحث في قاعدة المعرفة عن حلول مشابهة
      const similarErrors = await knowledgeBase.search({
        tags: ['error_fix', errorType],
        minConfidence: 0.6,
        limit: 3,
      });

      // 3. محاولة الإصلاح التلقائي
      const fixResult = await codeIntelligence.autoFixCode(taskCode);

      let diagnosis = `خطأ من نوع: ${errorType}. `;
      let suggestions: string[] = [];

      if (similarErrors.length > 0) {
        diagnosis += `تم العثور على ${similarErrors.length} حل مشابه. `;
        suggestions = similarErrors.map(e => e.content?.solution || 'فحص الكود');
      }

      // 4. توليد اقتراحات ذكية بناءً على السياق
      const contextualSuggestions = await this.generateContextualFixes(
        error,
        context,
        taskCode
      );
      suggestions.push(...contextualSuggestions);

      // 5. تسجيل الخطأ للتعلم
      await knowledgeBase.addKnowledge({
        category: 'error_fixes',
        domain: context.environment.website,
        content: {
          errorType,
          errorMessage: error.message,
          taskType: context.task.type,
          solution: fixResult.success ? 'auto_fixed' : 'manual_required',
          fixes: fixResult.appliedFixes,
        },
        tags: ['error_fix', errorType, context.task.type],
        confidence: fixResult.success ? 0.8 : 0.5,
        usage_count: 1,
        success_rate: fixResult.success ? 1.0 : 0.0,
        metadata: {
          error: error.message,
          timestamp: new Date(),
        },
      });

      console.log(`✅ التشخيص اكتمل: ${fixResult.success ? 'تم الإصلاح تلقائياً' : 'يحتاج تدخل يدوي'}`);

      return {
        diagnosis,
        fixedCode: fixResult.success ? fixResult.fixedCode : taskCode,
        suggestions,
        autoFixed: fixResult.success,
      };
    } catch (diagError: any) {
      console.error('❌ فشل التشخيص:', diagError.message);

      return {
        diagnosis: `خطأ في التشخيص: ${diagError.message}`,
        fixedCode: taskCode,
        suggestions: ['مراجعة الكود يدوياً', 'التحقق من السجلات'],
        autoFixed: false,
      };
    }
  }

  /**
   * الحصول على إحصائيات ذكاء الأكواد
   */
  getCodeIntelligenceStats(): {
    codeAnalysis: any;
    totalFixes: number;
    successRate: number;
    topErrors: any[];
  } {
    const stats = codeIntelligence.getLearningStats();

    return {
      codeAnalysis: {
        patternsLearned: stats.totalPatterns,
        averageQuality: 85, // TODO: حساب من التحليلات
      },
      totalFixes: stats.totalFixes,
      successRate: stats.successRate,
      topErrors: stats.topErrors,
    };
  }

  // ====== وظائف مساعدة خاصة ======

  private async consultKnowledgeBase(context: AIContext): Promise<KnowledgeEntry[]> {
    return await knowledgeBase.search({
      domain: context.environment.website,
      tags: [context.task.type],
      minConfidence: 0.5,
      limit: 5,
    });
  }

  private async analyzePageAndDecide(
    pageContext: PageContext,
    taskType: string
  ): Promise<DecisionResult> {
    switch (taskType) {
      case 'login':
        return await aiDecisionEngine.analyzeLoginPage(pageContext);
      case 'signup':
        return await aiDecisionEngine.analyzeSignupPage(pageContext);
      default:
        return await aiDecisionEngine.decideNextAction(pageContext, taskType);
    }
  }

  private async synthesizeDecision(
    basicDecision: DecisionResult,
    learnedStrategy: any,
    knowledge: KnowledgeEntry[],
    adaptationContext: AdaptationContext | null,
    context: AIContext
  ): Promise<AIDecision> {
    // دمج جميع المصادر
    let confidence = basicDecision.confidence * 0.4;
    confidence += learnedStrategy.confidence * 0.3;

    if (knowledge.length > 0) {
      const avgKnowledgeConfidence =
        knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length;
      confidence += avgKnowledgeConfidence * 0.2;
    }

    if (adaptationContext?.changeDetected) {
      confidence *= 0.9; // تقليل الثقة عند وجود تغييرات
    }

    // اختيار أفضل إجراء
    let action = basicDecision.action;
    if (learnedStrategy.confidence > basicDecision.confidence) {
      action = learnedStrategy.strategy;
    }

    // بناء alternatives
    const alternatives = [
      { action: basicDecision.action, confidence: basicDecision.confidence },
      { action: learnedStrategy.strategy, confidence: learnedStrategy.confidence },
    ].sort((a, b) => b.confidence - a.confidence);

    return {
      action,
      reasoning: this.buildReasoning(
        basicDecision,
        learnedStrategy,
        knowledge,
        adaptationContext
      ),
      confidence: Math.min(confidence, 1.0),
      alternatives: alternatives.slice(1, 3),
      metadata: {
        learningSource: learnedStrategy.reasoning,
        adaptationApplied: adaptationContext?.changeDetected || false,
        knowledgeUsed: knowledge.map((k) => k.id),
      },
    };
  }

  private buildReasoning(
    basic: DecisionResult,
    learned: any,
    knowledge: KnowledgeEntry[],
    adaptation: AdaptationContext | null
  ): string {
    let reasoning = `${basic.reasoning}. `;

    if (learned.confidence > 0.7) {
      reasoning += `التعلم السابق يدعم هذا القرار (${learned.reasoning}). `;
    }

    if (knowledge.length > 0) {
      reasoning += `تم العثور على ${knowledge.length} معرفة ذات صلة. `;
    }

    if (adaptation?.changeDetected) {
      reasoning += `تم اكتشاف ${adaptation.changeType} - قد يتطلب تكيف. `;
    }

    return reasoning;
  }

  private async enrichPlanWithKnowledge(
    plan: Plan,
    adaptiveRecs: any
  ): Promise<Plan> {
    // إثراء الخطة بالمعرفة والتوصيات التكيفية
    const enrichedPhases = plan.phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) => ({
        ...step,
        // إضافة selectors محسنة
        params: {
          ...step.params,
          recommendedSelectors: adaptiveRecs.selectors,
        },
      })),
    }));

    return {
      ...plan,
      phases: enrichedPhases,
    };
  }

  private generateCheckpoints(plan: Plan): any[] {
    const checkpoints: any[] = [];

    plan.phases.forEach((phase, phaseIndex) => {
      checkpoints.push({
        step: phaseIndex,
        validation: `التحقق من اكتمال ${phase.name}`,
        fallback: `إعادة محاولة ${phase.name} أو التخطي`,
      });
    });

    return checkpoints;
  }

  private recordProgress(taskId: string, progress: any): void {
    const history = this.executionHistory.get(taskId) || [];
    history.push({
      ...progress,
      timestamp: new Date(),
    });
    this.executionHistory.set(taskId, history);
  }

  private async saveNewKnowledge(
    context: AIContext,
    result: any,
    learnings: any[]
  ): Promise<void> {
    if (result.success) {
      // حفظ الاستراتيجية الناجحة
      await knowledgeBase.addKnowledge({
        category: 'workflow',
        domain: context.environment.website,
        content: {
          taskType: context.task.type,
          strategy: result.results,
        },
        tags: [context.task.type, 'successful'],
        confidence: 0.8,
        usage_count: 1,
        success_rate: 1.0,
        metadata: {
          source: 'execution',
          context: context.task,
        },
      });
    }
  }

  private async updatePerformanceMetrics(
    website: string,
    success: boolean,
    executionTime: number
  ): Promise<void> {
    let metrics = this.performanceMetrics.get(website) || {
      successRate: 0,
      averageExecutionTime: 0,
      adaptationCount: 0,
      learningProgress: 0,
      knowledgeGrowth: 0,
      confidence: 0,
    };

    // تحديث معدل النجاح (متوسط متحرك)
    metrics.successRate = metrics.successRate * 0.9 + (success ? 0.1 : 0);

    // تحديث متوسط وقت التنفيذ
    if (metrics.averageExecutionTime === 0) {
      metrics.averageExecutionTime = executionTime;
    } else {
      metrics.averageExecutionTime =
        metrics.averageExecutionTime * 0.8 + executionTime * 0.2;
    }

    this.performanceMetrics.set(website, metrics);
  }

  private identifyErrorType(error: any): string {
    if (error.name === 'TypeError') {
      return 'type_error';
    } else if (error.name === 'ReferenceError') {
      return 'reference_error';
    } else if (error.name === 'SyntaxError') {
      return 'syntax_error';
    } else if (error.name === 'RangeError') {
      return 'range_error';
    } else if (error.name === 'EvalError') {
      return 'eval_error';
    } else if (error.name === 'URIError') {
      return 'uri_error';
    } else {
      return 'unknown_error';
    }
  }

  private async generateContextualFixes(
    error: any,
    context: AIContext,
    taskCode: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // مثال على توليد اقتراحات بناءً على السياق
    if (error.name === 'TypeError') {
      suggestions.push('تحقق من أن جميع المتغيرات محددة بشكل صحيح');
    } else if (error.name === 'ReferenceError') {
      suggestions.push('تأكد من أن جميع المتغيرات معرفة قبل استخدامها');
    } else if (error.name === 'SyntaxError') {
      suggestions.push('تحقق من صحة بنية الكود');
    } else if (error.name === 'RangeError') {
      suggestions.push('تأكد من أن القيم ضمن النطاق المسموح به');
    } else if (error.name === 'EvalError') {
      suggestions.push('تحقق من صحة الكود الذي يتم تقييمه');
    } else if (error.name === 'URIError') {
      suggestions.push('تحقق من صحة الرابط المحدد');
    }

    return suggestions;
  }
}

// مثيل مشترك
export const masterAI = new MasterAI();
