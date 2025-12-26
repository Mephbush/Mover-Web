/**
 * مجموعة اختبارات وقياس الأداء
 * Selector Benchmark Suite
 *
 * يقيس أداء نظام اختيار المحددات عبر عينات متعددة
 * ويوفر توصيات للتحسين
 */

import { SmartSelectorOrchestrator, SelectorSelectionResult, ExecutionResult } from './smart-selector-orchestrator';
import { AdvancedSelectorIntelligence } from './advanced-selector-intelligence';
import { AdaptiveWeightScorer, SelectorPerformanceData } from './adaptive-weight-scorer';

export interface TestCase {
  name: string;
  domain: string;
  url: string;
  taskType: string;
  elementType: string;
  elementText?: string;
  expectedSelectors?: string[];
}

export interface BenchmarkResult {
  testCaseName: string;
  domain: string;
  success: boolean;
  selectedSelector: string;
  executionTime: number;
  attemptsUsed: number;
  confidence: number;
  selectorType: string;
  recoveryUsed: boolean;
}

export interface BenchmarkSummary {
  totalTests: number;
  passedTests: number;
  successRate: number;
  averageExecutionTime: number;
  averageAttemptsPerTest: number;
  recoveryUsageRate: number;
  domainStats: {
    [domain: string]: {
      testCount: number;
      successCount: number;
      successRate: number;
      averageTime: number;
      bestSelectorType: string;
      worstSelectorType: string;
    };
  };
  recommendations: string[];
}

/**
 * مجموعة قياس الأداء
 */
export class SelectorBenchmarkSuite {
  private orchestrator: SmartSelectorOrchestrator;
  private selectorIntelligence: AdvancedSelectorIntelligence;
  private adaptiveScorer: AdaptiveWeightScorer;
  private testResults: BenchmarkResult[] = [];

  constructor(
    orchestrator?: SmartSelectorOrchestrator,
    selectorIntelligence?: AdvancedSelectorIntelligence,
    adaptiveScorer?: AdaptiveWeightScorer
  ) {
    this.orchestrator = orchestrator || new SmartSelectorOrchestrator();
    this.selectorIntelligence = selectorIntelligence || new AdvancedSelectorIntelligence();
    this.adaptiveScorer = adaptiveScorer || new AdaptiveWeightScorer();
  }

  /**
   * تشغيل مجموعة اختبارات قياسية
   */
  async runBenchmark(testCases: TestCase[]): Promise<BenchmarkSummary> {
    console.log(`\n🧪 بدء قياس الأداء: ${testCases.length} حالة اختبار`);
    
    this.testResults = [];
    const startTime = Date.now();

    // تشغيل الاختبارات المتسلسلة
    for (const testCase of testCases) {
      try {
        await this.runTestCase(testCase);
      } catch (error: any) {
        console.error(`❌ خطأ في الاختبار: ${testCase.name}`, error.message);
      }
    }

    const totalTime = Date.now() - startTime;

    // حساب النتائج والتوصيات
    const summary = this.generateSummary(this.testResults);

    console.log(`\n✅ اكتمل قياس الأداء في ${totalTime}ms`);
    console.log(`📊 معدل النجاح الإجمالي: ${(summary.successRate * 100).toFixed(1)}%`);

    return summary;
  }

  /**
   * تشغيل حالة اختبار واحدة
   */
  private async runTestCase(testCase: TestCase): Promise<void> {
    console.log(`\n📍 الاختبار: ${testCase.name}`);

    // 1. اختيار أفضل مجموعة محددات
    const selectionStart = Date.now();
    
    const selectionResult = await this.orchestrator.selectOptimalSelectors(
      testCase.domain,
      testCase.taskType,
      testCase.elementType,
      testCase.elementText
    );

    const selectionTime = Date.now() - selectionStart;

    console.log(`   المحددات المختارة: ${selectionResult.selectedSelectors.slice(0, 2).join(', ')}`);
    console.log(`   معدل النجاح المتوقع: ${(selectionResult.estimatedSuccessRate * 100).toFixed(1)}%`);
    console.log(`   وقت الاختيار: ${selectionTime}ms`);

    // 2. محاكاة التنفيذ (في الواقع يكون مع متصفح حقيقي)
    const executionResult = await this.simulateExecution(
      selectionResult,
      testCase
    );

    // 3. تسجيل النتيجة
    const result: BenchmarkResult = {
      testCaseName: testCase.name,
      domain: testCase.domain,
      success: executionResult.success,
      selectedSelector: executionResult.selectedSelector,
      executionTime: executionResult.executionTime,
      attemptsUsed: executionResult.attemptsUsed,
      confidence: executionResult.confidence || 0,
      selectorType: this.extractSelectorType(executionResult.selectedSelector),
      recoveryUsed: executionResult.recoveryUsed,
    };

    this.testResults.push(result);

    // 4. تسجيل في نظام الأوزان المكيفة
    if (this.adaptiveScorer) {
      this.adaptiveScorer.recordPerformance({
        selector: executionResult.selectedSelector,
        domain: testCase.domain,
        success: executionResult.success,
        executionTime: executionResult.executionTime,
        confidence: result.confidence,
        timestamp: new Date(),
        selectorType: result.selectorType as any,
      });
    }

    // الإخراج
    if (executionResult.success) {
      console.log(`   ✅ نجاح - الوقت: ${executionResult.executionTime}ms`);
    } else {
      console.log(`   ❌ فشل - ${executionResult.learnings.join(', ')}`);
    }
  }

  /**
   * محاكاة التنفيذ (الواجهة مع المتصفح الحقيقي)
   */
  private async simulateExecution(
    selectionResult: SelectorSelectionResult,
    testCase: TestCase
  ): Promise<ExecutionResult> {
    // في التطبيق الفعلي، سيتم تمرير page من Playwright
    // هنا نحاكي النتيجة بناءً على معدل النجاح المتوقع

    const startTime = Date.now();

    // محاكاة: احتمالية النجاح = معدل النجاح المتوقع
    const success = Math.random() < selectionResult.estimatedSuccessRate;

    // محاكاة وقت التنفيذ
    const executionTime = selectionResult.executionPlan[0]?.timeout || 5000;
    const variance = Math.random() * 1000;
    const actualTime = Math.max(100, executionTime * 0.2 + variance);

    return {
      success,
      selectedSelector: selectionResult.selectedSelectors[0] || 'unknown',
      executionTime: Math.round(actualTime),
      attemptsUsed: success ? 1 : selectionResult.executionPlan.length,
      recoveryUsed: false,
      learnings: success ? ['محدد صالح'] : ['لم يتم العثور على العنصر'],
      confidence: success ? selectionResult.confidence : 0,
    };
  }

  /**
   * استخراج نوع المحدد من السلسلة
   */
  private extractSelectorType(selector: string): string {
    if (selector.startsWith('#')) return 'id';
    if (selector.startsWith('.')) return 'class';
    if (selector.includes('data-testid')) return 'data-testid';
    if (selector.includes('aria-label')) return 'aria-label';
    if (selector.startsWith('/')) return 'xpath';
    if (selector.includes('[')) return 'hybrid';
    return 'text';
  }

  /**
   * إنشاء ملخص النتائج والتوصيات
   */
  private generateSummary(results: BenchmarkResult[]): BenchmarkSummary {
    if (results.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        successRate: 0,
        averageExecutionTime: 0,
        averageAttemptsPerTest: 0,
        recoveryUsageRate: 0,
        domainStats: {},
        recommendations: ['لم يتم تشغيل أي اختبارات'],
      };
    }

    // الإحصائيات العامة
    const passedTests = results.filter(r => r.success).length;
    const successRate = passedTests / results.length;
    const averageTime = results.reduce((sum, r) => sum + r.executionTime, 0) /
      results.length;
    const averageAttempts = results.reduce((sum, r) => sum + r.attemptsUsed, 0) /
      results.length;
    const recoveryUsageRate = results.filter(r => r.recoveryUsed).length / results.length;

    // إحصائيات حسب الموقع
    const domainStats: { [domain: string]: any } = {};

    results.forEach((result) => {
      if (!domainStats[result.domain]) {
        domainStats[result.domain] = {
          testCount: 0,
          successCount: 0,
          successRate: 0,
          averageTime: 0,
          times: [],
          selectorTypes: {},
        };
      }

      const stats = domainStats[result.domain];
      stats.testCount++;
      if (result.success) stats.successCount++;
      stats.times.push(result.executionTime);

      if (!stats.selectorTypes[result.selectorType]) {
        stats.selectorTypes[result.selectorType] = { success: 0, total: 0 };
      }
      stats.selectorTypes[result.selectorType].total++;
      if (result.success) stats.selectorTypes[result.selectorType].success++;
    });

    // حساب المتوسطات والنسب
    Object.values(domainStats).forEach((stats: any) => {
      stats.successRate = stats.successCount / stats.testCount;
      stats.averageTime = stats.times.reduce((a: number, b: number) => a + b, 0) /
        stats.times.length;

      let best = 'unknown';
      let worst = 'unknown';
      let bestRate = -1;
      let worstRate = 2;

      Object.entries(stats.selectorTypes).forEach(([type, perf]: [string, any]) => {
        const rate = perf.success / perf.total;
        if (rate > bestRate) {
          bestRate = rate;
          best = type;
        }
        if (rate < worstRate) {
          worstRate = rate;
          worst = type;
        }
      });

      stats.bestSelectorType = best;
      stats.worstSelectorType = worst;

      delete stats.times;
      delete stats.selectorTypes;
    });

    // التوصيات
    const recommendations = this.generateRecommendations(
      successRate,
      averageTime,
      domainStats
    );

    return {
      totalTests: results.length,
      passedTests,
      successRate,
      averageExecutionTime: averageTime,
      averageAttemptsPerTest: averageAttempts,
      recoveryUsageRate,
      domainStats: domainStats as any,
      recommendations,
    };
  }

  /**
   * إنشاء توصيات للتحسين
   */
  private generateRecommendations(
    successRate: number,
    averageTime: number,
    domainStats: { [domain: string]: any }
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.7) {
      recommendations.push('⚠️ معدل النجاح منخفض - زيادة تنوع المحددات البديلة');
    }

    if (successRate < 0.5) {
      recommendations.push('🔴 معدل النجاح حرج - مراجعة استراتيجية اختيار المحددات');
    }

    if (averageTime > 3000) {
      recommendations.push('⏱️ وقت التنفيذ طويل - تحسين استراتيجية البحث السريع');
    }

    Object.entries(domainStats).forEach(([domain, stats]: [string, any]) => {
      if (stats.successRate < 0.5) {
        recommendations.push(`📍 معدل النجاح منخفض للموقع: ${domain}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ الأداء جيدة - استمر في مراقبة الأداء');
    }

    return recommendations;
  }

  /**
   * الحصول على النتائج الخام
   */
  getTestResults(): BenchmarkResult[] {
    return this.testResults;
  }

  /**
   * إعادة تعيين النتائج
   */
  clearResults(): void {
    this.testResults = [];
  }
}

/**
 * حالات اختبار قياسية
 */
export const STANDARD_TEST_CASES: TestCase[] = [
  {
    name: 'login-button',
    domain: 'example.com',
    url: 'https://example.com/login',
    taskType: 'click',
    elementType: 'button',
    elementText: 'تسجيل الدخول',
  },
  {
    name: 'email-input',
    domain: 'example.com',
    url: 'https://example.com/login',
    taskType: 'type',
    elementType: 'input',
    elementText: 'البريد الإلكتروني',
  },
  {
    name: 'password-input',
    domain: 'example.com',
    url: 'https://example.com/login',
    taskType: 'type',
    elementType: 'input',
    elementText: 'كلمة المرور',
  },
  {
    name: 'search-button',
    domain: 'search.example.com',
    url: 'https://search.example.com',
    taskType: 'click',
    elementType: 'button',
    elementText: 'بحث',
  },
  {
    name: 'navigation-link',
    domain: 'example.com',
    url: 'https://example.com',
    taskType: 'click',
    elementType: 'link',
    elementText: 'الرئيسية',
  },
];
