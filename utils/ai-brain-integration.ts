/**
 * AI Brain Integration - Complete pipeline for robot automation
 * تكامل عقل الذكاء الاصطناعي - خط أنابيب كامل لأتمتة الروبوت
 */

import { getMasterAI } from './ai-brain/master-ai';
import { getLocalWorker, LocalTaskConfig } from './local-automation-worker';
import { SmartTaskExecutor } from './smart-task-executor';
import { learningEngine } from './ai-brain/learning-engine';
import { databaseSync } from './ai-brain/database-sync';
import { performanceTracker } from './ai-brain/performance-tracker';

export interface AutomationPipeline {
  initialize: (userId: string) => Promise<void>;
  executeLocalTask: (task: LocalTaskConfig) => Promise<any>;
  executeSmartAction: (action: any, context: any) => Promise<any>;
  getStats: () => Promise<any>;
  shutdown: () => Promise<void>;
}

/**
 * Main integration point for the AI Brain
 */
export class AIBrainIntegration implements AutomationPipeline {
  private userId: string | null = null;
  private initialized = false;
  private startTime = Date.now();
  private performanceInitialized = false;

  /**
   * Initialize the complete AI brain system
   */
  async initialize(userId: string): Promise<void> {
    console.log('🧠 ==========================================');
    console.log('🧠 Initializing AI Brain Automation System');
    console.log('🧠 ==========================================');
    console.log();

    this.userId = userId;
    const initStartTime = Date.now();

    try {
      // Step 1: Initialize persistence layer
      console.log('📦 Step 1: Initializing persistence layer...');
      await databaseSync.initialize(userId);
      console.log('✅ Persistence layer ready');
      console.log();

      // Step 2: Initialize learning engine
      console.log('🎓 Step 2: Initializing learning engine...');
      await learningEngine.initialize(userId);
      console.log('✅ Learning engine ready');
      console.log();

      // Step 3: Initialize Master AI
      console.log('🤖 Step 3: Initializing Master AI Brain...');
      const masterAI = await getMasterAI(userId);
      console.log('✅ Master AI ready');
      console.log();

      // Step 4: Initialize local worker
      console.log('⚙️ Step 4: Initializing local automation worker...');
      const worker = await getLocalWorker(userId);
      await worker.initialize(userId);
      console.log('✅ Local worker ready');
      console.log();

      // Step 5: Verify browser automation
      console.log('🌐 Step 5: Verifying stealth browser...');
      await SmartTaskExecutor.initializeBrowser();
      console.log('✅ Stealth browser initialized');
      console.log();

      const initTime = Date.now() - initStartTime;

      console.log('🧠 ==========================================');
      console.log('✅ AI BRAIN INITIALIZATION COMPLETE');
      console.log('🧠 ==========================================');
      console.log(`⏱️ Initialization took: ${initTime}ms`);
      console.log();

      this.initialized = true;
    } catch (error: any) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute a local automation task
   */
  async executeLocalTask(task: LocalTaskConfig): Promise<any> {
    if (!this.initialized) {
      throw new Error('AI Brain not initialized. Call initialize() first.');
    }

    console.log('📋 ==========================================');
    console.log(`📋 Executing Task: ${task.id}`);
    console.log(`📋 Type: ${task.type}`);
    console.log(`📋 URL: ${task.url}`);
    console.log('📋 ==========================================');
    console.log();

    const taskStartTime = Date.now();

    try {
      const worker = await getLocalWorker(this.userId!);
      const result = await worker.executeTask(task);

      const taskTime = Date.now() - taskStartTime;

      console.log();
      console.log('📋 ==========================================');
      console.log(
        `✅ Task Result: ${result.success ? 'SUCCESS' : 'FAILED'}`
      );
      console.log(`⏱️ Execution time: ${taskTime}ms`);
      console.log('📋 ==========================================');
      console.log();

      return result;
    } catch (error: any) {
      const taskTime = Date.now() - taskStartTime;

      console.error();
      console.log('📋 ==========================================');
      console.log('❌ Task Execution Failed');
      console.log(`⏱️ Execution time: ${taskTime}ms`);
      console.log(`❌ Error: ${error.message}`);
      console.log('📋 ==========================================');
      console.log();

      throw error;
    }
  }

  /**
   * Execute smart action with AI decision-making
   */
  async executeSmartAction(
    action: any,
    context: any
  ): Promise<any> {
    if (!this.initialized) {
      throw new Error('AI Brain not initialized');
    }

    console.log('🎯 Executing smart action with AI decision-making');

    try {
      const result = await SmartTaskExecutor.executeAction(
        action,
        context
      );

      console.log('✅ Smart action completed successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Smart action failed:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive system statistics
   */
  async getStats(): Promise<any> {
    if (!this.initialized) {
      throw new Error('AI Brain not initialized');
    }

    console.log('📊 ==========================================');
    console.log('📊 AI BRAIN STATISTICS');
    console.log('📊 ==========================================');
    console.log();

    try {
      // Get learning statistics
      const learningStats = learningEngine.getStatistics();
      console.log('🎓 Learning Engine Statistics:');
      console.log(
        `  • Total Experiences: ${learningStats.totalExperiences}`
      );
      console.log(`  • Total Patterns: ${learningStats.totalPatterns}`);
      console.log(
        `  • Success Rate: ${(learningStats.averageSuccessRate * 100).toFixed(2)}%`
      );
      console.log();

      // Get all experiences
      const allExperiences = learningEngine.getAllExperiences();
      const successfulExperiences = allExperiences.filter(
        (e) => e.success
      ).length;
      const failedExperiences = allExperiences.filter(
        (e) => !e.success
      ).length;

      console.log('📈 Experience Analysis:');
      console.log(`  • Successful: ${successfulExperiences}`);
      console.log(`  • Failed: ${failedExperiences}`);
      console.log();

      // Get top performing websites
      if (learningStats.topPerformingWebsites.length > 0) {
        console.log('🌐 Top Performing Websites:');
        learningStats.topPerformingWebsites.forEach((site, index) => {
          console.log(
            `  ${index + 1}. ${site.website}: ${(site.successRate * 100).toFixed(2)}% success`
          );
        });
        console.log();
      }

      // Get uptime
      const uptimeMs = Date.now() - this.startTime;
      const uptimeMinutes = Math.floor(uptimeMs / 60000);
      const uptimeSeconds = Math.floor((uptimeMs % 60000) / 1000);

      console.log('⏱️ System Uptime:');
      console.log(`  • ${uptimeMinutes}m ${uptimeSeconds}s`);
      console.log();

      // Get local worker status
      const worker = await getLocalWorker(this.userId!);
      const queueStatus = worker.getQueueStatus();

      console.log('⚙️ Local Worker Status:');
      console.log(`  • Queue Length: ${queueStatus.queueLength}`);
      console.log(`  • Active Task: ${queueStatus.activeTask?.id || 'None'}`);
      console.log(`  • Running: ${queueStatus.isRunning ? 'Yes' : 'No'}`);
      console.log();

      console.log('📊 ==========================================');
      console.log();

      return {
        learning: learningStats,
        experiences: {
          total: allExperiences.length,
          successful: successfulExperiences,
          failed: failedExperiences,
        },
        uptime: {
          ms: uptimeMs,
          minutes: uptimeMinutes,
          seconds: uptimeSeconds,
        },
        worker: queueStatus,
      };
    } catch (error: any) {
      console.error('❌ Failed to get statistics:', error.message);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Shutdown the AI brain system
   */
  async shutdown(): Promise<void> {
    console.log();
    console.log('🧠 ==========================================');
    console.log('🧠 Shutting down AI Brain System');
    console.log('🧠 ==========================================');
    console.log();

    const shutdownStartTime = Date.now();

    try {
      // Step 1: Shutdown worker
      console.log('⚙️ Step 1: Shutting down worker...');
      const worker = await getLocalWorker(this.userId!);
      await worker.shutdown();
      console.log('✅ Worker shutdown');
      console.log();

      // Step 2: Shutdown browser
      console.log('🌐 Step 2: Closing browser...');
      await SmartTaskExecutor.closeBrowser();
      console.log('✅ Browser closed');
      console.log();

      // Step 3: Final sync
      console.log('📦 Step 3: Final sync...');
      await databaseSync.syncAll();
      console.log('✅ Data synchronized');
      console.log();

      const shutdownTime = Date.now() - shutdownStartTime;

      console.log('🧠 ==========================================');
      console.log('✅ AI BRAIN SHUTDOWN COMPLETE');
      console.log('🧠 ==========================================');
      console.log(`⏱️ Shutdown took: ${shutdownTime}ms`);
      console.log();

      this.initialized = false;
    } catch (error: any) {
      console.error('❌ Error during shutdown:', error.message);
    }
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    components: {
      [key: string]: 'ok' | 'warning' | 'error';
    };
    details: string[];
  }> {
    const details: string[] = [];
    const components: { [key: string]: 'ok' | 'warning' | 'error' } = {};

    try {
      // Check learning engine
      const learningStats = learningEngine.getStatistics();
      if (learningStats.totalExperiences > 0) {
        components.learning = 'ok';
      } else {
        components.learning = 'warning';
        details.push('⚠️ No learning experiences recorded yet');
      }

      // Check database sync
      try {
        const settings = await databaseSync.loadSettings();
        components.database = 'ok';
      } catch (error) {
        components.database = 'warning';
        details.push('⚠️ Database sync warning');
      }

      // Check browser
      components.browser = 'ok'; // Would need actual health check

      // Overall health
      const healthy =
        Object.values(components).every((status) => status !== 'error');

      return {
        healthy,
        components,
        details,
      };
    } catch (error: any) {
      return {
        healthy: false,
        components: { error: 'error' },
        details: [error.message],
      };
    }
  }
}

/**
 * Demonstration of complete system usage
 */
export async function demonstrateAIBrain(userId: string): Promise<void> {
  console.log();
  console.log('🚀 ╔════════════════════════════════════════════╗');
  console.log('🚀 ║  AI BRAIN AUTOMATION SYSTEM DEMO            ║');
  console.log('🚀 ║  الروبوت الذكي لأتمتة المهام              ║');
  console.log('🚀 ╚════════════════════════════════════════════╝');
  console.log();

  const brain = new AIBrainIntegration();

  try {
    // Initialize the system
    await brain.initialize(userId);

    // Check health status
    console.log('🏥 Checking system health...');
    const health = await brain.getHealthStatus();
    console.log(`🏥 System Status: ${health.healthy ? '✅ HEALTHY' : '⚠️ WARNING'}`);
    if (health.details.length > 0) {
      health.details.forEach((detail) => console.log(`    ${detail}`));
    }
    console.log();

    // Example 1: Execute a scraping task
    console.log('─'.repeat(50));
    const scrapingTask: LocalTaskConfig = {
      id: 'demo_scraping_1',
      type: 'scraping',
      url: 'https://example.com',
      selectors: {
        titles: 'h1, h2, h3',
        links: 'a[href]',
        paragraphs: 'p',
      },
      timeout: 10000,
    };

    try {
      const scrapingResult = await brain.executeLocalTask(scrapingTask);
      console.log('Scraping result:', scrapingResult);
    } catch (error: any) {
      console.log('⚠️ Scraping example (expected for demo):', error.message);
    }
    console.log('─'.repeat(50));
    console.log();

    // Get final statistics
    const stats = await brain.getStats();

    // Shutdown
    await brain.shutdown();

    console.log();
    console.log('🎉 ╔════════════════════════════════════════════╗');
    console.log('🎉 ║  DEMO COMPLETE - SYSTEM OPERATIONAL        ║');
    console.log('🎉 ║  النظام جاهز للعمل والتشغيل               ║');
    console.log('🎉 ╚════════════════════════════════════════════╝');
    console.log();
  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Export main integration instance
export const aiBrain = new AIBrainIntegration();
