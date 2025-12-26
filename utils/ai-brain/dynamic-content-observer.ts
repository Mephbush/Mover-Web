/**
 * نظام المراقبة للمحتوى الديناميكي
 * Dynamic Content Observer System
 * 
 * مراقبة تغييرات DOM والانتظار حتى استقرار الصفحة
 */

export interface MutationWaitOptions {
  timeout: number;
  stabilityDelay: number;
  maxMutations: number;
  targetSelector?: string;
  observeSubtree: boolean;
  observeAttributes: boolean;
  observeCharacterData: boolean;
  attributeFilter?: string[];
}

export interface MutationEvent {
  type: 'added' | 'removed' | 'modified' | 'text-changed';
  selector: string;
  timestamp: Date;
  mutationCount: number;
  nodeCount: number;
}

export interface StabilityResult {
  stable: boolean;
  eventCount: number;
  totalDuration: number;
  stabilizedAt: Date;
  events: MutationEvent[];
}

/**
 * نظام مراقبة المحتوى الديناميكي
 */
export class DynamicContentObserver {
  private mutationObservers: Map<string, MutationObserver> = new Map();
  private mutationHistory: MutationEvent[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * الانتظار حتى يتم إضافة عنصر
   */
  async waitForElement(
    page: any,
    selector: string,
    options: Partial<MutationWaitOptions> = {}
  ): Promise<boolean> {
    const {
      timeout = 10000,
      stabilityDelay = 500,
    } = options;

    const startTime = Date.now();

    try {
      // First, check if element already exists
      try {
        const element = await page.locator(selector).first();
        if (element) {
          const isVisible = await this.isElementVisible(page, selector);
          if (isVisible) {
            return true;
          }
        }
      } catch {
        // Element doesn't exist yet
      }

      // Wait for element to appear
      return await page.waitForSelector(selector, { timeout });
    } catch (error: any) {
      console.debug(`waitForElement failed with timeout ${timeout}ms: ${error.message}`);

      // Fallback: use mutation observer
      return await this.waitForElementWithMutationObserver(
        page,
        selector,
        timeout,
        stabilityDelay
      );
    }
  }

  /**
   * الانتظار حتى استقرار الصفحة
   */
  async waitForPageStability(
    page: any,
    options: Partial<MutationWaitOptions> = {}
  ): Promise<StabilityResult> {
    const {
      timeout = 15000,
      stabilityDelay = 1000,
      maxMutations = 100,
      observeSubtree = true,
      observeAttributes = true,
      observeCharacterData = true,
    } = options;

    const startTime = Date.now();
    const events: MutationEvent[] = [];
    let mutationCount = 0;
    let lastMutationTime = Date.now();

    return new Promise((resolve) => {
      const checkStability = () => {
        const now = Date.now();
        const timeSinceLastMutation = now - lastMutationTime;
        const totalElapsed = now - startTime;

        // Check if stable
        if (timeSinceLastMutation >= stabilityDelay) {
          clearInterval(checkInterval);
          observer.disconnect();

          resolve({
            stable: true,
            eventCount: events.length,
            totalDuration: totalElapsed,
            stabilizedAt: new Date(lastMutationTime + stabilityDelay),
            events,
          });
          return;
        }

        // Check timeout
        if (totalElapsed > timeout) {
          clearInterval(checkInterval);
          observer.disconnect();

          resolve({
            stable: false,
            eventCount: events.length,
            totalDuration: totalElapsed,
            stabilizedAt: new Date(),
            events,
          });
          return;
        }
      };

      const observer = new MutationObserver((mutations) => {
        mutationCount += mutations.length;

        if (mutationCount > maxMutations) {
          clearInterval(checkInterval);
          observer.disconnect();

          resolve({
            stable: false,
            eventCount: events.length,
            totalDuration: Date.now() - startTime,
            stabilizedAt: new Date(),
            events,
          });
          return;
        }

        // Record mutation
        mutations.forEach((mutation) => {
          const event: MutationEvent = {
            type: this.getMutationType(mutation),
            selector: this.getElementSelector(mutation.target as Element),
            timestamp: new Date(),
            mutationCount: mutations.length,
            nodeCount: this.getNodeCount(mutation),
          };

          events.push(event);
          if (events.length > this.maxHistorySize) {
            events.shift();
          }
        });

        lastMutationTime = Date.now();
      });

      try {
        observer.observe(document.documentElement, {
          childList: true,
          subtree: observeSubtree,
          attributes: observeAttributes,
          characterData: observeCharacterData,
          attributeOldValue: true,
          characterDataOldValue: true,
        });
      } catch (error) {
        console.debug(`Failed to observe mutations: ${error}`);
        resolve({
          stable: true,
          eventCount: 0,
          totalDuration: Date.now() - startTime,
          stabilizedAt: new Date(),
          events: [],
        });
        return;
      }

      const checkInterval = setInterval(checkStability, 100);
      checkStability(); // Initial check
    });
  }

  /**
   * الانتظار حتى تطابق عنصر شرطاً معيناً
   */
  async waitForCondition(
    page: any,
    condition: (page: any) => Promise<boolean>,
    options: Partial<MutationWaitOptions> = {}
  ): Promise<boolean> {
    const {
      timeout = 10000,
      stabilityDelay = 500,
    } = options;

    const startTime = Date.now();
    const checkInterval = 100;

    return new Promise((resolve) => {
      const check = async () => {
        const now = Date.now();

        if (now - startTime > timeout) {
          clearInterval(interval);
          resolve(false);
          return;
        }

        try {
          const conditionMet = await condition(page);
          if (conditionMet) {
            clearInterval(interval);
            // Give it a moment to stabilize
            await new Promise(r => setTimeout(r, stabilityDelay));
            resolve(true);
            return;
          }
        } catch (error) {
          console.debug(`Condition check failed: ${error}`);
        }
      };

      const interval = setInterval(check, checkInterval);
      check(); // Initial check
    });
  }

  /**
   * مراقبة عنصر معين للتغييرات
   */
  startObservingElement(
    selector: string,
    callback: (changes: MutationEvent[]) => void,
    options: Partial<MutationWaitOptions> = {}
  ): string {
    const observerId = `observer_${Date.now()}_${Math.random()}`;

    try {
      const observer = new MutationObserver((mutations) => {
        const events: MutationEvent[] = mutations.map((mutation) => ({
          type: this.getMutationType(mutation),
          selector: this.getElementSelector(mutation.target as Element),
          timestamp: new Date(),
          mutationCount: mutations.length,
          nodeCount: this.getNodeCount(mutation),
        }));

        this.mutationHistory.push(...events);
        if (this.mutationHistory.length > this.maxHistorySize) {
          this.mutationHistory = this.mutationHistory.slice(-this.maxHistorySize);
        }

        callback(events);
      });

      const element = document.querySelector(selector);
      if (element) {
        observer.observe(element, {
          childList: true,
          subtree: options.observeSubtree !== false,
          attributes: options.observeAttributes !== false,
          characterData: options.observeCharacterData !== false,
          attributeFilter: options.attributeFilter,
        });

        this.mutationObservers.set(observerId, observer);
      }
    } catch (error) {
      console.debug(`Failed to start observing element: ${error}`);
    }

    return observerId;
  }

  /**
   * إيقاف مراقبة عنصر
   */
  stopObservingElement(observerId: string): void {
    const observer = this.mutationObservers.get(observerId);
    if (observer) {
      observer.disconnect();
      this.mutationObservers.delete(observerId);
    }
  }

  /**
   * الانتظار حتى اكتمال تحميل الصور
   */
  async waitForImagesLoaded(page: any, timeout: number = 10000): Promise<boolean> {
    try {
      return await page.evaluate((timeoutMs: number) => {
        return new Promise((resolve) => {
          const startTime = Date.now();

          const checkImages = () => {
            const images = document.querySelectorAll('img');
            let allLoaded = true;

            images.forEach((img: HTMLImageElement) => {
              if (!img.complete || img.naturalHeight === 0) {
                allLoaded = false;
              }
            });

            if (allLoaded) {
              resolve(true);
              return;
            }

            if (Date.now() - startTime > timeoutMs) {
              resolve(false);
              return;
            }

            setTimeout(checkImages, 100);
          };

          checkImages();
        });
      }, timeout);
    } catch (error) {
      console.debug(`Image loading check failed: ${error}`);
      return false;
    }
  }

  /**
   * الانتظار حتى اكتمال طلبات الشبكة
   */
  async waitForNetworkIdle(page: any, timeout: number = 10000): Promise<boolean> {
    try {
      // This is a simplified implementation
      // Real implementation would need to hook into fetch/XHR

      await page.evaluate((timeoutMs: number) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          let lastActivityTime = Date.now();

          // Check for ongoing XHR/fetch requests
          const checkNetwork = () => {
            // Simple check: if document has loading indicators, wait
            const loadingElements = document.querySelectorAll(
              '.loading, [data-loading], .spinner, .progress'
            );

            if (loadingElements.length === 0) {
              const now = Date.now();
              if (now - lastActivityTime > 1000) {
                resolve(true);
                return;
              }
            } else {
              lastActivityTime = Date.now();
            }

            if (Date.now() - startTime > timeoutMs) {
              resolve(false);
              return;
            }

            setTimeout(checkNetwork, 200);
          };

          checkNetwork();
        });
      }, timeout);

      return true;
    } catch (error) {
      console.debug(`Network idle check failed: ${error}`);
      return true; // Continue anyway
    }
  }

  /**
   * الحصول على سجل التغييرات
   */
  getMutationHistory(limit?: number): MutationEvent[] {
    if (limit) {
      return this.mutationHistory.slice(-limit);
    }
    return [...this.mutationHistory];
  }

  /**
   * مسح السجل
   */
  clearMutationHistory(): void {
    this.mutationHistory = [];
  }

  // =================== Private Methods ===================

  private async waitForElementWithMutationObserver(
    page: any,
    selector: string,
    timeout: number,
    stabilityDelay: number
  ): Promise<boolean> {
    try {
      return await page.evaluate(
        ({ selector, timeout: timeoutMs, stabilityDelay: delayMs }) => {
          return new Promise<boolean>((resolve) => {
            const startTime = Date.now();

            const checkElement = () => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(true);
                return;
              }

              if (Date.now() - startTime > timeoutMs) {
                resolve(false);
                return;
              }

              setTimeout(checkElement, 100);
            };

            const observer = new MutationObserver(() => {
              checkElement();
            });

            observer.observe(document.documentElement, {
              childList: true,
              subtree: true,
            });

            checkElement();

            // Cleanup
            setTimeout(() => observer.disconnect(), timeoutMs);
          });
        },
        { selector, timeout, stabilityDelay }
      );
    } catch (error) {
      console.debug(`Mutation observer wait failed: ${error}`);
      return false;
    }
  }

  private getMutationType(mutation: MutationRecord): MutationEvent['type'] {
    if (mutation.type === 'childList') {
      if (mutation.addedNodes.length > 0) return 'added';
      if (mutation.removedNodes.length > 0) return 'removed';
      return 'modified';
    }
    if (mutation.type === 'characterData') return 'text-changed';
    return 'modified';
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getNodeCount(mutation: MutationRecord): number {
    return mutation.addedNodes.length + mutation.removedNodes.length;
  }

  private async isElementVisible(page: any, selector: string): Promise<boolean> {
    try {
      return await page.evaluate((sel: string) => {
        const element = document.querySelector(sel);
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }, selector);
    } catch {
      return false;
    }
  }
}

/**
 * Create and export singleton instance
 */
let observerInstance: DynamicContentObserver | null = null;

export function getDynamicContentObserver(): DynamicContentObserver {
  if (!observerInstance) {
    observerInstance = new DynamicContentObserver();
  }
  return observerInstance;
}
