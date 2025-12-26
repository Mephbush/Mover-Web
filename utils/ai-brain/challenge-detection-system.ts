/**
 * نظام كشف التحديات وحلها
 * Challenge Detection and Resolution System
 * 
 * كشف العقبات والمشاكل وحلها بذكاء
 */

export enum ChallengeType {
  ELEMENT_NOT_FOUND = 'element_not_found',
  ELEMENT_DISABLED = 'element_disabled',
  ELEMENT_HIDDEN = 'element_hidden',
  ELEMENT_OBSTRUCTED = 'element_obstructed',
  FORM_VALIDATION = 'form_validation',
  NETWORK_TIMEOUT = 'network_timeout',
  PAGE_REDIRECT = 'page_redirect',
  POPUP_BLOCKING = 'popup_blocking',
  CAPTCHA_REQUIRED = 'captcha_required',
  OTP_REQUIRED = 'otp_required',
  GEOLOCATION_REQUIRED = 'geolocation_required',
  COOKIE_REQUIRED = 'cookie_required',
  SESSION_EXPIRED = 'session_expired',
  TOO_MANY_REQUESTS = 'too_many_requests',
  CONTENT_CHANGED = 'content_changed',
  SCRIPT_ERROR = 'script_error',
  MEMORY_ISSUE = 'memory_issue',
  UNKNOWN = 'unknown',
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  context: {
    selector?: string;
    action?: string;
    expectedValue?: string;
    actualValue?: string;
    elementInfo?: Record<string, any>;
    pageUrl?: string;
  };
  detectedAt: Date;
  resolvedAt?: Date;
  resolutionAttempts: number;
  maxRetries: number;
}

export interface ChallengeResolution {
  strategy: string;
  priority: number;
  canAutoResolve: boolean;
  estimatedTime: number;
  successRate: number;
  action: (page: any, challenge: Challenge) => Promise<boolean>;
}

export interface ResolutionResult {
  challenge_id: string;
  resolved: boolean;
  strategyUsed: string;
  duration: number;
  attempts: number;
  finalStatus: 'success' | 'failed' | 'partial' | 'skipped';
  message: string;
}

/**
 * نظام كشف ومعالجة التحديات
 */
export class ChallengeDetectionSystem {
  private challenges: Map<string, Challenge> = new Map();
  private resolutions: Map<ChallengeType, ChallengeResolution[]> = new Map();
  private history: ResolutionResult[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.initializeDefaultResolutions();
  }

  /**
   * كشف التحديات
   */
  async detectChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // 1. Detect element-related challenges
      const elementChallenges = await this.detectElementChallenges(page);
      challenges.push(...elementChallenges);

      // 2. Detect form-related challenges
      const formChallenges = await this.detectFormChallenges(page);
      challenges.push(...formChallenges);

      // 3. Detect network challenges
      const networkChallenges = await this.detectNetworkChallenges(page);
      challenges.push(...networkChallenges);

      // 4. Detect page challenges
      const pageChallenges = await this.detectPageChallenges(page);
      challenges.push(...pageChallenges);

      // 5. Detect script/performance challenges
      const scriptChallenges = await this.detectScriptChallenges(page);
      challenges.push(...scriptChallenges);

      // Store challenges
      challenges.forEach(challenge => {
        challenge.id = `challenge_${Date.now()}_${Math.random()}`;
        this.challenges.set(challenge.id, challenge);
      });
    } catch (error: any) {
      console.debug(`Challenge detection error: ${error.message}`);
    }

    return challenges;
  }

  /**
   * حل التحدي
   */
  async resolveChallenge(
    page: any,
    challenge: Challenge,
    maxAttempts: number = 3
  ): Promise<ResolutionResult> {
    const startTime = Date.now();
    let attempts = 0;

    console.log(`🔧 Resolving challenge: ${challenge.type} - ${challenge.description}`);

    try {
      const resolutions = this.resolutions.get(challenge.type) || [];

      // Try each resolution strategy
      for (const resolution of resolutions) {
        while (attempts < maxAttempts) {
          attempts++;

          try {
            console.log(
              `   Attempt ${attempts}/${maxAttempts}: ${resolution.strategy}`
            );

            const success = await this.executeWithTimeout(
              () => resolution.action(page, challenge),
              resolution.estimatedTime + 1000
            );

            if (success) {
              challenge.resolvedAt = new Date();
              challenge.resolutionAttempts = attempts;

              const result: ResolutionResult = {
                challenge_id: challenge.id,
                resolved: true,
                strategyUsed: resolution.strategy,
                duration: Date.now() - startTime,
                attempts,
                finalStatus: 'success',
                message: `Challenge resolved with strategy: ${resolution.strategy}`,
              };

              this.recordResolution(result);
              return result;
            }
          } catch (error: any) {
            console.debug(
              `   Strategy failed: ${resolution.strategy} - ${error.message}`
            );
          }
        }

        attempts = 0; // Reset for next strategy
      }

      // All strategies failed
      const result: ResolutionResult = {
        challenge_id: challenge.id,
        resolved: false,
        strategyUsed: 'all_failed',
        duration: Date.now() - startTime,
        attempts,
        finalStatus: 'failed',
        message: 'Could not resolve challenge with any available strategy',
      };

      this.recordResolution(result);
      return result;
    } catch (error: any) {
      const result: ResolutionResult = {
        challenge_id: challenge.id,
        resolved: false,
        strategyUsed: 'error',
        duration: Date.now() - startTime,
        attempts,
        finalStatus: 'failed',
        message: error.message,
      };

      this.recordResolution(result);
      return result;
    }
  }

  /**
   * معالجة تحديات متعددة
   */
  async resolveChallenges(
    page: any,
    challenges: Challenge[]
  ): Promise<ResolutionResult[]> {
    const results: ResolutionResult[] = [];

    // Sort by severity
    const sorted = challenges.sort((a, b) => {
      const severityMap = { low: 0, medium: 1, high: 2, critical: 3 };
      return severityMap[b.severity] - severityMap[a.severity];
    });

    for (const challenge of sorted) {
      const result = await this.resolveChallenge(page, challenge);
      results.push(result);

      // If critical, stop on failure
      if (challenge.severity === 'critical' && !result.resolved) {
        break;
      }
    }

    return results;
  }

  /**
   * الحصول على سجل التحديات
   */
  getChallengeHistory(limit?: number): ResolutionResult[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * الحصول على إحصائيات التحديات
   */
  getChallengeStatistics(): {
    totalChallenges: number;
    resolvedCount: number;
    failedCount: number;
    resolutionRate: number;
    byType: Record<ChallengeType, number>;
  } {
    const resolved = this.history.filter(r => r.resolved).length;
    const failed = this.history.filter(r => !r.resolved).length;
    const total = this.history.length;

    const byType: Record<string, number> = {};
    this.history.forEach(h => {
      const type = h.strategyUsed;
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalChallenges: total,
      resolvedCount: resolved,
      failedCount: failed,
      resolutionRate: total > 0 ? resolved / total : 0,
      byType: byType as Record<ChallengeType, number>,
    };
  }

  // =================== Private Methods ===================

  private async detectElementChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // Check for common elements that might be problematic
      const problematicSelectors = [
        'input[disabled]',
        'button[disabled]',
        '[style*="display: none"]',
        '[style*="visibility: hidden"]',
      ];

      for (const selector of problematicSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const challenge: Challenge = {
            id: '',
            type: ChallengeType.ELEMENT_DISABLED,
            severity: 'high',
            timestamp: new Date(),
            description: `Found disabled element: ${selector}`,
            context: { selector },
            detectedAt: new Date(),
            resolutionAttempts: 0,
            maxRetries: 3,
          };
          challenges.push(challenge);
        }
      }
    } catch (error: any) {
      console.debug(`Element challenge detection failed: ${error.message}`);
    }

    return challenges;
  }

  private async detectFormChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // Check for validation errors
      const validationErrors = await page.locator('[aria-invalid="true"]').count();
      if (validationErrors > 0) {
        const challenge: Challenge = {
          id: '',
          type: ChallengeType.FORM_VALIDATION,
          severity: 'high',
          timestamp: new Date(),
          description: `Form validation errors detected: ${validationErrors} fields`,
          context: {},
          detectedAt: new Date(),
          resolutionAttempts: 0,
          maxRetries: 3,
        };
        challenges.push(challenge);
      }
    } catch (error: any) {
      console.debug(`Form challenge detection failed: ${error.message}`);
    }

    return challenges;
  }

  private async detectNetworkChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // Check page load time
      const navigationTiming = await page.evaluate(() => {
        const timing = (window.performance as any).timing;
        return timing.loadEventEnd - timing.navigationStart;
      });

      if (navigationTiming > 30000) {
        const challenge: Challenge = {
          id: '',
          type: ChallengeType.NETWORK_TIMEOUT,
          severity: 'medium',
          timestamp: new Date(),
          description: `Slow network detected: ${navigationTiming}ms page load`,
          context: { navigationTiming },
          detectedAt: new Date(),
          resolutionAttempts: 0,
          maxRetries: 2,
        };
        challenges.push(challenge);
      }
    } catch (error: any) {
      console.debug(`Network challenge detection failed: ${error.message}`);
    }

    return challenges;
  }

  private async detectPageChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // Check for popups
      const popups = await page.locator('[role="dialog"], .popup, .modal').count();
      if (popups > 0) {
        const challenge: Challenge = {
          id: '',
          type: ChallengeType.POPUP_BLOCKING,
          severity: 'high',
          timestamp: new Date(),
          description: `Popup detected blocking interaction`,
          context: {},
          detectedAt: new Date(),
          resolutionAttempts: 0,
          maxRetries: 2,
        };
        challenges.push(challenge);
      }

      // Check for redirects
      const currentUrl = page.url();
      if (currentUrl?.includes('redirect') || currentUrl?.includes('landing')) {
        const challenge: Challenge = {
          id: '',
          type: ChallengeType.PAGE_REDIRECT,
          severity: 'medium',
          timestamp: new Date(),
          description: `Page redirect detected`,
          context: { url: currentUrl },
          detectedAt: new Date(),
          resolutionAttempts: 0,
          maxRetries: 1,
        };
        challenges.push(challenge);
      }
    } catch (error: any) {
      console.debug(`Page challenge detection failed: ${error.message}`);
    }

    return challenges;
  }

  private async detectScriptChallenges(page: any): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    try {
      // Check for JavaScript errors
      const jsErrors = await page.evaluate(() => {
        return (window as any).__jsErrors?.length || 0;
      });

      if (jsErrors > 0) {
        const challenge: Challenge = {
          id: '',
          type: ChallengeType.SCRIPT_ERROR,
          severity: 'high',
          timestamp: new Date(),
          description: `JavaScript errors detected: ${jsErrors}`,
          context: {},
          detectedAt: new Date(),
          resolutionAttempts: 0,
          maxRetries: 2,
        };
        challenges.push(challenge);
      }
    } catch (error: any) {
      console.debug(`Script challenge detection failed: ${error.message}`);
    }

    return challenges;
  }

  private initializeDefaultResolutions(): void {
    // Popup blocking resolution
    this.registerResolution(ChallengeType.POPUP_BLOCKING, {
      strategy: 'close_popup',
      priority: 1,
      canAutoResolve: true,
      estimatedTime: 500,
      successRate: 0.95,
      action: async (page: any) => {
        try {
          const closeButton = await page.locator('[aria-label="Close"], .close, button:has-text("Close")').first();
          await closeButton.click();
          return true;
        } catch {
          return false;
        }
      },
    });

    // Form validation resolution
    this.registerResolution(ChallengeType.FORM_VALIDATION, {
      strategy: 'clear_and_refill',
      priority: 1,
      canAutoResolve: true,
      estimatedTime: 2000,
      successRate: 0.7,
      action: async (page: any) => {
        try {
          const inputs = await page.locator('input[aria-invalid="true"]').all();
          for (const input of inputs) {
            await input.clear();
            await input.fill('');
          }
          return true;
        } catch {
          return false;
        }
      },
    });

    // Network timeout resolution
    this.registerResolution(ChallengeType.NETWORK_TIMEOUT, {
      strategy: 'wait_and_retry',
      priority: 1,
      canAutoResolve: true,
      estimatedTime: 5000,
      successRate: 0.6,
      action: async (page: any) => {
        try {
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          return true;
        } catch {
          return false;
        }
      },
    });
  }

  private registerResolution(type: ChallengeType, resolution: ChallengeResolution): void {
    if (!this.resolutions.has(type)) {
      this.resolutions.set(type, []);
    }
    this.resolutions.get(type)!.push(resolution);
  }

  private recordResolution(result: ResolutionResult): void {
    this.history.push(result);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
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
}

export function getChallengeDetectionSystem(): ChallengeDetectionSystem {
  return new ChallengeDetectionSystem();
}
