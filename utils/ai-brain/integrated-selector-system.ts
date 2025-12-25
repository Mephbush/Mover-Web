/**
 * نظام المحددات المتكامل
 * Integrated Selector System - نظام متكامل وشامل للعثور على العناصر
 * 
 * يجمع:
 * 1. الاختيار الذكي للمحددات
 * 2. التعلم المتقدم من التجارب
 * 3. استراتيجيات الاسترجاع
 * 4. مراقبة الأداء
 */

import { EnhancedSelectorIntelligence, SelectorEvaluation } from './enhanced-selector-system';
import { SelectorLearningEngine, SelectorLearningRecord } from './selector-learning-system';
import { EnhancedErrorRecoveryEngine, RecoveryContext } from './enhanced-error-recovery';
import { SelectorPerformanceDashboard } from './selector-performance-dashboard';

export interface IntegratedSelectorOptions {
  domain: string;
  elementType: string;
  elementText?: string;
  pageStructure?: string;
  forceNewSelector?: boolean;
}

export interface SelectorFindingResult {
  success: boolean;
  selector: string;
  foundElements: number;
  confidence: number;
  executionTime: number;
  strategy: string;
  alternatives: string[];
  metadata: {
    attempts: number;
    recovered: boolean;
    recovery?: {
      strategy: string;
      success: boolean;
    };
  };
}

/**
 * نظام البحث المتكامل
 */
export class IntegratedSelectorSystem {
  private selectorIntelligence: EnhancedSelectorIntelligence;
  private learningEngine: SelectorLearningEngine;
  private errorRecovery: EnhancedErrorRecoveryEngine;
  private performanceDashboard: SelectorPerformanceDashboard;
  private attemptHistory: Map<string, number> = new Map();

  constructor() {
    this.selectorIntelligence = new EnhancedSelectorIntelligence();
    this.learningEngine = new SelectorLearningEngine();
    this.errorRecovery = new EnhancedErrorRecoveryEngine();
    this.performanceDashboard = new SelectorPerformanceDashboard();
  }

  /**
   * البحث الذكي عن محدد
   */
  async smartFindSelector(
    selectors: string[],
    options: IntegratedSelectorOptions
  ): Promise<SelectorFindingResult> {
    const startTime = Date.now();
    const attempts: any[] = [];
    let bestSelector: string | null = null;
    let foundElements = 0;
    let recovered = false;
    let recoveryInfo: any = null;

    try {
      // الخطوة 1: اختيار أفضل محدد بناءً على التعلم السابق
      const learnedSelectors = this.learningEngine.getBestStrategyForElementType(
        options.domain,
        options.elementType
      );

      const combinedSelectors = [
        ...new Set([...learnedSelectors, ...selectors]),
      ];

      // الخطوة 2: محاولة كل محدد
      for (const selector of combinedSelectors) {
        const evaluation = this.selectorIntelligence.evaluateSelector(
          selector,
          options.pageStructure || '',
          foundElements
        );

        if (evaluation.quality > 70 && foundElements === 1) {
          bestSelector = selector;
          this.selectorIntelligence.recordSelectorUsage(
            selector,
            true,
            Date.now() - startTime,
            foundElements
          );

          attempts.push({
            selector,
            success: true,
            quality: evaluation.quality,
          });

          break;
        }

        attempts.push({
          selector,
          success: false,
          quality: evaluation.quality,
        });
      }

      // الخطوة 3: إذا فشل البحث، استخدم استراتيجيات الاسترجاع
      if (!bestSelector && attempts.length > 0) {
        const recoveryContext: RecoveryContext = {
          originalSelector: combinedSelectors[0],
          domain: options.domain,
          elementType: options.elementType,
          elementText: options.elementText,
          pageStructure: options.pageStructure,
          previousAttempts: attempts.map((a) => ({
            strategy: 'attempt',
            selector: a.selector,
            success: a.success,
            executionTime: Date.now() - startTime,
            foundElements: 0,
            confidence: a.quality / 100,
          })),
        };

        const recoveryAttempt = await this.errorRecovery.executeRecovery(recoveryContext);

        if (recoveryAttempt && recoveryAttempt.success) {
          bestSelector = recoveryAttempt.selector;
          recovered = true;
          recoveryInfo = {
            strategy: recoveryAttempt.strategy,
            success: true,
          };

          this.selectorIntelligence.recordSelectorUsage(
            bestSelector,
            true,
            recoveryAttempt.executionTime,
            1
          );
        }
      }

      // الخطوة 4: تسجيل التجربة للتعلم
      if (bestSelector) {
        const executionTime = Date.now() - startTime;

        const learningRecord: SelectorLearningRecord = {
          id: `${options.domain}_${Date.now()}`,
          selector: bestSelector,
          domain: options.domain,
          pageStructure: options.pageStructure || 'unknown',
          targetElement: options.elementType,
          success: true,
          confidence: 0.85,
          executionTime,
          context: {
            pageUrl: options.domain,
            pageTitle: options.domain,
            timestamp: new Date(),
            elementType: options.elementType,
            elementText: options.elementText,
            elementClasses: [],
            elementAttributes: {},
          },
          metadata: {
            selectorComplexity: this.calculateSelectorComplexity(bestSelector),
            foundElements: 1,
            matchingScore: 90,
          },
        };

        this.learningEngine.recordLearningExperience(learningRecord);

        // تعلم الاستراتيجية الناجحة
        this.selectorIntelligence.learnSelectionStrategy(
          options.domain,
          [bestSelector],
          true,
          0.85
        );

        return {
          success: true,
          selector: bestSelector,
          foundElements: 1,
          confidence: 0.85,
          executionTime,
          strategy: recovered ? 'recovery' : 'intelligent',
          alternatives: this.selectorIntelligence.generateAlternativeSelectors(
            bestSelector,
            1
          ),
          metadata: {
            attempts: attempts.length,
            recovered,
            recovery: recoveryInfo,
          },
        };
      }

      // فشل البحث
      return {
        success: false,
        selector: '',
        foundElements: 0,
        confidence: 0,
        executionTime: Date.now() - startTime,
        strategy: 'failed',
        alternatives: [],
        metadata: {
          attempts: attempts.length,
          recovered: false,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        selector: '',
        foundElements: 0,
        confidence: 0,
        executionTime: Date.now() - startTime,
        strategy: 'error',
        alternatives: [],
        metadata: {
          attempts: 0,
          recovered: false,
        },
      };
    }
  }

  /**
   * حساب تعقيد المحدد
   */
  private calculateSelectorComplexity(selector: string): number {
    let complexity = 0;
    complexity += (selector.match(/ /g) || []).length * 10;
    complexity += (selector.match(/\[/g) || []).length * 5;
    complexity += (selector.match(/>/g) || []).length * 8;
    complexity += (selector.match(/:/g) || []).length * 3;
    complexity += Math.floor(selector.length / 20);
    return Math.min(100, complexity);
  }

  /**
   * تقييم عام للمحدد
   */
  evaluateSelectorQuality(selector: string): SelectorEvaluation {
    return this.selectorIntelligence.evaluateSelector(selector, '', 1);
  }

  /**
   * الحصول على توصيات التحسين
   */
  getImprovementRecommendations(): string[] {
    return this.performanceDashboard.generateImprovementRecommendations();
  }

  /**
   * الحصول على تقرير الأداء الشامل
   */
  getComprehensiveReport(): any {
    const selectorMetrics = this.selectorIntelligence.getPerformanceReport();
    const learningInsights = this.learningEngine.getLearningInsights();
    const recoveryReport = this.errorRecovery.getPerformanceReport();
    const performanceSummary = this.performanceDashboard.getSummary();

    return {
      selector: selectorMetrics,
      learning: learningInsights,
      recovery: recoveryReport,
      performance: performanceSummary,
      generatedAt: new Date(),
    };
  }

  /**
   * تقرير مفصل شامل
   */
  generateFullReport(): string {
    let report = `🤖 تقرير نظام المحددات المتكامل\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `📊 البحث والاختيار الذكي\n`;
    report += `${'-'.repeat(50)}\n`;
    const selectorMetrics = this.selectorIntelligence.getPerformanceReport();
    report += `• إجمالي المحددات المتعلمة: ${selectorMetrics.totalSelectors}\n`;
    report += `• متوسط معدل النجاح: ${selectorMetrics.averageSuccessRate}%\n`;
    report += `• متوسط الموثوقية: ${selectorMetrics.averageReliability}%\n\n`;

    report += `🎓 التعلم المتقدم\n`;
    report += `${'-'.repeat(50)}\n`;
    const learningInsights = this.learningEngine.getLearningInsights();
    report += `• إجمالي التجارب: ${learningInsights.totalExperiences}\n`;
    report += `• معدل النجاح الإجمالي: ${learningInsights.overallSuccessRate}%\n`;
    report += `• عدد المجالات: ${learningInsights.totalDomains}\n`;
    report += `• الأنماط المتعلمة: ${learningInsights.totalPatterns}\n\n`;

    report += `🔧 استراتيجيات الاسترجاع\n`;
    report += `${'-'.repeat(50)}\n`;
    const recoveryReport = this.errorRecovery.getPerformanceReport();
    report += `• إجمالي محاولات الاسترجاع: ${recoveryReport.totalAttempts}\n`;
    report += `• الاسترجاعات الناجحة: ${recoveryReport.successfulRecoveries}\n`;
    report += `• الاسترجاعات الفاشلة: ${recoveryReport.failedRecoveries}\n`;
    report += `• متوسط وقت التنفيذ: ${recoveryReport.averageExecutionTime}ms\n\n`;

    report += `📈 صحة النظام\n`;
    report += `${'-'.repeat(50)}\n`;
    const summary = this.performanceDashboard.getSummary();
    report += `• درجة الصحة: ${summary.healthScore}/100 ${summary.status}\n`;
    report += `• عدد التنبيهات: ${summary.alertCount}\n`;
    report += `• تنبيهات حرجة: ${summary.criticalAlerts}\n\n`;

    report += `💡 التوصيات\n`;
    report += `${'-'.repeat(50)}\n`;
    summary.recommendations.forEach((rec: string, idx: number) => {
      report += `${idx + 1}. ${rec}\n`;
    });

    report += `\n${'='.repeat(50)}\n`;
    report += `آخر تحديث: ${new Date().toLocaleString('ar-SA')}\n`;

    return report;
  }

  /**
   * إعادة تدريب النظام
   */
  retrainSystem(trainingData: any[]): any {
    const startTime = Date.now();

    // إضافة بيانات التدريب
    for (const data of trainingData) {
      this.learningEngine.recordLearningExperience(data);
    }

    const trainingTime = Date.now() - startTime;

    return {
      success: true,
      recordsProcessed: trainingData.length,
      trainingTime,
      message: `تم إعادة تدريب النظام بـ ${trainingData.length} تجربة في ${trainingTime}ms`,
    };
  }

  /**
   * الحصول على حالة النظام
   */
  getSystemStatus(): any {
    const summary = this.performanceDashboard.getSummary();
    const report = this.getComprehensiveReport();

    return {
      operational: summary.healthScore > 50,
      healthScore: summary.healthScore,
      status: summary.status,
      totalSelectors: summary.totalSelectors,
      successRate: summary.successRate,
      failureRate: summary.failureRate,
      alerts: this.performanceDashboard.getAlerts(),
      recommendations: summary.recommendations,
      fullReport: report,
    };
  }

  /**
   * تحديث قاعدة المعرفة
   */
  updateKnowledgeBase(domain: string, successfulSelectors: string[]): void {
    this.selectorIntelligence.learnSelectionStrategy(
      domain,
      successfulSelectors,
      true,
      0.9
    );
  }

  /**
   * تصدير النموذج المتعلم
   */
  exportLearnedModel(): any {
    const domains: Map<string, any> = new Map();

    // جمع معرفة كل مجال
    return {
      timestamp: new Date(),
      selectorMetrics: this.selectorIntelligence.getMetrics(),
      learningInsights: this.learningEngine.getLearningInsights(),
      recoveryStats: this.errorRecovery.getPerformanceReport(),
    };
  }

  /**
   * إعادة تعيين كامل
   */
  reset(): void {
    this.selectorIntelligence.reset();
    this.learningEngine.reset();
    this.errorRecovery.reset();
    this.performanceDashboard.reset();
    this.attemptHistory.clear();
  }
}

// تصدير مثيل فردي
export const integratedSelectorSystem = new IntegratedSelectorSystem();
