/**
 * Smart Task Executor - Real browser automation with intelligent fallbacks
 * نظام تنفيذ مهام ذكي مع متصفح حقيقي
 *
 * WARNING: This is a Node.js-only module and cannot be imported in browser code.
 */

// Prevent import in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  throw new Error(
    'smart-task-executor.ts is a Node.js-only module. ' +
    'It cannot be imported in browser code.'
  );
}

import { SmartRetryManager, SmartErrorAnalyzer, ErrorContext } from './error-handler';
import { StealthBrowser } from './stealth-browser';

export interface SmartAction {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'extract' | 'screenshot';
  primary: ActionConfig;
  fallbacks?: ActionConfig[];
  conditions?: Condition[];
  errorHandling?: ErrorHandling;
}

export interface ActionConfig {
  selector?: string | string[];
  value?: string;
  timeout?: number;
  waitForNavigation?: boolean;
  customLogic?: string;
}

export interface Condition {
  type: 'element_exists' | 'element_visible' | 'url_contains' | 'text_contains';
  target: string;
  action: 'continue' | 'skip' | 'retry' | 'fail';
}

export interface ErrorHandling {
  ignoreErrors?: boolean;
  retryCount?: number;
  fallbackAction?: SmartAction;
}

/**
 * Smart Task Executor - Real execution engine
 */
export class SmartTaskExecutor {
  private static browser: StealthBrowser | null = null;
  private static retryManager = new SmartRetryManager();

  /**
   * Initialize browser instance
   */
  static async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = new StealthBrowser();
      await this.browser.launch({
        headless: true,
        timeout: 30000,
      });
      console.log('🧠 Brain initialized: Stealth browser ready');
    }
  }

  /**
   * Close browser
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🧠 Brain shutdown complete');
    }
  }

  /**
   * Execute action with intelligent fallbacks
   */
  static async executeAction(
    action: SmartAction,
    context: ErrorContext,
    pageId?: string
  ): Promise<any> {
    await this.initializeBrowser();

    console.log(`🎯 Executing: ${action.type}`);

    // Check preconditions
    if (action.conditions) {
      const conditionResult = await this.checkConditions(action.conditions, pageId);
      if (!conditionResult.shouldContinue) {
        console.log(`⏭️ Skipping action: ${conditionResult.reason}`);
        return null;
      }
    }

    // Try primary action
    try {
      const result = await this.executeActionConfig(
        action.type,
        action.primary,
        pageId
      );
      console.log(`✅ Primary action succeeded`);
      return result;
    } catch (primaryError: any) {
      console.error(`❌ Primary action failed:`, primaryError.message);

      // Analyze error
      const analysis = SmartErrorAnalyzer.analyze(primaryError, context);
      console.log(`📊 Error analysis: ${analysis.type} - ${analysis.severity}`);

      // Try fallbacks
      if (action.fallbacks && action.fallbacks.length > 0) {
        console.log(`🔄 Trying ${action.fallbacks.length} fallbacks...`);

        for (let i = 0; i < action.fallbacks.length; i++) {
          try {
            console.log(`  Fallback ${i + 1}...`);
            const result = await this.executeActionConfig(
              action.type,
              action.fallbacks[i],
              pageId
            );
            console.log(`  ✅ Fallback ${i + 1} succeeded`);
            return result;
          } catch (fallbackError: any) {
            console.error(`  ❌ Fallback ${i + 1} failed:`, fallbackError.message);
            if (i === action.fallbacks.length - 1) {
              throw fallbackError;
            }
          }
        }
      }

      // Handle error handling options
      if (action.errorHandling?.ignoreErrors) {
        console.log(`⚠️ Ignoring error per settings`);
        return null;
      }

      if (action.errorHandling?.fallbackAction) {
        console.log(`🔄 Executing fallback action...`);
        return await this.executeAction(
          action.errorHandling.fallbackAction,
          context,
          pageId
        );
      }

      throw primaryError;
    }
  }

  /**
   * Execute specific action configuration
   */
  private static async executeActionConfig(
    type: string,
    config: ActionConfig,
    pageId?: string
  ): Promise<any> {
    switch (type) {
      case 'navigate':
        return await this.smartNavigate(config, pageId);

      case 'click':
        return await this.smartClick(config, pageId);

      case 'type':
        return await this.smartType(config, pageId);

      case 'wait':
        return await this.smartWait(config, pageId);

      case 'extract':
        return await this.smartExtract(config, pageId);

      case 'screenshot':
        return await this.smartScreenshot(config, pageId);

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Smart navigate with post-navigation checks
   */
  private static async smartNavigate(
    config: ActionConfig,
    pageId?: string
  ): Promise<void> {
    const url = config.value;
    if (!url) throw new Error('URL required for navigation');

    console.log(`🌐 Navigating to: ${url}`);

    if (!this.browser) throw new Error('Browser not initialized');

    await this.browser.navigateTo(url, pageId);

    // Handle post-navigation tasks
    await this.handlePostNavigationChecks(pageId);
  }

  /**
   * Smart click with multiple selector fallbacks
   */
  private static async smartClick(
    config: ActionConfig,
    pageId?: string
  ): Promise<void> {
    const selectors = Array.isArray(config.selector)
      ? config.selector
      : [config.selector];

    if (!this.browser) throw new Error('Browser not initialized');

    for (const selector of selectors) {
      if (!selector) continue;

      try {
        console.log(`  🖱️ Trying to click: ${selector}`);
        await this.browser.humanClick(selector, pageId);
        return;
      } catch (error: any) {
        console.log(`  ⚠️ Failed selector: ${selector}`);

        if (selector === selectors[selectors.length - 1]) {
          throw error;
        }

        continue;
      }
    }

    throw new Error('All click attempts failed');
  }

  /**
   * Smart typing with human-like behavior
   */
  private static async smartType(
    config: ActionConfig,
    pageId?: string
  ): Promise<void> {
    const selector = Array.isArray(config.selector)
      ? config.selector[0]
      : config.selector;
    const text = config.value;

    if (!selector || !text) {
      throw new Error('Selector and text required for typing');
    }

    console.log(`⌨️ Typing in: ${selector}`);

    if (!this.browser) throw new Error('Browser not initialized');

    await this.browser.humanType(selector, text, pageId);
    console.log(`✅ Typed: ${text.substring(0, 20)}...`);
  }

  /**
   * Smart wait with multiple strategies
   */
  private static async smartWait(
    config: ActionConfig,
    pageId?: string
  ): Promise<void> {
    const selector = Array.isArray(config.selector)
      ? config.selector[0]
      : config.selector;
    const timeout = config.timeout || 30000;

    if (!this.browser) throw new Error('Browser not initialized');

    if (selector) {
      console.log(`⏳ Waiting for element: ${selector}`);
      await this.browser.waitForElement(selector, pageId);
      console.log(`✅ Element appeared: ${selector}`);
    } else {
      console.log(`⏳ Waiting ${timeout}ms`);
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  /**
   * Smart data extraction
   */
  private static async smartExtract(
    config: ActionConfig,
    pageId?: string
  ): Promise<any> {
    const selectors = Array.isArray(config.selector)
      ? config.selector
      : [config.selector];

    if (!this.browser) throw new Error('Browser not initialized');

    for (const selector of selectors) {
      if (!selector) continue;

      try {
        console.log(`  📤 Extracting from: ${selector}`);
        const data = await this.browser.extractData(selector, pageId);
        console.log(`  ✅ Extracted ${data.length} items from: ${selector}`);
        return data;
      } catch (error: any) {
        console.log(`  ⚠️ Failed to extract from: ${selector}`);

        if (selector === selectors[selectors.length - 1]) {
          throw error;
        }

        continue;
      }
    }

    throw new Error('All extraction attempts failed');
  }

  /**
   * Take screenshot
   */
  private static async smartScreenshot(
    config: ActionConfig,
    pageId?: string
  ): Promise<Buffer> {
    console.log(`📸 Taking screenshot`);

    if (!this.browser) throw new Error('Browser not initialized');

    const screenshot = await this.browser.takeScreenshot(pageId);
    console.log(`✅ Screenshot taken`);

    return screenshot;
  }

  /**
   * Handle post-navigation checks
   */
  private static async handlePostNavigationChecks(pageId?: string): Promise<void> {
    if (!this.browser) return;

    // Handle popups
    await this.handlePopups(pageId);

    // Handle cookies
    await this.handleCookieBanners(pageId);

    // Handle age verification
    await this.handleAgeVerification(pageId);
  }

  /**
   * Handle popup dialogs
   */
  private static async handlePopups(pageId?: string): Promise<void> {
    if (!this.browser) return;

    const commonPopupSelectors = [
      'button[aria-label="Close"]',
      'button.close',
      '.modal-close',
      '[data-dismiss="modal"]',
      '.popup-close',
      'button:has-text("×")',
      'button:has-text("Close")',
      'button:has-text("إغلاق")',
    ];

    for (const selector of commonPopupSelectors) {
      try {
        const content = await this.browser.getContent(pageId);
        if (content.includes(selector)) {
          console.log(`  🚫 Closing popup: ${selector}`);
          await this.browser.humanClick(selector, pageId);
          return;
        }
      } catch (error) {
        // No popup found, continue
      }
    }
  }

  /**
   * Handle cookie banners
   */
  private static async handleCookieBanners(pageId?: string): Promise<void> {
    if (!this.browser) return;

    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("قبول")',
      'button:has-text("I Agree")',
      'button:has-text("موافق")',
      '#cookie-accept',
      '.cookie-accept',
      '[data-cookie-accept]',
    ];

    for (const selector of cookieSelectors) {
      try {
        const content = await this.browser.getContent(pageId);
        if (content.includes(selector)) {
          console.log(`  🍪 Accepting cookies: ${selector}`);
          await this.browser.humanClick(selector, pageId);
          return;
        }
      } catch (error) {
        // No cookie banner found, continue
      }
    }
  }

  /**
   * Handle age verification
   */
  private static async handleAgeVerification(pageId?: string): Promise<void> {
    if (!this.browser) return;

    const ageSelectors = [
      'button:has-text("I am 18+")',
      'button:has-text("أنا أكبر من 18")',
      'button:has-text("Enter")',
      '.age-verification button',
      '#age-confirm',
    ];

    for (const selector of ageSelectors) {
      try {
        const content = await this.browser.getContent(pageId);
        if (content.includes(selector)) {
          console.log(`  🔞 Confirming age: ${selector}`);
          await this.browser.humanClick(selector, pageId);
          return;
        }
      } catch (error) {
        // No age verification found, continue
      }
    }
  }

  /**
   * Check conditions
   */
  private static async checkConditions(
    conditions: Condition[],
    pageId?: string
  ): Promise<{ shouldContinue: boolean; reason?: string }> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, pageId);

      if (!result.passed) {
        switch (condition.action) {
          case 'skip':
            return { shouldContinue: false, reason: `Condition failed: ${condition.type}` };
          case 'fail':
            throw new Error(`Mandatory condition failed: ${condition.type}`);
          case 'retry':
          case 'continue':
          default:
            continue;
        }
      }
    }

    return { shouldContinue: true };
  }

  /**
   * Evaluate single condition
   */
  private static async evaluateCondition(
    condition: Condition,
    pageId?: string
  ): Promise<{ passed: boolean }> {
    if (!this.browser) return { passed: false };

    try {
      const content = await this.browser.getContent(pageId);

      switch (condition.type) {
        case 'element_exists':
          return { passed: content.includes(condition.target) };

        case 'element_visible':
          try {
            await this.browser.waitForElement(condition.target, pageId);
            return { passed: true };
          } catch {
            return { passed: false };
          }

        case 'url_contains':
          // Would need page URL
          return { passed: true };

        case 'text_contains':
          return { passed: content.includes(condition.target) };

        default:
          return { passed: true };
      }
    } catch (error) {
      return { passed: false };
    }
  }
}

/**
 * Smart Task Templates - Pre-built task configurations
 */
export class SmartTaskTemplates {
  /**
   * Login template
   */
  static login(url: string, username: string, password: string): SmartAction[] {
    return [
      {
        type: 'navigate',
        primary: { value: url },
        errorHandling: { retryCount: 3 },
      },
      {
        type: 'type',
        primary: {
          selector: ['#username', '#email', 'input[type="email"]'],
        },
        fallbacks: [
          { selector: 'input[type="text"]' },
          { selector: 'input[placeholder*="username" i]' },
        ],
      },
      {
        type: 'type',
        primary: {
          selector: ['#password', 'input[type="password"]'],
        },
        fallbacks: [{ selector: 'input[placeholder*="password" i]' }],
      },
      {
        type: 'click',
        primary: {
          selector: ['button[type="submit"]', 'button:has-text("Login")'],
        },
        fallbacks: [{ selector: 'input[type="submit"]' }],
      },
      {
        type: 'wait',
        primary: { timeout: 3000 },
      },
    ];
  }

  /**
   * Scraping template
   */
  static scraping(
    url: string,
    selectors: { [key: string]: string | string[] }
  ): SmartAction[] {
    const actions: SmartAction[] = [
      {
        type: 'navigate',
        primary: { value: url },
      },
    ];

    Object.entries(selectors).forEach(([key, selector]) => {
      actions.push({
        type: 'extract',
        primary: { selector },
        errorHandling: { ignoreErrors: true },
      });
    });

    return actions;
  }

  /**
   * Testing template
   */
  static testing(
    url: string,
    checks: Array<{ type: string; target: string }>
  ): SmartAction[] {
    const actions: SmartAction[] = [
      {
        type: 'navigate',
        primary: { value: url },
      },
    ];

    checks.forEach((check) => {
      actions.push({
        type: 'wait',
        primary: {
          selector: check.target,
          timeout: 10000,
        },
      });
    });

    actions.push({
      type: 'screenshot',
      primary: {},
    });

    return actions;
  }
}
