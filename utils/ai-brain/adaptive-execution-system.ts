/**
 * نظام التنفيذ التكيفي
 * Adaptive Execution System
 * 
 * تعديل الاستراتيجية بناءً على المعلومات الفورية
 */

export interface ExecutionStrategy {
  id: string;
  name: string;
  steps: ExecutionStep[];
  timeout: number;
  maxRetries: number;
  fallbackStrategy?: ExecutionStrategy;
  adaptiveRules: AdaptiveRule[];
}

export interface ExecutionStep {
  id: string;
  action: string;
  selector?: string;
  value?: any;
  waitFor?: string;
  timeout: number;
  retryOnFail: boolean;
  condition?: (context: ExecutionContext) => boolean;
}

export interface AdaptiveRule {
  condition: (feedback: ExecutionFeedback) => boolean;
  action: (context: ExecutionContext) => void;
  priority: number;
}

export interface ExecutionFeedback {
  stepIndex: number;
  stepId: string;
  action: string;
  success: boolean;
  duration: number;
  error?: string;
  pageState?: Record<string, any>;
  adaptationApplied?: string;
}

export interface ExecutionContext {
  strategyId: string;
  startTime: Date;
  currentStep: number;
  feedback: ExecutionFeedback[];
  state: Record<string, any>;
  adaptations: string[];
}

export interface ExecutionResult {
  strategyId: string;
  success: boolean;
  totalDuration: number;
  stepsCompleted: number;
  totalSteps: number;
  feedback: ExecutionFeedback[];
  adaptations: string[];
  finalState: Record<string, any>;
  error?: string;
}

/**
 * نظام التنفيذ التكيفي
 */
export class AdaptiveExecutionSystem {
  private strategies: Map<string, ExecutionStrategy> = new Map();
  private executionHistory: ExecutionResult[] = [];
  private readonly maxHistorySize = 500;

  /**
   * تسجيل استراتيجية
   */
  registerStrategy(strategy: ExecutionStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * تنفيذ استراتيجية مع التكيف
   */
  async executeStrategy(
    page: any,
    strategyId: string,
    initialState?: Record<string, any>
  ): Promise<ExecutionResult> {
    const strategy = this.strategies.get(strategyId);

    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }

    console.log(`⚙️ Executing strategy: ${strategy.name}`);

    const context: ExecutionContext = {
      strategyId,
      startTime: new Date(),
      currentStep: 0,
      feedback: [],
      state: initialState || {},
      adaptations: [],
    };

    try {
      for (let i = 0; i < strategy.steps.length; i++) {
        context.currentStep = i;
        const step = strategy.steps[i];

        // Check step condition
        if (step.condition && !step.condition(context)) {
          console.log(`   ⊘ Skipping step ${i + 1}: condition not met`);
          continue;
        }

        // Execute step
        const success = await this.executeStep(page, step, context);
        context.feedback.push({
          stepIndex: i,
          stepId: step.id,
          action: step.action,
          success,
          duration: 0,
          pageState: await this.capturePageState(page),
        });

        if (!success) {
          // Apply adaptive rules
          await this.applyAdaptiveRules(page, strategy, context);

          // Check if we should continue or fallback
          if (!step.retryOnFail) {
            if (strategy.fallbackStrategy) {
              console.log(`   🔄 Switching to fallback strategy: ${strategy.fallbackStrategy.name}`);
              return await this.executeStrategy(page, strategy.fallbackStrategy.id, context.state);
            } else {
              const result: ExecutionResult = {
                strategyId,
                success: false,
                totalDuration: Date.now() - context.startTime.getTime(),
                stepsCompleted: i,
                totalSteps: strategy.steps.length,
                feedback: context.feedback,
                adaptations: context.adaptations,
                finalState: context.state,
                error: `Failed at step ${i + 1}: ${step.action}`,
              };
              return result;
            }
          }
        }
      }

      const result: ExecutionResult = {
        strategyId,
        success: true,
        totalDuration: Date.now() - context.startTime.getTime(),
        stepsCompleted: strategy.steps.length,
        totalSteps: strategy.steps.length,
        feedback: context.feedback,
        adaptations: context.adaptations,
        finalState: context.state,
      };

      this.recordExecution(result);
      console.log(`✅ Strategy executed successfully: ${strategy.name}`);
      return result;
    } catch (error: any) {
      const result: ExecutionResult = {
        strategyId,
        success: false,
        totalDuration: Date.now() - context.startTime.getTime(),
        stepsCompleted: context.currentStep,
        totalSteps: strategy.steps.length,
        feedback: context.feedback,
        adaptations: context.adaptations,
        finalState: context.state,
        error: error.message,
      };

      this.recordExecution(result);
      console.log(`❌ Strategy failed: ${error.message}`);
      return result;
    }
  }

  /**
   * تنفيذ خطوة واحدة
   */
  private async executeStep(
    page: any,
    step: ExecutionStep,
    context: ExecutionContext
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      console.log(`   ${context.currentStep + 1}. ${step.action}`);

      // Wait for element if selector provided
      if (step.selector && step.waitFor) {
        try {
          await page.waitForSelector(step.selector, { timeout: parseInt(step.waitFor) });
        } catch {
          console.warn(`   ⚠️ Wait for selector timeout: ${step.selector}`);
        }
      }

      // Execute action
      switch (step.action) {
        case 'click':
          await page.locator(step.selector!).click({ timeout: step.timeout });
          break;

        case 'fill':
          await page.locator(step.selector!).fill(step.value, { timeout: step.timeout });
          break;

        case 'type':
          await page.locator(step.selector!).type(step.value, { timeout: step.timeout });
          break;

        case 'select':
          await page.locator(step.selector!).selectOption(step.value, { timeout: step.timeout });
          break;

        case 'screenshot':
          await page.screenshot({ path: step.value || 'screenshot.png' });
          break;

        case 'wait':
          await page.waitForTimeout(step.timeout);
          break;

        case 'evaluate':
          context.state.evaluationResult = await page.evaluate(step.value);
          break;

        case 'extract':
          const element = await page.locator(step.selector!).first();
          context.state[step.id] = await element.textContent();
          break;

        default:
          console.warn(`Unknown action: ${step.action}`);
          return false;
      }

      return true;
    } catch (error: any) {
      console.warn(`   ❌ Step failed: ${error.message}`);
      return false;
    } finally {
      const duration = Date.now() - startTime;
      if (context.feedback.length > 0) {
        context.feedback[context.feedback.length - 1].duration = duration;
      }
    }
  }

  /**
   * تطبيق القواعس التكيفية
   */
  private async applyAdaptiveRules(
    page: any,
    strategy: ExecutionStrategy,
    context: ExecutionContext
  ): Promise<void> {
    const lastFeedback = context.feedback[context.feedback.length - 1];

    if (!lastFeedback) return;

    // Sort rules by priority
    const sortedRules = [...strategy.adaptiveRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.condition(lastFeedback)) {
        console.log(`   🔧 Applying adaptation rule`);
        rule.action(context);
        context.adaptations.push(rule.constructor.name);
        lastFeedback.adaptationApplied = rule.constructor.name;
        break;
      }
    }
  }

  /**
   * التقاط حالة الصفحة
   */
  private async capturePageState(page: any): Promise<Record<string, any>> {
    try {
      return await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        readyState: document.readyState,
        errorCount: (window as any).__errorCount || 0,
      }));
    } catch {
      return {};
    }
  }

  /**
   * الحصول على تاريخ التنفيذ
   */
  getExecutionHistory(limit?: number): ExecutionResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  /**
   * الحصول على الإحصائيات
   */
  getStatistics(): {
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    commonAdaptations: Record<string, number>;
  } {
    const successful = this.executionHistory.filter(e => e.success).length;
    const total = this.executionHistory.length;

    const avgDuration = total > 0
      ? this.executionHistory.reduce((sum, e) => sum + e.totalDuration, 0) / total
      : 0;

    const adaptationCounts: Record<string, number> = {};
    this.executionHistory.forEach(result => {
      result.adaptations.forEach(adaptation => {
        adaptationCounts[adaptation] = (adaptationCounts[adaptation] || 0) + 1;
      });
    });

    return {
      totalExecutions: total,
      successRate: total > 0 ? successful / total : 0,
      averageDuration: avgDuration,
      commonAdaptations: adaptationCounts,
    };
  }

  // =================== Private Methods ===================

  private recordExecution(result: ExecutionResult): void {
    this.executionHistory.push(result);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }
}

export function getAdaptiveExecutionSystem(): AdaptiveExecutionSystem {
  return new AdaptiveExecutionSystem();
}
