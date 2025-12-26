/**
 * نظام تسجيل الأخطاء والقياس
 * Error Logging and Telemetry System
 * 
 * تتبع منظم للأخطاء والمشاكل لتحسين الأداء
 */

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  SELECTOR_NOT_FOUND = 'selector_not_found',
  ELEMENT_NOT_VISIBLE = 'element_not_visible',
  ELEMENT_NOT_INTERACTABLE = 'element_not_interactable',
  TIMEOUT = 'timeout',
  VALIDATION_FAILED = 'validation_failed',
  IFRAME_ACCESS = 'iframe_access',
  SHADOW_DOM = 'shadow_dom',
  PAGE_STRUCTURE = 'page_structure',
  XPATH_ERROR = 'xpath_error',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context: {
    selector?: string;
    elementType?: string;
    website?: string;
    taskType?: string;
    action?: string;
    pageUrl?: string;
    timestamp: Date;
    userAgent?: string;
  };
  metadata: {
    attemptCount?: number;
    retryCount?: number;
    timeoutMs?: number;
    executionTimeMs?: number;
    stackTrace?: string;
    customData?: Record<string, any>;
  };
}

export interface TelemetryMetric {
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: Date;
  context: Record<string, any>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Map<string, number>;
  errorsBySeverity: Map<ErrorSeverity, number>;
  recentErrors: ErrorContext[];
  recoveryStats: {
    recoveredErrors: number;
    failedRecoveries: number;
    recoveryRate: number;
  };
}

/**
 * نظام تسجيل الأخطاء المركزي
 */
export class ErrorTelemetrySystem {
  private static instance: ErrorTelemetrySystem;
  private errorLog: ErrorContext[] = [];
  private telemetryMetrics: TelemetryMetric[] = [];
  private readonly maxLogSize = 1000;
  private readonly maxMetricsSize = 5000;
  private errorStats: ErrorStats;
  private recoveryAttempts: Map<string, number> = new Map();

  private constructor() {
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: new Map(),
      errorsBySeverity: new Map(),
      recentErrors: [],
      recoveryStats: {
        recoveredErrors: 0,
        failedRecoveries: 0,
        recoveryRate: 0,
      },
    };
  }

  /**
   * الحصول على singleton instance
   */
  static getInstance(): ErrorTelemetrySystem {
    if (!this.instance) {
      this.instance = new ErrorTelemetrySystem();
    }
    return this.instance;
  }

  /**
   * تسجيل خطأ منظم
   */
  logError(errorContext: ErrorContext): void {
    // Enhance with automatic metadata
    errorContext.context.timestamp = new Date();

    // Log to console based on severity
    this.logToConsole(errorContext);

    // Add to error log
    this.errorLog.push(errorContext);

    // Maintain max size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Update statistics
    this.updateErrorStats(errorContext);

    // Persist if needed
    this.persistError(errorContext);
  }

  /**
   * تسجيل خطأ selector
   */
  logSelectorError(
    selector: string,
    reason: string,
    elementType?: string,
    customContext?: Record<string, any>
  ): void {
    const category = this.categorizeSelectorError(reason);
    const severity = this.determineSeverity(category);

    this.logError({
      category,
      severity,
      message: `Selector error: ${selector} - ${reason}`,
      context: {
        selector,
        elementType,
        timestamp: new Date(),
        ...customContext,
      },
      metadata: {
        customData: customContext,
      },
    });
  }

  /**
   * تسجيل خطأ عنصر
   */
  logElementError(
    elementType: string,
    action: string,
    errorMessage: string,
    customContext?: Record<string, any>
  ): void {
    const category = this.categorizeElementError(action, errorMessage);
    const severity = this.determineSeverity(category);

    this.logError({
      category,
      severity,
      message: `Element error: ${elementType}.${action} - ${errorMessage}`,
      context: {
        elementType,
        action,
        timestamp: new Date(),
        ...customContext,
      },
      metadata: {
        customData: customContext,
      },
    });
  }

  /**
   * تسجيل محاولة استرجاع خطأ
   */
  logRecoveryAttempt(
    errorId: string,
    strategy: string,
    success: boolean,
    details?: Record<string, any>
  ): void {
    const key = `${errorId}:${strategy}`;
    const attempts = (this.recoveryAttempts.get(key) || 0) + 1;
    this.recoveryAttempts.set(key, attempts);

    if (success) {
      this.errorStats.recoveryStats.recoveredErrors++;
    } else {
      this.errorStats.recoveryStats.failedRecoveries++;
    }

    // Update recovery rate
    const total =
      this.errorStats.recoveryStats.recoveredErrors +
      this.errorStats.recoveryStats.failedRecoveries;
    this.errorStats.recoveryStats.recoveryRate =
      this.errorStats.recoveryStats.recoveredErrors / total;

    if (success) {
      console.log(`✅ Error recovered with strategy: ${strategy}`);
    } else {
      console.log(`❌ Recovery failed with strategy: ${strategy}`);
    }

    // Record metric
    this.recordMetric('recovery_attempt', success ? 1 : 0, 'boolean', {
      strategy,
      errorId,
      ...details,
    });
  }

  /**
   * تسجيل مقياس الأداء
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'unit',
    context?: Record<string, any>
  ): void {
    const metric: TelemetryMetric = {
      name,
      value,
      unit,
      category: this.extractCategory(name),
      timestamp: new Date(),
      context: context || {},
    };

    this.telemetryMetrics.push(metric);

    // Maintain max size
    if (this.telemetryMetrics.length > this.maxMetricsSize) {
      this.telemetryMetrics = this.telemetryMetrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * تسجيل وقت التنفيذ
   */
  recordExecutionTime(
    operation: string,
    durationMs: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    this.recordMetric(`execution_time:${operation}`, durationMs, 'ms', {
      success,
      ...context,
    });
  }

  /**
   * تسجيل نسبة النجاح
   */
  recordSuccessRate(
    operation: string,
    successCount: number,
    totalCount: number,
    context?: Record<string, any>
  ): void {
    const rate = (successCount / totalCount) * 100;
    this.recordMetric(`success_rate:${operation}`, rate, 'percentage', {
      successCount,
      totalCount,
      ...context,
    });
  }

  /**
   * الحصول على احصائيات الأخطاء
   */
  getErrorStats(): ErrorStats {
    return {
      ...this.errorStats,
      recentErrors: this.errorLog.slice(-10),
    };
  }

  /**
   * الحصول على تقرير مفصل
   */
  generateReport(): {
    summary: string;
    stats: ErrorStats;
    topErrors: Array<{ category: string; count: number }>;
    metrics: TelemetryMetric[];
  } {
    const topErrors = Array.from(this.errorStats.errorsByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      summary: this.generateSummary(),
      stats: this.errorStats,
      topErrors,
      metrics: this.telemetryMetrics.slice(-100),
    };
  }

  /**
   * مسح السجلات
   */
  clearLogs(): void {
    this.errorLog = [];
    this.telemetryMetrics = [];
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: new Map(),
      errorsBySeverity: new Map(),
      recentErrors: [],
      recoveryStats: {
        recoveredErrors: 0,
        failedRecoveries: 0,
        recoveryRate: 0,
      },
    };
  }

  // =================== Private Methods ===================

  /**
   * تسجيل إلى console
   */
  private logToConsole(context: ErrorContext): void {
    const prefix = this.getSeverityEmoji(context.severity);
    const timestamp = context.context.timestamp.toISOString();

    const logData = {
      timestamp,
      severity: context.severity,
      category: context.category,
      message: context.message,
      selector: context.context.selector,
      elementType: context.context.elementType,
      metadata: context.metadata,
    };

    switch (context.severity) {
      case ErrorSeverity.DEBUG:
        console.debug(`${prefix} [DEBUG]`, logData);
        break;
      case ErrorSeverity.INFO:
        console.info(`${prefix} [INFO]`, logData);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`${prefix} [WARNING]`, logData);
        break;
      case ErrorSeverity.ERROR:
        console.error(`${prefix} [ERROR]`, logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`${prefix} [CRITICAL] 🚨`, logData);
        break;
    }
  }

  /**
   * تحديث احصائيات الأخطاء
   */
  private updateErrorStats(context: ErrorContext): void {
    this.errorStats.totalErrors++;

    // By category
    const categoryCount = this.errorStats.errorsByCategory.get(context.category) || 0;
    this.errorStats.errorsByCategory.set(context.category, categoryCount + 1);

    // By severity
    const severityCount = this.errorStats.errorsBySeverity.get(context.severity) || 0;
    this.errorStats.errorsBySeverity.set(context.severity, severityCount + 1);

    // Recent errors (keep last 20)
    this.errorStats.recentErrors.push(context);
    if (this.errorStats.recentErrors.length > 20) {
      this.errorStats.recentErrors = this.errorStats.recentErrors.slice(-20);
    }
  }

  /**
   * تصنيف خطأ selector
   */
  private categorizeSelectorError(reason: string): ErrorCategory {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('not found') || lowerReason.includes('timeout')) {
      return ErrorCategory.SELECTOR_NOT_FOUND;
    }
    if (lowerReason.includes('not visible')) {
      return ErrorCategory.ELEMENT_NOT_VISIBLE;
    }
    if (lowerReason.includes('interactable')) {
      return ErrorCategory.ELEMENT_NOT_INTERACTABLE;
    }
    if (lowerReason.includes('shadow')) {
      return ErrorCategory.SHADOW_DOM;
    }
    if (lowerReason.includes('iframe') || lowerReason.includes('frame')) {
      return ErrorCategory.IFRAME_ACCESS;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * تصنيف خطأ عنصر
   */
  private categorizeElementError(action: string, errorMessage: string): ErrorCategory {
    const lowerAction = action.toLowerCase();
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('not found')) {
      return ErrorCategory.SELECTOR_NOT_FOUND;
    }
    if (lowerError.includes('not visible')) {
      return ErrorCategory.ELEMENT_NOT_VISIBLE;
    }
    if (lowerError.includes('not interactable')) {
      return ErrorCategory.ELEMENT_NOT_INTERACTABLE;
    }
    if (lowerError.includes('timeout')) {
      return ErrorCategory.TIMEOUT;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * تحديد مستوى الخطورة
   */
  private determineSeverity(category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.SELECTOR_NOT_FOUND:
        return ErrorSeverity.WARNING;
      case ErrorCategory.TIMEOUT:
        return ErrorSeverity.ERROR;
      case ErrorCategory.IFRAME_ACCESS:
      case ErrorCategory.SHADOW_DOM:
        return ErrorSeverity.INFO;
      default:
        return ErrorSeverity.WARNING;
    }
  }

  /**
   * الحصول على emoji حسب severity
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.DEBUG:
        return '🔧';
      case ErrorSeverity.INFO:
        return 'ℹ️';
      case ErrorSeverity.WARNING:
        return '⚠️';
      case ErrorSeverity.ERROR:
        return '❌';
      case ErrorSeverity.CRITICAL:
        return '🚨';
    }
  }

  /**
   * استخراج الفئة من اسم المقياس
   */
  private extractCategory(name: string): string {
    return name.split(':')[0];
  }

  /**
   * توليد ملخص
   */
  private generateSummary(): string {
    const total = this.errorStats.totalErrors;
    const critical = this.errorStats.errorsBySeverity.get(ErrorSeverity.CRITICAL) || 0;
    const errors = this.errorStats.errorsBySeverity.get(ErrorSeverity.ERROR) || 0;
    const warnings = this.errorStats.errorsBySeverity.get(ErrorSeverity.WARNING) || 0;

    return `Total: ${total} | Critical: ${critical} | Errors: ${errors} | Warnings: ${warnings}`;
  }

  /**
   * حفظ الخطأ (للتكامل مع خدمة خارجية في المستقبل)
   */
  private persistError(context: ErrorContext): void {
    // In the future, this can persist to a remote service like Sentry
    // For now, it just logs to local storage if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('robot_errors') || '[]';
        const errors = JSON.parse(stored);
        errors.push(context);
        if (errors.length > 100) {
          errors.shift();
        }
        window.localStorage.setItem('robot_errors', JSON.stringify(errors));
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

/**
 * Helper function to create error logger
 */
export function getErrorLogger(): ErrorTelemetrySystem {
  return ErrorTelemetrySystem.getInstance();
}
