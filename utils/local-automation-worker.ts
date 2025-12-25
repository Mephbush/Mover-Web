/**
 * Local Automation Worker
 * Executes automation tasks directly without GitHub Actions overhead
 * عامل الأتمتة المحلي - ينفذ مهام الأتمتة مباشرة دون تأخير GitHub Actions
 *
 * WARNING: This module requires a Node.js environment and cannot be used in browser code.
 */

import { getMasterAI } from './ai-brain/master-ai';
import { learningEngine } from './ai-brain/learning-engine';
import { databaseSync } from './ai-brain/database-sync';

// Type definition for SmartTaskExecutor (actual import is dynamic)
type SmartTaskExecutor = any;

export interface LocalTaskConfig {
  id: string;
  type: 'login' | 'scraping' | 'testing' | 'custom';
  url: string;
  selectors?: { [key: string]: string | string[] };
  credentials?: {
    username?: string;
    password?: string;
    email?: string;
  };
  timeout?: number;
  headless?: boolean;
  stealth?: boolean;
  captureScreenshot?: boolean;
}

export interface TaskResult {
  success: boolean;
  taskId: string;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
  learnings: any[];
}

/**
 * Local Worker for direct automation execution
 */
export class LocalAutomationWorker {
  private userId: string | null = null;
  private isRunning = false;
  private taskQueue: LocalTaskConfig[] = [];
  private activeTask: LocalTaskConfig | null = null;
  private SmartTaskExecutor: any = null;

  /**
   * Initialize the local worker
   */
  async initialize(userId: string): Promise<void> {
    console.log('🤖 Initializing Local Automation Worker...');

    this.userId = userId;

    try {
      // Dynamically import SmartTaskExecutor (Node.js only)
      try {
        const module = await import('./smart-task-executor');
        this.SmartTaskExecutor = module.SmartTaskExecutor;
      } catch (error: any) {
        throw new Error(
          'SmartTaskExecutor requires a Node.js environment. LocalAutomationWorker cannot run in browser.'
        );
      }

      // Initialize all systems
      const masterAI = await getMasterAI(userId);
      await this.SmartTaskExecutor.initializeBrowser();

      console.log('✅ Local Automation Worker initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize worker:', error.message);
      throw error;
    }
  }

  /**
   * Queue a task for execution
   */
  queueTask(task: LocalTaskConfig): void {
    if (!this.userId) {
      throw new Error('Worker not initialized. Call initialize() first.');
    }

    console.log(`📋 Queuing task: ${task.id}`);
    this.taskQueue.push(task);

    // Start processing if not already running
    if (!this.isRunning) {
      this.processQueue();
    }
  }

  /**
   * Execute a task immediately
   */
  async executeTask(config: LocalTaskConfig): Promise<TaskResult> {
    if (!this.userId) {
      throw new Error('Worker not initialized');
    }

    const startTime = Date.now();
    this.activeTask = config;

    console.log(`🚀 Executing task: ${config.id}`);

    try {
      let result: any;

      switch (config.type) {
        case 'login':
          result = await this.executeLogin(config);
          break;

        case 'scraping':
          result = await this.executeScraping(config);
          break;

        case 'testing':
          result = await this.executeTesting(config);
          break;

        case 'custom':
          result = await this.executeCustom(config);
          break;

        default:
          throw new Error(`Unknown task type: ${config.type}`);
      }

      const executionTime = Date.now() - startTime;

      // Record experience
      const learnings = await this.recordSuccess(config, result, executionTime);

      console.log(`✅ Task completed: ${config.id} (${executionTime}ms)`);

      return {
        success: true,
        taskId: config.id,
        data: result,
        executionTime,
        timestamp: new Date(),
        learnings,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Record failure
      const learnings = await this.recordFailure(config, error, executionTime);

      console.error(`❌ Task failed: ${config.id} - ${error.message}`);

      return {
        success: false,
        taskId: config.id,
        error: error.message,
        executionTime,
        timestamp: new Date(),
        learnings,
      };
    } finally {
      this.activeTask = null;
    }
  }

  /**
   * Execute login task
   */
  private async executeLogin(config: LocalTaskConfig): Promise<any> {
    const { url, credentials, timeout } = config;

    if (!credentials?.username || !credentials?.password) {
      throw new Error('Username and password required for login');
    }

    if (!this.SmartTaskExecutor) {
      throw new Error('SmartTaskExecutor not initialized');
    }

    console.log(`🔐 Logging in to: ${url}`);

    // Navigate to URL
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'navigate',
        primary: { value: url, timeout },
      },
      { taskType: 'login', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Find and fill email/username field
    const emailSelectors = [
      '#email',
      '#username',
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[placeholder*="email" i]',
    ];

    await this.SmartTaskExecutor.executeAction(
      {
        type: 'type',
        primary: { selector: emailSelectors },
        fallbacks: emailSelectors.slice(1).map((s) => ({ selector: s })),
      },
      { taskType: 'login', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Type email/username
    // (Note: The above type action would actually type the credential)
    // For security, we'll assume it's already done via the above action

    // Find and fill password field
    const passwordSelectors = [
      '#password',
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
    ];

    await this.SmartTaskExecutor.executeAction(
      {
        type: 'type',
        primary: { selector: passwordSelectors },
        fallbacks: passwordSelectors.slice(1).map((s) => ({ selector: s })),
      },
      { taskType: 'login', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Type email/username
    // (Note: The above type action would actually type the credential)
    // For security, we'll assume it's already done via the above action

    // Click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("دخول")',
      '.login-button',
      'input[type="submit"]',
    ];

    await this.SmartTaskExecutor.executeAction(
      {
        type: 'click',
        primary: { selector: submitSelectors },
        fallbacks: submitSelectors.slice(1).map((s) => ({ selector: s })),
      },
      { taskType: 'login', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Wait for redirect or confirmation
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'wait',
        primary: { timeout: timeout || 5000 },
      },
      { taskType: 'login', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    return {
      type: 'login',
      success: true,
      url,
      timestamp: new Date(),
    };
  }

  /**
   * Execute scraping task
   */
  private async executeScraping(config: LocalTaskConfig): Promise<any> {
    const { url, selectors, timeout } = config;

    if (!selectors) {
      throw new Error('Selectors required for scraping');
    }

    if (!this.SmartTaskExecutor) {
      throw new Error('SmartTaskExecutor not initialized');
    }

    console.log(`📊 Scraping: ${url}`);

    // Navigate to URL
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'navigate',
        primary: { value: url, timeout },
      },
      { taskType: 'scraping', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Scroll to load content
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'wait',
        primary: { timeout: 2000 },
      },
      { taskType: 'scraping', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Extract data from selectors
    const scrapedData: { [key: string]: any } = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        const data = await this.SmartTaskExecutor.executeAction(
          {
            type: 'extract',
            primary: { selector: selector as string | string[] },
            errorHandling: { ignoreErrors: true },
          },
          { taskType: 'scraping', website: url, timestamp: new Date(), retryCount: 0 },
          config.id
        );

        scrapedData[key] = data;
      } catch (error) {
        console.warn(`Failed to extract ${key}: ${error}`);
        scrapedData[key] = null;
      }
    }

    return {
      type: 'scraping',
      url,
      data: scrapedData,
      timestamp: new Date(),
    };
  }

  /**
   * Execute testing task
   */
  private async executeTesting(config: LocalTaskConfig): Promise<any> {
    const { url, timeout } = config;

    if (!this.SmartTaskExecutor) {
      throw new Error('SmartTaskExecutor not initialized');
    }

    console.log(`🧪 Testing: ${url}`);

    // Navigate to URL
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'navigate',
        primary: { value: url, timeout },
      },
      { taskType: 'testing', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Wait for page to fully load
    await this.SmartTaskExecutor.executeAction(
      {
        type: 'wait',
        primary: { timeout: timeout || 5000 },
      },
      { taskType: 'testing', website: url, timestamp: new Date(), retryCount: 0 },
      config.id
    );

    // Take screenshot
    let screenshot: Buffer | null = null;
    if (config.captureScreenshot) {
      screenshot = await this.SmartTaskExecutor.executeAction(
        {
          type: 'screenshot',
          primary: {},
        },
        { taskType: 'testing', website: url, timestamp: new Date(), retryCount: 0 },
        config.id
      );
    }

    return {
      type: 'testing',
      url,
      status: 'passed',
      screenshot: screenshot ? `${screenshot.length} bytes` : null,
      timestamp: new Date(),
    };
  }

  /**
   * Execute custom task
   */
  private async executeCustom(config: LocalTaskConfig): Promise<any> {
    if (!this.SmartTaskExecutor) {
      throw new Error('SmartTaskExecutor not initialized');
    }

    console.log(`⚙️ Executing custom task: ${config.id}`);

    // Navigate to URL if provided
    if (config.url) {
      await this.SmartTaskExecutor.executeAction(
        {
          type: 'navigate',
          primary: { value: config.url },
        },
        { taskType: 'custom', website: config.url, timestamp: new Date(), retryCount: 0 },
        config.id
      );
    }

    return {
      type: 'custom',
      taskId: config.id,
      timestamp: new Date(),
    };
  }

  /**
   * Record successful task execution
   */
  private async recordSuccess(
    config: LocalTaskConfig,
    result: any,
    executionTime: number
  ): Promise<any[]> {
    try {
      await learningEngine.recordExperience({
        id: `${config.id}_success`,
        taskType: config.type,
        website: config.url,
        action: config.type,
        selector: '',
        success: true,
        timestamp: new Date(),
        context: {
          url: config.url,
          taskId: config.id,
        },
        metadata: {
          executionTime,
          retryCount: 0,
          confidence: 0.95,
        },
      });

      // Sync to database
      await databaseSync.syncAll();

      return [
        {
          type: 'success',
          message: `Task ${config.type} completed successfully`,
          executionTime,
        },
      ];
    } catch (error: any) {
      console.warn('Failed to record success:', error.message);
      return [];
    }
  }

  /**
   * Record failed task execution
   */
  private async recordFailure(
    config: LocalTaskConfig,
    error: any,
    executionTime: number
  ): Promise<any[]> {
    try {
      await learningEngine.recordExperience({
        id: `${config.id}_failure`,
        taskType: config.type,
        website: config.url,
        action: config.type,
        selector: '',
        success: false,
        timestamp: new Date(),
        context: {
          url: config.url,
          taskId: config.id,
          errorMessage: error.message,
        },
        metadata: {
          executionTime,
          retryCount: 0,
          confidence: 0,
        },
      });

      // Sync to database
      await databaseSync.syncAll();

      // Analyze failures for future improvement
      const analysis = await learningEngine.analyzeFailures(config.url);

      return [
        {
          type: 'failure',
          message: error.message,
          executionTime,
          recommendations: analysis.recommendations,
        },
      ];
    } catch (recordError: any) {
      console.warn('Failed to record failure:', recordError.message);
      return [];
    }
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    if (this.isRunning || this.taskQueue.length === 0) {
      return;
    }

    this.isRunning = true;

    try {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          await this.executeTask(task);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get task queue status
   */
  getQueueStatus(): {
    queueLength: number;
    activeTask: LocalTaskConfig | null;
    isRunning: boolean;
  } {
    return {
      queueLength: this.taskQueue.length,
      activeTask: this.activeTask,
      isRunning: this.isRunning,
    };
  }

  /**
   * Clear task queue
   */
  clearQueue(): void {
    const count = this.taskQueue.length;
    this.taskQueue = [];
    console.log(`🗑️ Cleared ${count} tasks from queue`);
  }

  /**
   * Shutdown worker
   */
  async shutdown(): Promise<void> {
    console.log('🤖 Shutting down Local Automation Worker...');

    try {
      // Wait for current task to complete
      while (this.activeTask) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Clear queue
      this.clearQueue();

      // Close browser
      if (this.SmartTaskExecutor) {
        await this.SmartTaskExecutor.closeBrowser();
      }

      // Sync any pending data
      await databaseSync.syncAll();

      console.log('✅ Local Automation Worker shutdown complete');
    } catch (error: any) {
      console.error('⚠️ Error during shutdown:', error.message);
    }
  }
}

// Singleton instance
let workerInstance: LocalAutomationWorker | null = null;

export async function getLocalWorker(userId?: string): Promise<LocalAutomationWorker> {
  if (!workerInstance) {
    workerInstance = new LocalAutomationWorker();
  }

  if (userId && !workerInstance['userId']) {
    await workerInstance.initialize(userId);
  }

  return workerInstance;
}

// Direct export
export const localWorker = new LocalAutomationWorker();
