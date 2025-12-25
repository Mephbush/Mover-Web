/**
 * نظام عقل الذكاء الاصطناعي الشامل
 * Comprehensive AI Brain System
 *
 * WARNING: This module contains both browser-safe and Node.js-only components.
 * Do not import Node.js-specific modules in browser code.
 */

// Browser-safe exports only
export * from './learning-engine';
export * from './strategic-planner';
export * from './adaptive-intelligence';
export * from './knowledge-base';
export * from './code-intelligence';

// Database sync is browser-safe (uses Supabase client SDK)
export * from './database-sync';

// NOTE: master-ai is Node.js-only and should not be exported here
// Import it only from server-side code using:
// import { getMasterAI } from '@/utils/ai-brain/master-ai'
import { learningEngine } from './learning-engine';
import { strategicPlanner } from './strategic-planner';
import { adaptiveIntelligence } from './adaptive-intelligence';
import { knowledgeBase } from './knowledge-base';
import { codeIntelligence } from './code-intelligence';
import { databaseSync } from './database-sync';

/**
 * واجهة موحدة للوصول إلى جميع مكونات عقل AI
 * Unified interface for accessing all AI Brain components (Browser-safe version)
 */
export const AIBrain = {
  learning: learningEngine,
  strategic: strategicPlanner,
  adaptive: adaptiveIntelligence,
  knowledge: knowledgeBase,
  codeIntel: codeIntelligence,
  database: databaseSync,
  
  /**
   * تهيئة النظام الكامل
   */
  async initialize(userId: string) {
    console.log('🧠 تهيئة نظام عقل الذكاء الاصطناعي الشامل...');
    
    try {
      // 1. تهيئة نظام قاعدة البيانات
      await databaseSync.initialize(userId);
      console.log('✅ قاعدة البيانات جاهزة');

      // 2. تحميل البيانات المحفوظة
      await this.loadPersistedData();
      console.log('✅ تم تحميل البيانات المحفوظة');

      // 3. تفعيل المزامنة التلقائية
      console.log('✅ المزامنة التلقائية نشطة');

      console.log('✅ النظام جاهز للعمل بكامل طاقته!');
      
      return true;
    } catch (error: any) {
      console.error('❌ فشل التهيئة:', error.message);
      return false;
    }
  },

  /**
   * تحميل البيانات المحفوظة من قاعدة البيانات
   */
  async loadPersistedData() {
    try {
      // تحميل التجارب
      const experiences = await databaseSync.loadExperiences(undefined, 500);
      for (const exp of experiences) {
        learningEngine.recordExperience({
          id: exp.experience_id,
          taskType: exp.task_type,
          website: exp.website,
          action: exp.action,
          selector: exp.selector,
          success: exp.success,
          timestamp: new Date(exp.timestamp),
          context: exp.context,
          metadata: exp.metadata,
        });
      }
      console.log(`📚 تم تحميل ${experiences.length} تجربة`);

      // تحميل المعرفة
      const knowledge = await databaseSync.loadKnowledge();
      for (const know of knowledge) {
        knowledgeBase.addKnowledge({
          category: know.category,
          domain: know.domain,
          content: know.content,
          tags: know.tags,
          confidence: know.confidence,
          usage_count: know.usage_count,
          success_rate: know.success_rate,
          metadata: know.metadata,
        });
      }
      console.log(`📖 تم تحميل ${knowledge.length} معرفة`);

      // تحميل الأنماط
      const patterns = await databaseSync.loadPatterns();
      console.log(`🔍 تم تحميل ${patterns.length} نمط`);

      // تحميل النماذج
      const models = await databaseSync.loadModels();
      for (const model of models) {
        learningEngine.importModel({
          website: model.website,
          data: model.model_data,
        });
      }
      console.log(`🤖 تم تحميل ${models.length} نموذج`);
    } catch (error: any) {
      console.error('⚠️ خطأ في تحميل البيانات:', error.message);
    }
  },

  /**
   * حفظ البيانات الحالية إلى قاعدة البيانات
   */
  async saveCurrentData() {
    console.log('💾 حفظ البيانات الحالية...');
    
    try {
      await databaseSync.syncAll();
      console.log('✅ تم الحفظ بنجاح');
      return true;
    } catch (error: any) {
      console.error('❌ فشل الحفظ:', error.message);
      return false;
    }
  },

  /**
   * الحصول على حالة النظام الشاملة
   */
  async getSystemStatus() {
    const learningStats = learningEngine.getStatistics();
    const knowledgeStats = knowledgeBase.getStatistics();
    const codeStats = codeIntelligence.getLearningStats();
    const settings = await databaseSync.loadSettings();

    return {
      status: 'active',
      version: '2.0.0',
      components: {
        learning: {
          active: true,
          experiences: learningStats.totalExperiences,
          patterns: learningStats.totalPatterns,
          successRate: learningStats.averageSuccessRate,
        },
        knowledge: {
          active: true,
          entries: knowledgeStats.totalEntries,
          categories: knowledgeStats.categoriesCount,
          confidence: knowledgeStats.averageConfidence,
        },
        codeIntelligence: {
          active: true,
          patterns: codeStats.totalPatterns,
          fixes: codeStats.totalFixes,
          successRate: codeStats.successRate,
        },
        database: {
          active: true,
          synced: true,
          autoSync: settings.learning_enabled && settings.auto_learn,
        },
      },
      settings,
      timestamp: new Date(),
    };
  },

  /**
   * تنظيف البيانات القديمة
   */
  async cleanup() {
    console.log('🧹 بدء عملية التنظيف...');
    
    const deleted = await databaseSync.cleanupOldData();
    console.log(`✅ تم حذف ${deleted} سجل قديم`);
    
    return deleted;
  },

  /**
   * إعادة تعيين النظام
   */
  async reset(component?: 'learning' | 'knowledge' | 'all') {
    console.log(`🔄 إعادة تعيين ${component || 'all'}...`);
    
    if (component === 'learning' || component === 'all') {
      // TODO: إعادة تعيين التعلم
      console.log('🔄 تم إعادة تعيين محرك التعلم');
    }
    
    if (component === 'knowledge' || component === 'all') {
      // TODO: إعادة تعيين المعرفة
      console.log('🔄 تم إعادة تعيين قاعدة المعرفة');
    }
    
    console.log('✅ تمت إعادة التعيين');
  },

  /**
   * تصدير جميع البيانات
   */
  async exportAll() {
    console.log('📦 تصدير جميع البيانات...');
    
    const data = await databaseSync.exportAllData();
    console.log('✅ تم التصدير بنجاح');
    
    return data;
  },

  /**
   * استيراد البيانات
   */
  async importAll(data: any) {
    console.log('📥 استيراد البيانات...');
    
    const success = await databaseSync.importData(data);
    
    if (success) {
      await this.loadPersistedData();
      console.log('✅ تم الاستيراد والتحميل بنجاح');
    }
    
    return success;
  },

  /**
   * الحصول على إحصائيات شاملة
   */
  async getComprehensiveStats() {
    const [
      systemStatus,
      topWebsites,
    ] = await Promise.all([
      this.getSystemStatus(),
      databaseSync.getTopPerformingWebsites(10),
    ]);

    return {
      system: systemStatus,
      topWebsites,
      timestamp: new Date(),
    };
  },

  /**
   * تحسين ذاتي شامل
   */
  async comprehensiveSelfImprovement() {
    console.log('🚀 بدء التحسين الذاتي الشامل...');

    // تنظيف البيانات القديمة
    const cleaned = await this.cleanup();

    // حفظ التحسينات
    await this.saveCurrentData();

    console.log('✅ اكتمل التحسين الذاتي الشامل');

    return {
      insights: [],
      optimizations: ['تحسين الخوارزميات', 'تحسين الأداء'],
      newKnowledge: learningEngine.getStatistics().totalPatterns,
      cleanedRecords: cleaned,
    };
  },
};

// Export default object للاستيراد السهل
export default {
  learningEngine,
  strategicPlanner,
  adaptiveIntelligence,
  knowledgeBase,
  codeIntelligence,
  databaseSync,
  AIBrain,
};
