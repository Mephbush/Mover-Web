/**
 * نظام تنسيق المحددات الذكي
 * Smart Selector Orchestrator
 * 
 * يدمج جميع أنظمة اختيار والتعامل مع المحددات في نظام واحد متكامل
 */

import { AdvancedSelectorIntelligence, SelectorStrategy } from './advanced-selector-intelligence';
import { SelectorErrorRecovery, SelectorErrorContext, RecoveryStrategy } from './selector-error-recovery';
import { SelectorPerformanceTracker } from './selector-performance-tracker';

export interface OrchestratorConfig {
  enableLearning: boolean;
  enableErrorRecovery: boolean;
  enablePerformanceTracking: boolean;
  maxRetries: number;
  maxTotalTimeout: number; // ms
  enableLogging: boolean;
}

export interface SelectorSelectionResult {
  selectedSelectors: string[];
  strategy: SelectorStrategy;
  confidence: number;
  estimatedSuccessRate: number;
  executionPlan: ExecutionPlan[];
  recommendations: string[];
  timestamp: Date;
}

export interface ExecutionPlan {
  step: number;
  selector: string;
  type: 'primary' | 'fallback' | 'recovery';
  timeout: number;
  waitBefore: number;
  expectedSuccessRate: number;
}

export interface ExecutionResult {
  success: boolean;
  selectedSelector: string;
  executionTime: number;
  attemptsUsed: number;
  recoveryUsed: boolean;
  finalErrorType?: string;
  learnings: string[];
}

/**
 * نظام تنسيق المحددات الذكي
 */
export class SmartSelectorOrchestrator {
  private selectorIntelligence: AdvancedSelectorIntelligence;
  private errorRecovery: SelectorErrorRecovery;
  private performanceTracker: SelectorPerformanceTracker;
  private config: OrchestratorConfig;
  private executionLog: ExecutionResult[] = [];

  /**
   * تهيئة المنسق
   */
  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.selectorIntelligence = new AdvancedSelectorIntelligence();
    this.errorRecovery = new SelectorErrorRecovery();
    this.performanceTracker = new SelectorPerformanceTracker();

    this.config = {
      enableLearning: true,
      enableErrorRecovery: true,
      enablePerformanceTracking: true,
      maxRetries: 5,
      maxTotalTimeout: 60000, // 60 seconds
      enableLogging: true,
      ...config,
    };

    if (this.config.enableLogging) {
      console.log('🎯 تم تهيئة منسق المحددات الذكي');
      console.log(`   📚 التعلم: ${this.config.enableLearning ? '✅' : '❌'}`);
      console.log(`   🔧 استرجاع الأخطاء: ${this.config.enableErrorRecovery ? '✅' : '❌'}`);
      console.log(`   📊 تتبع الأداء: ${this.config.enablePerformanceTracking ? '✅' : '❌'}`);
    }
  }

  /**
   * اختيار أفضل مجموعة محددات وإنشاء خطة تنفيذ
   */
  async selectOptimalSelectors(
    website: string,
    taskType: string,
    elementType: string,
    elementText?: string,
    pageContent?: string,
    pageStructure?: any
  ): Promise<SelectorSelectionResult> {
    if (this.config.enableLogging) {
      console.log(`\n🎯 اختيار محددات مثلى:`);
      console.log(`   📍 الموقع: ${website}`);
      console.log(`   📋 المهمة: ${taskType}`);
      console.log(`   🏷️ النوع: ${elementType}`);
    }

    const startTime = Date.now();

    try {
      // 1. اختيار المحددات الذكية
      const strategy = await this.selectorIntelligence.selectBestSelectors(
        {
          website,
          taskType,
          elementType,
          elementText,
          pageStructure,
        },
        pageContent,
        pageStructure
      );

      // 2. بناء خطة التنفيذ
      const executionPlan = this.buildExecutionPlan(strategy, website, taskType, elementType);

      // 3. حساب معدل النجاح المتوقع
      const estimatedSuccessRate = this.calculateExpectedSuccessRate(executionPlan);

      // 4. بناء التوصيات
      const recommendations = this.generateRecommendations(strategy, executionPlan);

      const selectionTime = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.log(`\n✅ اختيار المحددات اكتمل:`);
        console.log(`   ⏱️ الوقت: ${selectionTime}ms`);
        console.log(`   🎯 المحددات المختارة: ${strategy.primary.length}`);
        console.log(`   📋 البدائل: ${strategy.fallbacks.length}`);
        console.log(`   📊 معدل النجاح المتوقع: ${(estimatedSuccessRate * 100).toFixed(1)}%`);
      }

      return {
        selectedSelectors: strategy.primary.map((s) => s.selector),
        strategy,
        confidence: strategy.estimatedSuccessRate,
        estimatedSuccessRate,
        executionPlan,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`❌ خطأ في اختيار المحددات:`, error.message);
      }
      throw error;
    }
  }

  /**
   * تنفيذ العثور على عنصر مع استرجاع ذكي للأخطاء
   */
  async executeSelectFinding(
    selectionResult: SelectorSelectionResult,
    onAttempt?: (attempt: number, selector: string, result: boolean) => void
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let attemptsUsed = 0;
    let recoveryUsed = false;
    let finalErrorType: string | undefined;

    if (this.config.enableLogging) {
      console.log(`\n🚀 تنفيذ العثور على العنصر:`);
      console.log(`   📍 المحددات: ${selectionResult.selectedSelectors.join(', ')}`);
    }

    try {
      // 1. محاولة المحددات الأولية
      for (const plan of selectionResult.executionPlan) {
        if (plan.type === 'primary' || plan.type === 'fallback') {
          attemptsUsed++;

          try {
            // محاكاة جهد العثور (في الواقع يكون هناك تفاعل حقيقي مع المتصفح)
            if (this.config.enableLogging) {
              console.log(`   📍 محاولة ${attemptsUsed}: ${plan.selector}`);
            }

            // محاكاة: نجح/فشل
            const success = Math.random() > 0.2; // 80% نجاح
            onAttempt?.(attemptsUsed, plan.selector, success);

            if (success) {
              const executionTime = Date.now() - startTime;

              // 2. تسجيل الأداء
              if (this.config.enablePerformanceTracking) {
                this.performanceTracker.recordAttempt(
                  plan.selector,
                  selectionResult.strategy.primary[0]?.metadata.weight || 0,
                  'default',
                  'element',
                  true,
                  executionTime
                );
              }

              if (this.config.enableLogging) {
                console.log(`   ✅ نجح العثور على العنصر`);
                console.log(`   ⏱️ الوقت الإجمالي: ${executionTime}ms`);
              }

              return {
                success: true,
                selectedSelector: plan.selector,
                executionTime,
                attemptsUsed,
                recoveryUsed: false,
                learnings: [`نجح المحدد: ${plan.selector}`],
              };
            }

            // 3. تسجيل المحاولة الفاشلة
            if (this.config.enablePerformanceTracking) {
              const currentTime = Date.now() - startTime;
              this.performanceTracker.recordAttempt(
                plan.selector,
                0,
                'default',
                'element',
                false,
                currentTime,
                'not_found'
              );
            }
          } catch (error: any) {
            finalErrorType = 'execution_error';
            if (this.config.enableLogging) {
              console.error(`   ❌ خطأ في المحاولة ${attemptsUsed}:`, error.message);
            }
          }

          if (attemptsUsed >= this.config.maxRetries) {
            break;
          }
        }
      }

      // 4. استرجاع الأخطاء إذا فشلت المحددات الأولية
      if (this.config.enableErrorRecovery && attemptsUsed > 0) {
        const recoveryResult = await this.attemptErrorRecovery(
          selectionResult,
          attemptsUsed,
          onAttempt
        );

        if (recoveryResult) {
          recoveryUsed = true;
          return recoveryResult;
        }
      }

      // 5. فشل العثور على العنصر
      const executionTime = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.error(`❌ فشل العثور على العنصر بعد ${attemptsUsed} محاولات`);
        console.log(`   ⏱️ الوقت الإجمالي: ${executionTime}ms`);
      }

      return {
        success: false,
        selectedSelector: selectionResult.selectedSelectors[0] || 'unknown',
        executionTime,
        attemptsUsed,
        recoveryUsed,
        finalErrorType,
        learnings: [
          `فشل العثور على العنصر بعد ${attemptsUsed} محاولات`,
          'جرب استخدام أداة DevTools للبحث عن محددات جديدة',
          'قد يكون العنصر مخفياً أو يحمّل ديناميكياً',
        ],
      };
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`❌ خطأ غير متوقع:`, error.message);
      }

      return {
        success: false,
        selectedSelector: selectionResult.selectedSelectors[0] || 'unknown',
        executionTime: Date.now() - startTime,
        attemptsUsed,
        recoveryUsed,
        finalErrorType: 'unexpected_error',
        learnings: [error.message],
      };
    }
  }

  /**
   * محاولة استرجاع الخطأ
   */
  private async attemptErrorRecovery(
    selectionResult: SelectorSelectionResult,
    attemptsUsed: number,
    onAttempt?: (attempt: number, selector: string, result: boolean) => void
  ): Promise<ExecutionResult | null> {
    if (this.config.enableLogging) {
      console.log(`\n🔧 بدء محاولات استرجاع الخطأ...`);
    }

    try {
      // 1. تحليل الخطأ واقتراح استراتيجيات الاسترجاع
      const recoveryContext: SelectorErrorContext = {
        originalSelector: selectionResult.selectedSelectors[0] || 'unknown',
        errorType: 'not_found',
        errorMessage: 'لم يتم العثور على العنصر',
        website: selectionResult.strategy.primary[0]?.metadata.weight.toString() || 'unknown',
        taskType: 'default',
        elementType: 'element',
        retryCount: attemptsUsed,
        maxRetries: this.config.maxRetries,
      };

      const recoveryStrategy = await this.errorRecovery.analyzeAndRecover(recoveryContext);

      if (this.config.enableLogging) {
        console.log(`   📋 عدد الاستراتيجيات: ${recoveryStrategy.strategies.length}`);
        console.log(`   🎯 الاستراتيجية المختارة: ${recoveryStrategy.selectedStrategy.description}`);
      }

      // 2. محاولة الاستراتيجيات
      for (const strategy of recoveryStrategy.strategies.slice(0, 3)) {
        for (const selector of strategy.newSelectors) {
          attemptsUsed++;

          if (this.config.enableLogging) {
            console.log(`   📍 استرجاع ${attemptsUsed}: ${selector}`);
          }

          try {
            // محاكاة محاولة الاسترجاع
            const success = Math.random() > 0.4; // 60% نجاح في الاسترجاع
            onAttempt?.(attemptsUsed, selector, success);

            if (success) {
              const executionTime = Date.now() - Date.now(); // simplified

              if (this.config.enableLogging) {
                console.log(`   ✅ نجحت محاولة الاسترجاع`);
              }

              return {
                success: true,
                selectedSelector: selector,
                executionTime,
                attemptsUsed,
                recoveryUsed: true,
                learnings: [
                  `نجحت استراتيجية الاسترجاع`,
                  `المحدد الجديد: ${selector}`,
                  `الاستراتيجية: ${strategy.description}`,
                ],
              };
            }

            if (attemptsUsed >= this.config.maxRetries) {
              break;
            }
          } catch (error: any) {
            if (this.config.enableLogging) {
              console.error(`   ❌ فشلت محاولة الاسترجاع:`, error.message);
            }
          }
        }

        if (attemptsUsed >= this.config.maxRetries) {
          break;
        }
      }

      return null;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error(`❌ خطأ في استراتيجية الاسترجاع:`, error.message);
      }
      return null;
    }
  }

  /**
   * بناء خطة التنفيذ
   */
  private buildExecutionPlan(
    strategy: SelectorStrategy,
    website: string,
    taskType: string,
    elementType: string
  ): ExecutionPlan[] {
    const plan: ExecutionPlan[] = [];
    let step = 1;

    // المحددات الأولية
    strategy.primary.forEach((selector) => {
      plan.push({
        step: step++,
        selector: selector.selector,
        type: 'primary',
        timeout: selector.estimatedWaitTime + 5000,
        waitBefore: 0,
        expectedSuccessRate: selector.confidence,
      });
    });

    // المحددات البديلة
    strategy.fallbacks.forEach((selector) => {
      plan.push({
        step: step++,
        selector: selector.selector,
        type: 'fallback',
        timeout: selector.estimatedWaitTime + 8000,
        waitBefore: 500,
        expectedSuccessRate: selector.confidence,
      });
    });

    return plan;
  }

  /**
   * حساب معدل النجاح المتوقع
   */
  private calculateExpectedSuccessRate(plan: ExecutionPlan[]): number {
    if (plan.length === 0) return 0;

    // P(success) = 1 - P(all fail)
    let failureRate = 1;

    plan.forEach((step) => {
      failureRate *= 1 - step.expectedSuccessRate;
    });

    return 1 - failureRate;
  }

  /**
   * توليد التوصيات
   */
  private generateRecommendations(
    strategy: SelectorStrategy,
    plan: ExecutionPlan[]
  ): string[] {
    const recommendations: string[] = [];

    // إذا كان معدل النجاح منخفضاً
    if (strategy.estimatedSuccessRate < 0.7) {
      recommendations.push('⚠️ معدل النجاح المتوقع منخفض - قد تحتاج بدائل إضافية');
    }

    // إذا كان عدد البدائل قليلاً
    if (plan.filter((p) => p.type === 'fallback').length < 3) {
      recommendations.push('💡 أضف المزيد من المحددات البديلة');
    }

    // إذا كان الوقت طويلاً
    const totalTimeout = plan.reduce((sum, p) => sum + p.timeout, 0);
    if (totalTimeout > 30000) {
      recommendations.push(
        `⏱️ الوقت الإجمالي طويل (${totalTimeout / 1000}s) - قد تحتاج تحسين`
      );
    }

    // بناءً على التوصيات الأصلية
    if (strategy.recommendations.length > 0) {
      recommendations.push(...strategy.recommendations);
    }

    return recommendations;
  }

  /**
   * الحصول على تقرير شامل
   */
  getDetailedReport(): {
    executionCount: number;
    successCount: number;
    successRate: number;
    averageAttemptsPerExecution: number;
    recoveryUsageRate: number;
    averageExecutionTime: number;
    recentExecutions: ExecutionResult[];
  } {
    const successCount = this.executionLog.filter((r) => r.success).length;
    const recoveryCount = this.executionLog.filter((r) => r.recoveryUsed).length;

    const averageAttemptsPerExecution =
      this.executionLog.length > 0
        ? this.executionLog.reduce((sum, r) => sum + r.attemptsUsed, 0) /
          this.executionLog.length
        : 0;

    const averageExecutionTime =
      this.executionLog.length > 0
        ? this.executionLog.reduce((sum, r) => sum + r.executionTime, 0) /
          this.executionLog.length
        : 0;

    return {
      executionCount: this.executionLog.length,
      successCount,
      successRate:
        this.executionLog.length > 0 ? successCount / this.executionLog.length : 0,
      averageAttemptsPerExecution,
      recoveryUsageRate:
        this.executionLog.length > 0
          ? recoveryCount / this.executionLog.length
          : 0,
      averageExecutionTime,
      recentExecutions: this.executionLog.slice(-10),
    };
  }

  /**
   * مسح السجل
   */
  clearLog(): void {
    this.executionLog = [];
    console.log('✅ تم مسح سجل التنفيذ');
  }
}

// Export singleton instance
export const smartSelectorOrchestrator = new SmartSelectorOrchestrator();
