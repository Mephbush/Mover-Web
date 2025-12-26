/**
 * تصدير موحد لجميع أنظمة الروبوت الذكي
 * Unified Robot Brain System Exports
 * 
 * سهولة استخدام جميع الأنظمة من مكان واحد
 */

import { AdvancedRobotBrainLogic } from './advanced-robot-logic';
import { LightningFastDiscoverySystem } from './lightning-fast-discovery';
import { SmartElementHandler } from './smart-element-handler';
import { UltraIntelligentSelectorSystem } from './ultra-intelligent-selector-system';
import { HighPerformanceOptimizer } from './high-performance-optimizer';
import {
  UnifiedRobotBrainCore,
  RobotTask,
  ExecutionResult,
} from './unified-robot-brain-core';

/**
 * واجهة موحدة شاملة للروبوت الذكي
 */
export class RobotBrainSystem {
  private unified: UnifiedRobotBrainCore;

  constructor() {
    this.unified = new UnifiedRobotBrainCore();
  }

  /**
   * تنفيذ مهمة بكاملها
   */
  async run(task: RobotTask, page: any): Promise<ExecutionResult> {
    return await this.unified.executeTask(task, page);
  }

  /**
   * تنفيذ سريع
   */
  async quick(task: RobotTask, page: any): Promise<ExecutionResult> {
    return await this.unified.executeQuick(task, page);
  }

  /**
   * الحصول على الإحصائيات
   */
  stats() {
    return this.unified.getStatistics();
  }

  /**
   * طباعة التقرير
   */
  report(): string {
    return this.unified.generateReport();
  }
}

/**
 * المستشعرات والأدوات
 */
export const RobotTools = {
  /**
   * نظام البحث السريع
   */
  finder: new LightningFastDiscoverySystem(),

  /**
   * معالج العناصر الذكي
   */
  handler: new SmartElementHandler(),

  /**
   * محسّن الأداء
   */
  optimizer: new HighPerformanceOptimizer(),

  /**
   * نظام اختيار المحددات الذكي
   */
  selector: new UltraIntelligentSelectorSystem(),

  /**
   * منطق الروبوت المتقدم
   */
  logic: new AdvancedRobotBrainLogic(),
};

/**
 * أمثلة سريعة للاستخدام
 */
export const RobotExamples = {
  /**
   * مثال: تسجيل الدخول
   */
  login: (email: string, password: string): RobotTask => ({
    id: 'login_task',
    type: 'login',
    url: 'https://example.com/login',
    steps: [
      {
        id: 'fill_email',
        action: 'fill',
        selector: 'input[type="email"]',
        value: email,
      },
      {
        id: 'fill_password',
        action: 'fill',
        selector: 'input[type="password"]',
        value: password,
      },
      {
        id: 'click_submit',
        action: 'click',
        selector: 'button[type="submit"]',
      },
    ],
  }),

  /**
   * مثال: البحث
   */
  search: (query: string): RobotTask => ({
    id: 'search_task',
    type: 'custom',
    url: 'https://example.com/search',
    steps: [
      {
        id: 'fill_search',
        action: 'fill',
        selector: 'input[placeholder*="search"]',
        value: query,
      },
      {
        id: 'submit_search',
        action: 'click',
        selector: 'button[type="submit"]',
      },
      {
        id: 'extract_results',
        action: 'extract',
        selector: '.search-result',
      },
    ],
  }),

  /**
   * مثال: ملء نموذج
   */
  form: (data: Record<string, string>): RobotTask => ({
    id: 'form_task',
    type: 'form',
    url: 'https://example.com/form',
    steps: Object.entries(data).map(([key, value], index) => ({
      id: `fill_${key}`,
      action: 'fill',
      selector: `input[name="${key}"]`,
      value,
    })),
  }),

  /**
   * مثال: الاستخراج
   */
  scrape: (selector: string): RobotTask => ({
    id: 'scrape_task',
    type: 'scraping',
    url: 'https://example.com',
    steps: [
      {
        id: 'extract_data',
        action: 'extract',
        selector,
      },
    ],
  }),
};

/**
 * دوال مساعدة سريعة
 */
export const RobotHelpers = {
  /**
   * البحث السريع عن عنصر
   */
  async findElement(page: any, query: any) {
    return await RobotTools.finder.findElementLightning(page, query);
  },

  /**
   * النقر الذكي
   */
  async click(element: any, page: any, options?: any) {
    return await RobotTools.handler.smartClick(element, page, {
      humanLike: true,
      scrollIntoView: true,
      ...options,
    });
  },

  /**
   * الملء الذكي
   */
  async fill(element: any, page: any, value: string, options?: any) {
    return await RobotTools.handler.smartFill(element, page, value, {
      humanLike: true,
      scrollIntoView: true,
      ...options,
    });
  },

  /**
   * الاستخراج الذكي
   */
  async extract(element: any) {
    return await RobotTools.handler.smartExtract(element, 'text');
  },

  /**
   * فهم الصفحة
   */
  async understand(task: string, page: any) {
    return await RobotTools.logic.understand(task, page);
  },

  /**
   * تقرير الأداء
   */
  report() {
    return RobotTools.optimizer.generatePerformanceReport();
  },
};

/**
 * إنشاء نظام روبوت كامل
 */
export function createRobotBrain(): RobotBrainSystem {
  return new RobotBrainSystem();
}

/**
 * استخدام سريع جداً
 */
export const QuickStart = {
  /**
   * البحث السريع
   */
  find: (page: any, query: any) => RobotTools.finder.findElementLightning(page, query),

  /**
   * النقر
   */
  click: (element: any, page: any) => RobotTools.handler.smartClick(element, page),

  /**
   * الملء
   */
  type: (element: any, page: any, value: string) =>
    RobotTools.handler.smartFill(element, page, value),

  /**
   * استخراج
   */
  get: (element: any) => RobotTools.handler.smartExtract(element),

  /**
   * فهم
   */
  understand: (task: string, page: any) => RobotTools.logic.understand(task, page),
};

// التصدير الكامل
export {
  AdvancedRobotBrainLogic,
  LightningFastDiscoverySystem,
  SmartElementHandler,
  UltraIntelligentSelectorSystem,
  HighPerformanceOptimizer,
  UnifiedRobotBrainCore,
  RobotTask,
  ExecutionResult,
};
