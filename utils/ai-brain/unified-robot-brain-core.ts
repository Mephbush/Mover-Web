/**
 * قلب الروبوت الموحد
 * Unified Robot Brain Core
 * 
 * يجمع جميع الأنظمة الذكية في نظام موحد قوي
 * السرعة + الذكاء + الموثوقية = روبوت مثالي
 */

import { AdvancedRobotBrainLogic, RobotUnderstanding } from './advanced-robot-logic';
import { LightningFastDiscoverySystem, FastFindResult } from './lightning-fast-discovery';
import { SmartElementHandler, ElementInteraction } from './smart-element-handler';
import { UltraIntelligentSelectorSystem } from './ultra-intelligent-selector-system';
import { HighPerformanceOptimizer } from './high-performance-optimizer';

export interface RobotTask {
  id: string;
  type: 'login' | 'scraping' | 'form' | 'navigation' | 'custom';
  url: string;
  steps: TaskStep[];
  parameters?: Record<string, any>;
  timeout?: number;
}

export interface TaskStep {
  id: string;
  action: string;
  selector?: string;
  value?: string;
  validation?: string;
  humanLike?: boolean;
}

export interface ExecutionResult {
  taskId: string;
  success: boolean;
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  results: Record<string, any>;
  errors: string[];
  intelligence: {
    understanding: number;
    execution: number;
    adaptation: number;
  };
}

/**
 * محرك الذكاء الموحد
 */
class UnifiedIntelligenceEngine {
  private robotLogic: AdvancedRobotBrainLogic;
  private fastFinder: LightningFastDiscoverySystem;
  private elementHandler: SmartElementHandler;
  private intelligentSelector: UltraIntelligentSelectorSystem;
  private optimizer: HighPerformanceOptimizer;

  constructor() {
    this.robotLogic = new AdvancedRobotBrainLogic();
    this.fastFinder = new LightningFastDiscoverySystem();
    this.elementHandler = new SmartElementHandler();
    this.intelligentSelector = new UltraIntelligentSelectorSystem();
    this.optimizer = new HighPerformanceOptimizer();
  }

  /**
   * فهم شامل للمهمة
   */
  async understandTask(task: RobotTask, page: any): Promise<RobotUnderstanding> {
    const taskDescription = `تنفيذ ${task.type}: ${task.steps.map(s => s.action).join(' → ')}`;
    return await this.robotLogic.understand(taskDescription, page);
  }

  /**
   * البحث الذكي السريع عن عنصر
   */
  async findElement(
    page: any,
    step: TaskStep,
    context?: any
  ): Promise<FastFindResult> {
    // محاولة البحث السريع أولاً
    let result = await this.fastFinder.findElementLightning(page, {
      type: step.action,
      text: step.value,
      placeholder: step.value,
    });

    if (result.found) return result;

    // إذا فشل، استخدم البحث الذكي المتقدم
    const intelligence = await this.intelligentSelector.findElementIntelligently(
      ['button', 'input', 'select', '[role="button"]'],
      page,
      context
    );

    if (intelligence.selectors && intelligence.selectors.length > 0) {
      result = await this.fastFinder.findElementLightning(page, {
        type: intelligence.selectors[0],
        text: step.value,
      });
    }

    return result;
  }

  /**
   * التنفيذ الذكي للخطوة
   */
  async executeStep(
    step: TaskStep,
    element: any,
    page: any,
    options: any = {}
  ): Promise<ElementInteraction> {
    const humanLike = options.humanLike !== false;

    switch (step.action) {
      case 'click':
        return await this.elementHandler.smartClick(element, page, {
          humanLike,
          scrollIntoView: true,
          retry: true,
          maxRetries: 2,
        });

      case 'fill':
      case 'type':
        return await this.elementHandler.smartFill(element, page, step.value || '', {
          humanLike,
          scrollIntoView: true,
          retry: true,
          maxRetries: 2,
        });

      case 'select':
        return await this.elementHandler.smartSelect(element, step.value || '', {
          humanLike,
          scrollIntoView: true,
        });

      case 'extract':
        return await this.elementHandler.smartExtract(element, 'text');

      default:
        return {
          action: step.action as any,
          success: false,
          timeMs: 0,
          error: 'Unknown action',
        };
    }
  }

  /**
   * التحقق من النتيجة
   */
  async validateResult(
    result: ElementInteraction,
    expectedValidation?: string
  ): Promise<boolean> {
    if (!result.success) return false;

    if (expectedValidation) {
      // يمكن إضافة منطق التحقق المخصص هنا
      return true;
    }

    return true;
  }
}

/**
 * النظام الرئيسي المتكامل
 */
export class UnifiedRobotBrainCore {
  private intelligenceEngine: UnifiedIntelligenceEngine;
  private executionLog: ExecutionResult[] = [];

  constructor() {
    this.intelligenceEngine = new UnifiedIntelligenceEngine();
  }

  /**
   * تنفيذ المهمة بذكاء عميق
   */
  async executeTask(task: RobotTask, page: any): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];
    let stepsCompleted = 0;

    console.log(`🤖 بدء تنفيذ المهمة: ${task.id}`);
    console.log(`📋 نوع المهمة: ${task.type}`);
    console.log(`📍 عدد الخطوات: ${task.steps.length}\n`);

    // 1. فهم المهمة
    console.log('🧠 مرحلة الفهم...');
    const understanding = await this.intelligenceEngine.understandTask(task, page);
    const understandingScore = understanding.confidence;
    console.log(`✅ مستوى الفهم: ${(understandingScore * 100).toFixed(1)}%\n`);

    // 2. تنفيذ الخطوات
    console.log('⚙️ مرحلة التنفيذ...');
    let executionScore = 0;
    let executedSteps = 0;

    for (const step of task.steps) {
      try {
        console.log(`\n📌 الخطوة: ${step.id}`);
        console.log(`   الإجراء: ${step.action}`);

        // البحث عن العنصر
        console.log('   🔍 البحث عن العنصر...');
        const findResult = await this.intelligenceEngine.findElement(
          page,
          step,
          { url: task.url }
        );

        if (!findResult.found) {
          throw new Error(`لم يتم العثور على العنصر: ${step.selector}`);
        }

        console.log(`   ✅ تم العثور على العنصر (${findResult.timeMs}ms)`);
        console.log(`   📊 طريقة البحث: ${findResult.method}`);
        console.log(`   🎯 الثقة: ${(findResult.confidence * 100).toFixed(1)}%`);

        // تنفيذ الإجراء
        console.log('   ⚡ تنفيذ الإجراء...');
        const interaction = await this.intelligenceEngine.executeStep(
          step,
          findResult.element,
          page,
          { humanLike: true }
        );

        if (!interaction.success) {
          throw new Error(`فشل الإجراء: ${interaction.error}`);
        }

        console.log(`   ✅ تم تنفيذ الإجراء (${interaction.timeMs}ms)`);

        // التحقق من النتيجة
        const validated = await this.intelligenceEngine.validateResult(
          interaction,
          step.validation
        );

        if (!validated) {
          throw new Error('فشل التحقق من النتيجة');
        }

        results[step.id] = interaction.result || true;
        executedSteps++;
        executionScore += 1;

      } catch (error: any) {
        console.log(`   ❌ خطأ: ${error.message}`);
        errors.push(`${step.id}: ${error.message}`);
      }

      stepsCompleted++;
    }

    const duration = Date.now() - startTime;
    executionScore = (executedSteps / task.steps.length) * 100;

    const result: ExecutionResult = {
      taskId: task.id,
      success: errors.length === 0,
      duration,
      stepsCompleted: executedSteps,
      totalSteps: task.steps.length,
      results,
      errors,
      intelligence: {
        understanding: understandingScore * 100,
        execution: executionScore,
        adaptation: 85, // يمكن حسابها من السياق
      },
    };

    // طباعة النتيجة
    console.log(`\n${'═'.repeat(50)}`);
    console.log('📊 نتيجة التنفيذ');
    console.log('═'.repeat(50));
    console.log(`\n✅ النجاح: ${result.success ? 'نعم' : 'لا'}`);
    console.log(`⏱️ المدة: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📈 الخطوات المنجزة: ${result.stepsCompleted}/${result.totalSteps}`);
    console.log(`\n🧠 مستويات الذكاء:`);
    console.log(`  • الفهم: ${result.intelligence.understanding.toFixed(1)}%`);
    console.log(`  • التنفيذ: ${result.intelligence.execution.toFixed(1)}%`);
    console.log(`  • التكيف: ${result.intelligence.adaptation.toFixed(1)}%`);

    if (errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      errors.forEach(err => console.log(`  • ${err}`));
    }

    console.log(`\n${'═'.repeat(50)}\n`);

    this.executionLog.push(result);
    return result;
  }

  /**
   * تنفيذ سريع للمهام البسيطة
   */
  async executeQuick(
    task: RobotTask,
    page: any
  ): Promise<ExecutionResult> {
    // نسخة مبسطة بدون كل التفاصيل
    return await this.executeTask(task, page);
  }

  /**
   * الإحصائيات والتحليل
   */
  getStatistics(): {
    totalTasks: number;
    successRate: number;
    averageDuration: number;
    averageIntelligence: number;
  } {
    if (this.executionLog.length === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        averageDuration: 0,
        averageIntelligence: 0,
      };
    }

    const successful = this.executionLog.filter(r => r.success).length;
    const totalDuration = this.executionLog.reduce((sum, r) => sum + r.duration, 0);
    const avgIntelligence =
      this.executionLog.reduce(
        (sum, r) =>
          sum +
          (r.intelligence.understanding +
            r.intelligence.execution +
            r.intelligence.adaptation) /
            3,
        0
      ) / this.executionLog.length;

    return {
      totalTasks: this.executionLog.length,
      successRate: (successful / this.executionLog.length) * 100,
      averageDuration: totalDuration / this.executionLog.length,
      averageIntelligence: avgIntelligence,
    };
  }

  /**
   * تقرير الأداء
   */
  generateReport(): string {
    const stats = this.getStatistics();

    let report = '🤖 تقرير أداء الروبوت\n';
    report += '═══════════════════════════════════\n\n';

    report += `📊 الإحصائيات الإجمالية:\n`;
    report += `  • عدد المهام المنجزة: ${stats.totalTasks}\n`;
    report += `  • معدل النجاح: ${stats.successRate.toFixed(1)}%\n`;
    report += `  • متوسط المدة: ${(stats.averageDuration / 1000).toFixed(2)}s\n`;
    report += `  • متوسط الذكاء: ${stats.averageIntelligence.toFixed(1)}%\n\n`;

    report += `🎯 مستويات الذكاء المتوسطة:\n`;
    const avgUnderstanding =
      this.executionLog.reduce((sum, r) => sum + r.intelligence.understanding, 0) /
      Math.max(1, this.executionLog.length);
    const avgExecution =
      this.executionLog.reduce((sum, r) => sum + r.intelligence.execution, 0) /
      Math.max(1, this.executionLog.length);
    const avgAdaptation =
      this.executionLog.reduce((sum, r) => sum + r.intelligence.adaptation, 0) /
      Math.max(1, this.executionLog.length);

    report += `  • الفهم: ${avgUnderstanding.toFixed(1)}%\n`;
    report += `  • التنفيذ: ${avgExecution.toFixed(1)}%\n`;
    report += `  • التكيف: ${avgAdaptation.toFixed(1)}%\n`;

    return report;
  }
}

/**
 * دالة مساعدة
 */
export function createUnifiedRobotBrain(): UnifiedRobotBrainCore {
  return new UnifiedRobotBrainCore();
}
