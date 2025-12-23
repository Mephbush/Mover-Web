/**
 * نظام تتبع الأخطاء المحسّن
 * يفصل أخطاء التطبيق عن أخطاء المتصفح والبيئة
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory = 
  | 'task-execution'
  | 'github-api'
  | 'network'
  | 'validation'
  | 'browser'
  | 'system'
  | 'user-input';

export interface AppError {
  id: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  stack?: string;
  context?: {
    taskId?: string;
    taskName?: string;
    component?: string;
    action?: string;
    [key: string]: any;
  };
}

class ErrorTracker {
  private errors: AppError[] = [];
  private maxErrors = 100;
  private listeners: ((error: AppError) => void)[] = [];

  /**
   * تسجيل خطأ جديد
   */
  log(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = 'medium',
    details?: any,
    context?: AppError['context']
  ): AppError {
    const error: AppError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      category,
      severity,
      message,
      details,
      context,
      stack: new Error().stack
    };

    this.errors.unshift(error);
    
    // الاحتفاظ بآخر 100 خطأ فقط
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // إخطار المستمعين
    this.listeners.forEach(listener => listener(error));

    // طباعة في console حسب الخطورة
    this.consoleLog(error);

    return error;
  }

  /**
   * طباعة الخطأ في console مع تنسيق واضح
   */
  private consoleLog(error: AppError) {
    const prefix = this.getSeverityEmoji(error.severity);
    const msg = `${prefix} [${error.category.toUpperCase()}] ${error.message}`;

    switch (error.severity) {
      case 'critical':
      case 'high':
        console.error(msg, error.details || '');
        break;
      case 'medium':
        console.warn(msg, error.details || '');
        break;
      case 'low':
        console.log(msg, error.details || '');
        break;
    }

    // طباعة السياق إذا كان موجوداً
    if (error.context && Object.keys(error.context).length > 0) {
      console.log('  📋 Context:', error.context);
    }
  }

  /**
   * الحصول على رمز تعبيري حسب الخطورة
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    const emojis = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return emojis[severity];
  }

  /**
   * الحصول على جميع الأخطاء
   */
  getErrors(filter?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    since?: Date;
  }): AppError[] {
    let filtered = [...this.errors];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(e => e.category === filter.category);
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity);
      }
      if (filter.since) {
        filtered = filtered.filter(e => e.timestamp >= filter.since);
      }
    }

    return filtered;
  }

  /**
   * مسح جميع الأخطاء
   */
  clear() {
    this.errors = [];
  }

  /**
   * إضافة مستمع للأخطاء الجديدة
   */
  subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * الحصول على إحصائيات الأخطاء
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byCategory: {} as Record<ErrorCategory, number>,
      last24Hours: 0
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      if (error.timestamp >= oneDayAgo) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  /**
   * تصدير الأخطاء كـ JSON
   */
  export(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalErrors: this.errors.length,
      errors: this.errors
    }, null, 2);
  }
}

// مثيل واحد مشترك
export const errorTracker = new ErrorTracker();

/**
 * دوال مساعدة لتسجيل أنواع مختلفة من الأخطاء
 */
export const ErrorLogger = {
  taskError: (message: string, taskId?: string, taskName?: string, details?: any) => {
    return errorTracker.log(message, 'task-execution', 'high', details, {
      taskId,
      taskName,
      component: 'TaskRunner'
    });
  },

  githubError: (message: string, details?: any) => {
    return errorTracker.log(message, 'github-api', 'high', details, {
      component: 'GitHubIntegration'
    });
  },

  networkError: (message: string, url?: string, details?: any) => {
    return errorTracker.log(message, 'network', 'medium', details, {
      url
    });
  },

  validationError: (message: string, field?: string, value?: any) => {
    return errorTracker.log(message, 'validation', 'low', { value }, {
      field
    });
  },

  browserError: (message: string, details?: any) => {
    return errorTracker.log(message, 'browser', 'medium', details);
  },

  systemError: (message: string, details?: any) => {
    return errorTracker.log(message, 'system', 'critical', details);
  },

  userInputError: (message: string, details?: any) => {
    return errorTracker.log(message, 'user-input', 'low', details);
  }
};

// تسجيل الأخطاء العالمية (من المتصفح)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // تجاهل أخطاء Figma DevTools
    if (event.filename?.includes('figma.com') || event.filename?.includes('devtools_worker')) {
      console.log('🔇 تم تجاهل خطأ من Figma DevTools');
      return;
    }

    errorTracker.log(
      event.message,
      'browser',
      'high',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    // تجاهل أخطاء Figma
    const errorMessage = event.reason?.message || String(event.reason);
    if (errorMessage.includes('figma') || errorMessage.includes('devtools')) {
      console.log('🔇 تم تجاهل promise rejection من Figma');
      return;
    }

    errorTracker.log(
      `Unhandled Promise Rejection: ${errorMessage}`,
      'browser',
      'high',
      event.reason
    );
  });
}
