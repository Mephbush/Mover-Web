/**
 * نظام الاستجابة الموجه بالأحداث
 * Event-Driven Response System
 * 
 * كشف أحداث الصفحة والاستجابة الذكية لها
 */

export enum PageEventType {
  NAVIGATION = 'navigation',
  FORM_SUBMISSION = 'form_submission',
  BUTTON_CLICK = 'button_click',
  DIALOG_OPENED = 'dialog_opened',
  ERROR_APPEARED = 'error_appeared',
  SUCCESS_MESSAGE = 'success_message',
  LOADING_STARTED = 'loading_started',
  LOADING_FINISHED = 'loading_finished',
  CONTENT_CHANGED = 'content_changed',
  REDIRECT = 'redirect',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMITED = 'rate_limited',
  CUSTOM = 'custom',
}

export interface PageEvent {
  type: PageEventType;
  timestamp: Date;
  url: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  details: Record<string, any>;
  selectors?: string[];
  shouldAutoRespond: boolean;
  responseAction?: string;
}

export interface EventHandler {
  eventType: PageEventType;
  condition: (event: PageEvent) => boolean;
  action: (event: PageEvent, page: any) => Promise<boolean>;
  priority: number; // Higher = more important
  retryCount: number;
  timeout: number;
}

export interface EventResponse {
  handled: boolean;
  action: string;
  duration: number;
  result: any;
  success: boolean;
  message: string;
}

/**
 * نظام الاستجابة للأحداث
 */
export class EventDrivenResponseSystem {
  private eventHandlers: Map<PageEventType, EventHandler[]> = new Map();
  private eventHistory: PageEvent[] = [];
  private readonly maxHistorySize = 500;
  private isMonitoring = false;
  private eventEmitterCallbacks: ((event: PageEvent) => void)[] = [];

  /**
   * تسجيل معالج للأحداث
   */
  registerHandler(handler: EventHandler): void {
    if (!this.eventHandlers.has(handler.eventType)) {
      this.eventHandlers.set(handler.eventType, []);
    }

    const handlers = this.eventHandlers.get(handler.eventType)!;
    handlers.push(handler);
    handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * إلغاء تسجيل معالج
   */
  unregisterHandler(eventType: PageEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * بدء مراقبة الأحداث
   */
  async startMonitoring(page: any): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🎯 Event monitoring started');

    try {
      // Monitor various page events
      await page.evaluate(() => {
        // تتبع تغييرات التنقل
        window.addEventListener('load', () => {
          window.__pageEvent = {
            type: 'page_loaded',
            timestamp: Date.now(),
          };
        });

        // تتبع الأخطاء
        window.addEventListener('error', (event) => {
          window.__pageError = {
            type: 'js_error',
            message: event.message,
            timestamp: Date.now(),
          };
        });

        // تتبع رسائل الكونسول
        const originalLog = console.log;
        console.log = function (...args: any[]) {
          if (args[0]?.includes('error') || args[0]?.includes('Error')) {
            window.__pageError = {
              type: 'console_error',
              message: args.join(' '),
              timestamp: Date.now(),
            };
          }
          originalLog.apply(console, args);
        };

        // تتبع رسائل النجاح
        const originalWarn = console.warn;
        console.warn = function (...args: any[]) {
          if (args[0]?.includes('success')) {
            window.__pageSuccess = {
              type: 'success_message',
              message: args.join(' '),
              timestamp: Date.now(),
            };
          }
          originalWarn.apply(console, args);
        };
      });

      // Start polling for events
      await this.pollForEvents(page);
    } catch (error: any) {
      console.warn(`Failed to start event monitoring: ${error.message}`);
      this.isMonitoring = false;
    }
  }

  /**
   * إيقاف مراقبة الأحداث
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 Event monitoring stopped');
  }

  /**
   * كشف أحداث الصفحة
   */
  async detectPageEvents(page: any): Promise<PageEvent[]> {
    const events: PageEvent[] = [];

    try {
      // 1. Check for error messages
      const errorDetected = await this.detectErrors(page);
      if (errorDetected) {
        events.push(errorDetected);
      }

      // 2. Check for success messages
      const successDetected = await this.detectSuccess(page);
      if (successDetected) {
        events.push(successDetected);
      }

      // 3. Check for dialogs
      const dialogDetected = await this.detectDialogs(page);
      if (dialogDetected) {
        events.push(dialogDetected);
      }

      // 4. Check for loading states
      const loadingDetected = await this.detectLoadingState(page);
      if (loadingDetected) {
        events.push(loadingDetected);
      }

      // 5. Check for validation errors
      const validationDetected = await this.detectValidationErrors(page);
      if (validationDetected) {
        events.push(validationDetected);
      }

      // 6. Check for auth requirements
      const authDetected = await this.detectAuthRequirement(page);
      if (authDetected) {
        events.push(authDetected);
      }

      // 7. Check for permission denial
      const permissionDetected = await this.detectPermissionDenied(page);
      if (permissionDetected) {
        events.push(permissionDetected);
      }

      // 8. Check for rate limiting
      const rateLimitDetected = await this.detectRateLimiting(page);
      if (rateLimitDetected) {
        events.push(rateLimitDetected);
      }
    } catch (error: any) {
      console.debug(`Error detecting page events: ${error.message}`);
    }

    // Add to history
    events.forEach(e => {
      this.eventHistory.push(e);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }
      this.emitEvent(e);
    });

    return events;
  }

  /**
   * معالجة حدث
   */
  async handleEvent(event: PageEvent, page: any): Promise<EventResponse> {
    const startTime = Date.now();

    try {
      const handlers = this.eventHandlers.get(event.type) || [];

      for (const handler of handlers) {
        if (!handler.condition(event)) continue;

        console.log(`📢 Handling event: ${event.type} - ${event.description}`);

        try {
          const success = await this.executeWithTimeout(
            () => handler.action(event, page),
            handler.timeout
          );

          return {
            handled: success,
            action: event.responseAction || 'auto_handled',
            duration: Date.now() - startTime,
            result: null,
            success,
            message: success ? 'Event handled successfully' : 'Event handling failed',
          };
        } catch (error: any) {
          console.warn(`Handler failed for ${event.type}: ${error.message}`);
        }
      }

      // No handler found
      return {
        handled: false,
        action: 'no_handler',
        duration: Date.now() - startTime,
        result: null,
        success: false,
        message: `No handler registered for ${event.type}`,
      };
    } catch (error: any) {
      return {
        handled: false,
        action: 'error',
        duration: Date.now() - startTime,
        result: error,
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * الاستماع للأحداث
   */
  onEvent(callback: (event: PageEvent) => void): () => void {
    this.eventEmitterCallbacks.push(callback);
    return () => {
      const index = this.eventEmitterCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventEmitterCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * الحصول على سجل الأحداث
   */
  getEventHistory(limit?: number): PageEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * مسح سجل الأحداث
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  // =================== Private Methods ===================

  private async pollForEvents(page: any): Promise<void> {
    // Polling loop would be implemented here
    // This would run continuously while monitoring is enabled
  }

  private async detectErrors(page: any): Promise<PageEvent | null> {
    try {
      const errorSelectors = [
        '.error',
        '[role="alert"]',
        '.alert-danger',
        '[class*="error"]',
        '.error-message',
        '.validation-error',
        '[data-error]',
      ];

      for (const selector of errorSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const errorText = await page.locator(selector).first().textContent();
          return {
            type: PageEventType.ERROR_APPEARED,
            timestamp: new Date(),
            url: page.url(),
            severity: 'error',
            description: `Error message detected: ${errorText}`,
            details: {
              selector,
              text: errorText,
              count,
            },
            selectors: [selector],
            shouldAutoRespond: true,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Error detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectSuccess(page: any): Promise<PageEvent | null> {
    try {
      const successSelectors = [
        '.success',
        '[role="status"]',
        '.alert-success',
        '[class*="success"]',
        '.success-message',
        '[data-success]',
      ];

      for (const selector of successSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const successText = await page.locator(selector).first().textContent();
          return {
            type: PageEventType.SUCCESS_MESSAGE,
            timestamp: new Date(),
            url: page.url(),
            severity: 'info',
            description: `Success message: ${successText}`,
            details: {
              selector,
              text: successText,
              count,
            },
            selectors: [selector],
            shouldAutoRespond: false,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Success detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectDialogs(page: any): Promise<PageEvent | null> {
    try {
      const dialogSelectors = [
        'dialog',
        '[role="dialog"]',
        '.modal',
        '.dialog',
        '[class*="modal"]',
        '[class*="dialog"]',
      ];

      for (const selector of dialogSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const isVisible = await page.locator(selector).first().isVisible();
          if (isVisible) {
            const dialogText = await page.locator(selector).first().textContent();
            return {
              type: PageEventType.DIALOG_OPENED,
              timestamp: new Date(),
              url: page.url(),
              severity: 'warning',
              description: `Dialog opened: ${dialogText?.substring(0, 100)}`,
              details: {
                selector,
                text: dialogText,
              },
              selectors: [selector],
              shouldAutoRespond: true,
            };
          }
        }
      }
    } catch (error: any) {
      console.debug(`Dialog detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectLoadingState(page: any): Promise<PageEvent | null> {
    try {
      const loadingSelectors = [
        '.loading',
        '.spinner',
        '.progress',
        '[class*="loading"]',
        '[data-loading]',
        '.skeleton',
      ];

      for (const selector of loadingSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          return {
            type: PageEventType.LOADING_STARTED,
            timestamp: new Date(),
            url: page.url(),
            severity: 'info',
            description: 'Page is loading',
            details: {
              selector,
              count,
            },
            selectors: [selector],
            shouldAutoRespond: false,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Loading state detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectValidationErrors(page: any): Promise<PageEvent | null> {
    try {
      const validationSelectors = [
        '.validation-error',
        '[data-error-message]',
        '.field-error',
        '[aria-invalid="true"]',
        '[class*="invalid"]',
      ];

      for (const selector of validationSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const errorText = await page.locator(selector).first().textContent();
          return {
            type: PageEventType.VALIDATION_ERROR,
            timestamp: new Date(),
            url: page.url(),
            severity: 'warning',
            description: `Validation error: ${errorText}`,
            details: {
              selector,
              text: errorText,
              count,
            },
            selectors: [selector],
            shouldAutoRespond: true,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Validation error detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectAuthRequirement(page: any): Promise<PageEvent | null> {
    try {
      const authSelectors = [
        '.login-form',
        '[class*="login"]',
        '[class*="auth"]',
        'form[action*="login"]',
        '[data-requires-auth]',
      ];

      for (const selector of authSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          return {
            type: PageEventType.AUTHENTICATION_REQUIRED,
            timestamp: new Date(),
            url: page.url(),
            severity: 'critical',
            description: 'Authentication required',
            details: {
              selector,
            },
            selectors: [selector],
            shouldAutoRespond: true,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Auth requirement detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectPermissionDenied(page: any): Promise<PageEvent | null> {
    try {
      const permissionSelectors = [
        '[class*="permission"]',
        '[class*="forbidden"]',
        '[class*="denied"]',
        '.access-denied',
        '[data-permission-error]',
      ];

      for (const selector of permissionSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const text = await page.locator(selector).first().textContent();
          return {
            type: PageEventType.PERMISSION_DENIED,
            timestamp: new Date(),
            url: page.url(),
            severity: 'critical',
            description: `Permission denied: ${text}`,
            details: {
              selector,
              text,
            },
            selectors: [selector],
            shouldAutoRespond: true,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Permission denial detection failed: ${error.message}`);
    }

    return null;
  }

  private async detectRateLimiting(page: any): Promise<PageEvent | null> {
    try {
      const rateLimitSelectors = [
        '[class*="rate"]',
        '[class*="throttle"]',
        '[data-rate-limit]',
        '.too-many-requests',
      ];

      for (const selector of rateLimitSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const text = await page.locator(selector).first().textContent();
          return {
            type: PageEventType.RATE_LIMITED,
            timestamp: new Date(),
            url: page.url(),
            severity: 'error',
            description: `Rate limited: ${text}`,
            details: {
              selector,
              text,
            },
            selectors: [selector],
            shouldAutoRespond: true,
          };
        }
      }
    } catch (error: any) {
      console.debug(`Rate limit detection failed: ${error.message}`);
    }

    return null;
  }

  private async executeWithTimeout<T>(
    action: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      action(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }

  private emitEvent(event: PageEvent): void {
    this.eventEmitterCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.warn(`Event listener error: ${error}`);
      }
    });
  }
}

export function getEventDrivenResponseSystem(): EventDrivenResponseSystem {
  return new EventDrivenResponseSystem();
}
