/**
 * فهرس النظام الموحد لدماغ الروبوت الذكي
 * Main Robot Brain System Index
 * 
 * جميع الأنظمة والدوال في مكان واحد
 */

// ===== الأنظمة الأساسية =====

export {
  AdvancedRobotBrainLogic,
  RobotUnderstanding,
  PageAnalysis,
  ElementAnalysis,
} from './advanced-robot-logic';

export {
  LightningFastDiscoverySystem,
  FastFindResult,
} from './lightning-fast-discovery';

export {
  SmartElementHandler,
  ElementInteraction,
  SmartInteractionOptions,
} from './smart-element-handler';

export {
  UltraIntelligentSelectorSystem,
  SelectorIntelligence,
} from './ultra-intelligent-selector-system';

export {
  HighPerformanceOptimizer,
  PerformanceOptimization,
} from './high-performance-optimizer';

// ===== النظام المتكامل =====

export {
  UnifiedRobotBrainCore,
  RobotTask,
  TaskStep,
  ExecutionResult,
  createUnifiedRobotBrain,
} from './unified-robot-brain-core';

// ===== التصدير الموحد =====

export {
  RobotBrainSystem,
  RobotTools,
  RobotExamples,
  RobotHelpers,
  QuickStart,
  createRobotBrain,
} from './robot-brain-exports';

// ===== دوال مساعدة سريعة =====

import { createRobotBrain, RobotTools, RobotHelpers, QuickStart } from './robot-brain-exports';

/**
 * إنشاء نظام روبوت كامل (الطريقة الموصى بها)
 */
export const createRobot = () => createRobotBrain();

/**
 * الوصول السريع للأدوات
 */
export const robot = {
  // الأدوات
  tools: RobotTools,

  // الدوال المساعدة
  helpers: RobotHelpers,

  // الاستخدام السريع
  quick: QuickStart,

  // إنشاء نظام كامل
  create: createRobotBrain,
};

/**
 * مثال على الاستخدام:
 * 
 * // طريقة 1: الاستخدام السريع
 * const result = await robot.quick.find(page, { id: 'button' });
 * 
 * // طريقة 2: استخدام الأدوات
 * const finder = robot.tools.finder;
 * const result = await finder.findElementLightning(page, query);
 * 
 * // طريقة 3: نظام كامل
 * const brain = robot.create();
 * const result = await brain.run(task, page);
 * 
 * // طريقة 4: استيراد مباشر
 * import { createRobotBrain } from '@/utils/ai-brain/index-robot-brain';
 * const brain = createRobotBrain();
 */
