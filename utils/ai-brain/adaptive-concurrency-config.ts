/**
 * نظام التكوين التكيفي للمعالجة المتزامنة والمهلات الزمنية
 * Adaptive Concurrency and Timeout Configuration System
 * 
 * قابل للتوازي والمهلات الزمنية بناءً على الأداء الفعلي
 */

export interface TimeoutConfig {
  selectorSearch: number;
  elementInteraction: number;
  pageLoad: number;
  defaultTimeout: number;
  retryDelay: number;
  maxRetries: number;
}

export interface ConcurrencyConfig {
  maxConcurrent: number;
  maxParallel: number;
  batchSize: number;
  delayBetweenBatches: number;
}

export interface PerformanceMetrics {
  averagePageLoadTime: number;
  averageSearchTime: number;
  averageInteractionTime: number;
  errorRate: number;
  successRate: number;
  lastUpdated: Date;
}

export interface AdaptiveConfig {
  timeout: TimeoutConfig;
  concurrency: ConcurrencyConfig;
  metrics: PerformanceMetrics;
  domain: string;
  adaptive: boolean;
  lastCalibrated: Date;
}

/**
 * مدير التكوين التكيفي
 */
export class AdaptiveConcurrencyManager {
  private configs: Map<string, AdaptiveConfig> = new Map();
  private globalConfig: AdaptiveConfig;
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private readonly maxHistorySize = 100;

  constructor() {
    // Initialize global default config
    this.globalConfig = this.createDefaultConfig('global');
  }

  /**
   * الحصول على التكوين لموقع معين
   */
  getConfig(domain?: string): AdaptiveConfig {
    if (!domain) {
      return this.globalConfig;
    }

    if (!this.configs.has(domain)) {
      this.configs.set(domain, this.createDefaultConfig(domain));
    }

    return this.configs.get(domain)!;
  }

  /**
   * تحديث التكوين بناءً على مقاييس الأداء
   */
  updateMetricsAndCalibrateConfig(
    domain: string,
    pageLoadTime: number,
    searchTime: number,
    interactionTime: number,
    success: boolean
  ): void {
    const config = this.getConfig(domain);

    // Update metrics
    config.metrics = this.calculateAggregatedMetrics(
      domain,
      pageLoadTime,
      searchTime,
      interactionTime,
      success
    );

    // Calibrate config if adaptive mode is enabled
    if (config.adaptive) {
      this.calibrateConfig(config);
    }
  }

  /**
   * معايرة التكوين بناءً على مقاييس الأداء
   */
  private calibrateConfig(config: AdaptiveConfig): void {
    const metrics = config.metrics;

    // Adjust timeouts based on average times
    const pageLoadFactor = Math.max(metrics.averagePageLoadTime / 5000, 0.5);
    const searchFactor = Math.max(metrics.averageSearchTime / 3000, 0.5);

    config.timeout.selectorSearch = Math.round(
      config.timeout.selectorSearch * Math.min(searchFactor, 1.5)
    );
    config.timeout.elementInteraction = Math.round(
      config.timeout.elementInteraction * Math.min(pageLoadFactor, 1.3)
    );
    config.timeout.pageLoad = Math.round(
      config.timeout.pageLoad * Math.min(pageLoadFactor * 1.2, 1.5)
    );

    // Adjust concurrency based on success rate
    if (metrics.successRate > 0.95) {
      // Increase concurrency if success rate is high
      config.concurrency.maxConcurrent = Math.min(
        config.concurrency.maxConcurrent + 2,
        16
      );
    } else if (metrics.successRate < 0.7) {
      // Decrease concurrency if success rate is low
      config.concurrency.maxConcurrent = Math.max(
        config.concurrency.maxConcurrent - 1,
        2
      );
    }

    // Adjust batch size based on error rate
    if (metrics.errorRate > 0.2) {
      config.concurrency.batchSize = Math.max(config.concurrency.batchSize - 1, 1);
      config.concurrency.delayBetweenBatches = Math.min(
        config.concurrency.delayBetweenBatches + 50,
        500
      );
    }

    config.lastCalibrated = new Date();
  }

  /**
   * حساب المقاييس المجمعة
   */
  private calculateAggregatedMetrics(
    domain: string,
    pageLoadTime: number,
    searchTime: number,
    interactionTime: number,
    success: boolean
  ): PerformanceMetrics {
    let history = this.performanceHistory.get(domain) || [];

    // Add new measurement
    const newMetrics: PerformanceMetrics = {
      averagePageLoadTime: pageLoadTime,
      averageSearchTime: searchTime,
      averageInteractionTime: interactionTime,
      errorRate: success ? 0 : 1,
      successRate: success ? 1 : 0,
      lastUpdated: new Date(),
    };

    history.push(newMetrics);

    // Keep only the last N measurements
    if (history.length > this.maxHistorySize) {
      history = history.slice(-this.maxHistorySize);
    }

    this.performanceHistory.set(domain, history);

    // Calculate aggregated metrics
    if (history.length === 0) {
      return newMetrics;
    }

    const avgPageLoadTime = history.reduce((sum, m) => sum + m.averagePageLoadTime, 0) / history.length;
    const avgSearchTime = history.reduce((sum, m) => sum + m.averageSearchTime, 0) / history.length;
    const avgInteractionTime = history.reduce((sum, m) => sum + m.averageInteractionTime, 0) / history.length;
    const errorRate = history.reduce((sum, m) => sum + m.errorRate, 0) / history.length;
    const successRate = 1 - errorRate;

    return {
      averagePageLoadTime: avgPageLoadTime,
      averageSearchTime: avgSearchTime,
      averageInteractionTime: avgInteractionTime,
      errorRate,
      successRate,
      lastUpdated: new Date(),
    };
  }

  /**
   * إنشء تكوين افتراضي
   */
  private createDefaultConfig(domain: string): AdaptiveConfig {
    return {
      domain,
      timeout: {
        selectorSearch: 5000,
        elementInteraction: 3000,
        pageLoad: 10000,
        defaultTimeout: 30000,
        retryDelay: 500,
        maxRetries: 3,
      },
      concurrency: {
        maxConcurrent: 8,
        maxParallel: 5,
        batchSize: 3,
        delayBetweenBatches: 100,
      },
      metrics: {
        averagePageLoadTime: 5000,
        averageSearchTime: 2000,
        averageInteractionTime: 1000,
        errorRate: 0.1,
        successRate: 0.9,
        lastUpdated: new Date(),
      },
      adaptive: true,
      lastCalibrated: new Date(),
    };
  }

  /**
   * تعيين تكوين مخصص
   */
  setConfig(domain: string, customConfig: Partial<AdaptiveConfig>): void {
    const config = this.getConfig(domain);

    if (customConfig.timeout) {
      config.timeout = { ...config.timeout, ...customConfig.timeout };
    }

    if (customConfig.concurrency) {
      config.concurrency = { ...config.concurrency, ...customConfig.concurrency };
    }

    if (customConfig.adaptive !== undefined) {
      config.adaptive = customConfig.adaptive;
    }

    this.configs.set(domain, config);
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getPerformanceStats(domain: string): PerformanceMetrics | null {
    const history = this.performanceHistory.get(domain);
    if (!history || history.length === 0) {
      return null;
    }

    const lastMeasurement = history[history.length - 1];
    return lastMeasurement;
  }

  /**
   * إعادة تعيين التكوين للقيم الافتراضية
   */
  resetConfig(domain?: string): void {
    if (domain) {
      this.configs.set(domain, this.createDefaultConfig(domain));
      this.performanceHistory.delete(domain);
    } else {
      this.configs.clear();
      this.performanceHistory.clear();
      this.globalConfig = this.createDefaultConfig('global');
    }
  }

  /**
   * الحصول على تقرير التكوين
   */
  generateReport(domain?: string): string {
    const config = this.getConfig(domain);
    const metrics = config.metrics;

    return `
🤖 Configuration Report: ${config.domain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Timeout Configuration:
  • Selector Search: ${config.timeout.selectorSearch}ms
  • Element Interaction: ${config.timeout.elementInteraction}ms
  • Page Load: ${config.timeout.pageLoad}ms
  • Default: ${config.timeout.defaultTimeout}ms
  • Retry Delay: ${config.timeout.retryDelay}ms
  • Max Retries: ${config.timeout.maxRetries}

⚙️ Concurrency Configuration:
  • Max Concurrent: ${config.concurrency.maxConcurrent}
  • Max Parallel: ${config.concurrency.maxParallel}
  • Batch Size: ${config.concurrency.batchSize}
  • Delay Between Batches: ${config.concurrency.delayBetweenBatches}ms

📊 Performance Metrics:
  • Avg Page Load: ${metrics.averagePageLoadTime.toFixed(0)}ms
  • Avg Search Time: ${metrics.averageSearchTime.toFixed(0)}ms
  • Avg Interaction: ${metrics.averageInteractionTime.toFixed(0)}ms
  • Success Rate: ${(metrics.successRate * 100).toFixed(1)}%
  • Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%
  • Last Updated: ${metrics.lastUpdated.toISOString()}

🔧 Adaptive Mode: ${config.adaptive ? '✅ ENABLED' : '❌ DISABLED'}
🔄 Last Calibrated: ${config.lastCalibrated.toISOString()}
    `;
  }
}

/**
 * Create and export singleton instance
 */
let managerInstance: AdaptiveConcurrencyManager | null = null;

export function getAdaptiveConcurrencyManager(): AdaptiveConcurrencyManager {
  if (!managerInstance) {
    managerInstance = new AdaptiveConcurrencyManager();
  }
  return managerInstance;
}
