/**
 * نظام المزامنة مع قاعدة البيانات
 */

import { supabase } from '../../lib/supabase';

export class DatabaseSync {
  private userId: string | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingSync: Map<string, any[]> = new Map();
  private settings: AIBrainSettings | null = null;
  private options: SyncOptions;
  private isDemoUser: boolean = false;
  private localStoragePrefix: string = 'ai_brain_';

  constructor(options: SyncOptions = {}) {
    this.options = {
      autoSync: true,
      syncInterval: 60000, // دقيقة واحدة
      batchSize: 50,
      retryAttempts: 3,
      ...options,
    };
  }

  /**
   * تهيئة النظام
   */
  async initialize(userId: string): Promise<void> {
    console.log('🔄 تهيئة نظام المزامنة...');
    
    this.userId = userId;
    
    // التحقق من نوع المستخدم
    this.isDemoUser = userId.startsWith('demo_');
    
    if (this.isDemoUser) {
      console.log('👤 مستخدم تجريبي - استخدام localStorage');
    }

    // تحميل الإعدادات
    await this.loadSettings();

    // بدء المزامنة التلقائية فقط للمستخدمين الحقيقيين
    if (this.options.autoSync && !this.isDemoUser) {
      this.startAutoSync();
    }

    console.log('✅ نظام المزامنة جاهز');
  }

  /**
   * تحميل إعدادات عقل AI
   */
  async loadSettings(): Promise<AIBrainSettings> {
    if (!this.userId) throw new Error('User not initialized');

    // للمستخدمين التجريبيين، استخدم localStorage فقط
    if (this.isDemoUser) {
      const localSettings = localStorage.getItem(`${this.localStoragePrefix}settings_${this.userId}`);
      if (localSettings) {
        this.settings = JSON.parse(localSettings);
        return this.settings;
      }
      // إنشاء إعدادات افتراضية
      const defaultSettings = this.getDefaultSettings();
      this.settings = defaultSettings;
      localStorage.setItem(`${this.localStoragePrefix}settings_${this.userId}`, JSON.stringify(defaultSettings));
      return defaultSettings;
    }

    try {
      const { data, error } = await supabase
        .from('ai_brain_settings')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // لا توجد إعدادات، إنشاء افتراضية
          return await this.createDefaultSettings();
        }
        throw error;
      }

      this.settings = data as AIBrainSettings;
      console.log('✅ تم تحميل إعدادات عقل AI');
      
      return this.settings;
    } catch (error: any) {
      console.error('❌ فشل تحميل الإعدادات:', error.message);
      
      // إرجاع إعدادات افتراضية بدون حفظ في قاعدة البيانات
      const defaultSettings = this.getDefaultSettings();
      
      this.settings = defaultSettings;
      return defaultSettings;
    }
  }

  /**
   * الحصول على الإعدادات الافتراضية
   */
  private getDefaultSettings(): AIBrainSettings {
    return {
      learning_enabled: true,
      auto_learn: true,
      min_confidence_threshold: 0.6,
      max_experiences_per_website: 1000,
      experience_retention_days: 90,
      knowledge_sharing_enabled: false,
      auto_knowledge_cleanup: true,
      min_knowledge_confidence: 0.5,
      max_knowledge_entries: 5000,
      auto_adaptation_enabled: true,
      adaptation_sensitivity: 'medium',
      require_confirmation: false,
      code_analysis_enabled: true,
      auto_fix_enabled: true,
      auto_fix_confidence_threshold: 0.7,
      code_quality_threshold: 70,
      max_retry_attempts: 3,
      learning_batch_size: 100,
      cache_enabled: true,
      cache_ttl_minutes: 60,
      experimental_features_enabled: false,
      debug_mode: false,
      telemetry_enabled: true,
    };
  }

  /**
   * حفظ إعدادات عقل AI
   */
  async saveSettings(settings: Partial<AIBrainSettings>): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { error } = await supabase
        .from('ai_brain_settings')
        .upsert({
          user_id: this.userId,
          ...settings,
        });

      if (error) throw error;

      this.settings = { ...this.settings, ...settings } as AIBrainSettings;
      console.log('✅ تم حفظ الإعدادات');
    } catch (error: any) {
      console.error('❌ فشل حفظ الإعدادات:', error.message);
      throw error;
    }
  }

  /**
   * حفظ تجربة تعلم
   */
  async saveExperience(experience: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');
    if (!this.settings?.learning_enabled) return;

    // إضافة إلى قائمة الانتظار
    this.addToPendingSync('experiences', {
      user_id: this.userId,
      experience_id: experience.id,
      task_type: experience.taskType,
      website: experience.website,
      action: experience.action,
      selector: experience.selector,
      success: experience.success,
      timestamp: experience.timestamp,
      context: experience.context,
      metadata: experience.metadata,
      execution_time: experience.metadata?.executionTime,
      retry_count: experience.metadata?.retryCount || 0,
      confidence: experience.metadata?.confidence || 0.5,
    });

    // مزامنة فورية إذا كانت التجربة مهمة
    if (experience.success || experience.metadata?.critical) {
      await this.syncExperiences();
    }
  }

  /**
   * حفظ معرفة
   */
  async saveKnowledge(knowledge: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    this.addToPendingSync('knowledge', {
      user_id: this.userId,
      knowledge_id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: knowledge.category,
      domain: knowledge.domain,
      content: knowledge.content,
      tags: knowledge.tags,
      confidence: knowledge.confidence,
      usage_count: knowledge.usage_count || 0,
      success_rate: knowledge.success_rate || 0,
      metadata: knowledge.metadata,
    });

    // مزامنة فورية للمعرفة عالية الثقة
    if (knowledge.confidence > 0.8) {
      await this.syncKnowledge();
    }
  }

  /**
   * حفظ نمط مكتشف
   */
  async savePattern(pattern: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { error } = await supabase
        .from('ai_patterns')
        .upsert({
          user_id: this.userId,
          pattern_id: pattern.id,
          website: pattern.website,
          task_type: pattern.taskType,
          pattern_type: pattern.type,
          pattern_data: pattern.data,
          occurrence_count: pattern.count || 1,
          success_rate: pattern.successRate || 0,
          confidence: pattern.confidence || 0.5,
          last_seen: new Date(),
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ فشل حفظ النمط:', error.message);
    }
  }

  /**
   * حفظ تكيف
   */
  async saveAdaptation(adaptation: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');
    if (!this.settings?.auto_adaptation_enabled) return;

    try {
      const { error } = await supabase
        .from('ai_adaptations')
        .insert({
          user_id: this.userId,
          adaptation_id: `adapt_${Date.now()}`,
          website: adaptation.website,
          change_type: adaptation.changeType,
          detected_at: adaptation.detectedAt,
          old_pattern: adaptation.oldPattern,
          new_pattern: adaptation.newPattern,
          severity: adaptation.severity,
          adaptation_applied: adaptation.applied || false,
          adaptation_data: adaptation.data,
          success: adaptation.success,
        });

      if (error) throw error;
      console.log('✅ تم حفظ التكيف');
    } catch (error: any) {
      console.error('❌ فشل حفظ التكيف:', error.message);
    }
  }

  /**
   * حفظ نموذج تعلم
   */
  async saveModel(model: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { error } = await supabase
        .from('ai_models')
        .upsert({
          user_id: this.userId,
          model_id: model.id,
          website: model.website,
          model_type: model.type,
          model_data: model.data,
          training_samples: model.samples || 0,
          accuracy: model.accuracy || 0,
          version: model.version || 1,
          is_active: model.active !== false,
          metadata: model.metadata,
        });

      if (error) throw error;
      console.log('✅ تم حفظ النموذج');
    } catch (error: any) {
      console.error('❌ فشل حفظ النموذج:', error.message);
    }
  }

  /**
   * تحميل تجارب التعلم
   */
  async loadExperiences(website?: string, limit: number = 100): Promise<any[]> {
    if (!this.userId) throw new Error('User not initialized');

    // للمستخدمين التجريبيين، استخدم localStorage
    if (this.isDemoUser) {
      const localData = localStorage.getItem(`${this.localStoragePrefix}experiences_${this.userId}`);
      if (!localData) return [];
      
      try {
        const allExperiences = JSON.parse(localData);
        let filtered = allExperiences;
        
        if (website) {
          filtered = allExperiences.filter((exp: any) => exp.website === website);
        }
        
        return filtered.slice(0, limit);
      } catch {
        return [];
      }
    }

    try {
      let query = supabase
        .from('ai_experiences')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (website) {
        query = query.eq('website', website);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ فشل تحميل التجارب:', error.message);
      return [];
    }
  }

  /**
   * تحميل قاعدة المعرفة
   */
  async loadKnowledge(filters?: {
    category?: string;
    domain?: string;
    tags?: string[];
    minConfidence?: number;
  }): Promise<any[]> {
    if (!this.userId) throw new Error('User not initialized');

    // للمستخدمين التجريبيين، استخدم localStorage
    if (this.isDemoUser) {
      const localData = localStorage.getItem(`${this.localStoragePrefix}knowledge_${this.userId}`);
      if (!localData) return [];
      
      try {
        let knowledge = JSON.parse(localData);
        
        if (filters?.category) {
          knowledge = knowledge.filter((k: any) => k.category === filters.category);
        }
        if (filters?.domain) {
          knowledge = knowledge.filter((k: any) => k.domain === filters.domain);
        }
        if (filters?.minConfidence) {
          knowledge = knowledge.filter((k: any) => k.confidence >= filters.minConfidence!);
        }
        
        return knowledge;
      } catch {
        return [];
      }
    }

    try {
      let query = supabase
        .from('ai_knowledge')
        .select('*')
        .eq('user_id', this.userId)
        .order('confidence', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.domain) {
        query = query.eq('domain', filters.domain);
      }

      if (filters?.minConfidence) {
        query = query.gte('confidence', filters.minConfidence);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ فشل تحميل المعرفة:', error.message);
      return [];
    }
  }

  /**
   * تحميل الأنماط
   */
  async loadPatterns(website?: string): Promise<any[]> {
    if (!this.userId) throw new Error('User not initialized');

    // للمستخدمين التجريبيين، استخدم localStorage
    if (this.isDemoUser) {
      const localData = localStorage.getItem(`${this.localStoragePrefix}patterns_${this.userId}`);
      if (!localData) return [];
      
      try {
        const patterns = JSON.parse(localData);
        if (website) {
          return patterns.filter((p: any) => p.website === website);
        }
        return patterns;
      } catch {
        return [];
      }
    }

    try {
      let query = supabase
        .from('ai_patterns')
        .select('*')
        .eq('user_id', this.userId)
        .order('success_rate', { ascending: false });

      if (website) {
        query = query.eq('website', website);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ فشل تحميل الأنماط:', error.message);
      return [];
    }
  }

  /**
   * تحميل النماذج
   */
  async loadModels(website?: string): Promise<any[]> {
    if (!this.userId) throw new Error('User not initialized');

    // للمستخدمين التجريبيين، استخدم localStorage
    if (this.isDemoUser) {
      const localData = localStorage.getItem(`${this.localStoragePrefix}models_${this.userId}`);
      if (!localData) return [];
      
      try {
        const models = JSON.parse(localData);
        let filtered = models.filter((m: any) => m.is_active !== false);
        
        if (website) {
          filtered = filtered.filter((m: any) => m.website === website);
        }
        
        return filtered;
      } catch {
        return [];
      }
    }

    try {
      let query = supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .order('accuracy', { ascending: false });

      if (website) {
        query = query.eq('website', website);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ فشل تحميل النماذج:', error.message);
      return [];
    }
  }

  /**
   * حفظ إحصائيات الأداء
   */
  async savePerformanceStats(stats: any): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { error } = await supabase
        .from('ai_performance_stats')
        .insert({
          user_id: this.userId,
          website: stats.website,
          stat_type: stats.type || 'daily',
          period_start: stats.periodStart,
          period_end: stats.periodEnd,
          total_tasks: stats.totalTasks || 0,
          successful_tasks: stats.successfulTasks || 0,
          failed_tasks: stats.failedTasks || 0,
          success_rate: stats.successRate || 0,
          average_execution_time: stats.avgExecutionTime || 0,
          total_experiences: stats.totalExperiences || 0,
          total_patterns: stats.totalPatterns || 0,
          total_adaptations: stats.totalAdaptations || 0,
          code_fixes_applied: stats.codeFixesApplied || 0,
          code_fix_success_rate: stats.codeFixSuccessRate || 0,
          learning_progress: stats.learningProgress || 0,
          knowledge_growth: stats.knowledgeGrowth || 0,
          model_accuracy: stats.modelAccuracy || 0,
          confidence_level: stats.confidenceLevel || 0,
          stats_data: stats.data || {},
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('❌ فشل حفظ الإحصائيات:', error.message);
    }
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  async getPerformanceStats(
    type: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'daily',
    website?: string
  ): Promise<any> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      let query = supabase
        .from('ai_performance_stats')
        .select('*')
        .eq('user_id', this.userId)
        .eq('stat_type', type)
        .order('period_start', { ascending: false })
        .limit(1);

      if (website) {
        query = query.eq('website', website);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.[0] || null;
    } catch (error: any) {
      console.error('❌ فشل تحميل الإحصائيات:', error.message);
      return null;
    }
  }

  /**
   * تنظيف البيانات القديمة
   */
  async cleanupOldData(): Promise<number> {
    if (!this.userId) throw new Error('User not initialized');
    if (!this.settings) await this.loadSettings();

    try {
      const { data, error } = await supabase
        .rpc('cleanup_old_ai_data', {
          p_user_id: this.userId,
          p_retention_days: this.settings?.experience_retention_days || 90,
        });

      if (error) throw error;

      console.log(`🧹 تم حذف ${data} سجل قديم`);
      return data || 0;
    } catch (error: any) {
      console.error('❌ فشل التنظيف:', error.message);
      return 0;
    }
  }

  /**
   * حساب معدل النجاح
   */
  async calculateSuccessRate(website?: string, days: number = 30): Promise<number> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { data, error } = await supabase
        .rpc('calculate_success_rate', {
          p_user_id: this.userId,
          p_website: website,
          p_days: days,
        });

      if (error) throw error;

      return data || 0;
    } catch (error: any) {
      console.error('❌ فشل حساب معدل النجاح:', error.message);
      return 0;
    }
  }

  /**
   * الحصول على أفضل المواقع أداءً
   */
  async getTopPerformingWebsites(limit: number = 10): Promise<any[]> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { data, error } = await supabase
        .rpc('get_top_performing_websites', {
          p_user_id: this.userId,
          p_limit: limit,
        });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ فشل تحميل الواقع:', error.message);
      return [];
    }
  }

  /**
   * مزامنة شاملة
   */
  async syncAll(): Promise<void> {
    console.log('🔄 بدء المزامنة الشاملة...');

    await Promise.all([
      this.syncExperiences(),
      this.syncKnowledge(),
    ]);

    console.log('✅ اكتملت المزامنة');
  }

  /**
   * بدء المزامنة التلقائية
   */
  private startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(async () => {
      await this.syncAll();
    }, this.options.syncInterval);

    console.log('✅ تم تفعيل المزامنة التلقائية');
  }

  /**
   * إيقاف المزامنة التلقائية
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ تم إيقاف المزامنة التلقائية');
    }
  }

  // ====== وظائف خاصة ======

  private async createDefaultSettings(): Promise<AIBrainSettings> {
    const defaultSettings: AIBrainSettings = {
      learning_enabled: true,
      auto_learn: true,
      min_confidence_threshold: 0.6,
      max_experiences_per_website: 1000,
      experience_retention_days: 90,
      knowledge_sharing_enabled: false,
      auto_knowledge_cleanup: true,
      min_knowledge_confidence: 0.5,
      max_knowledge_entries: 5000,
      auto_adaptation_enabled: true,
      adaptation_sensitivity: 'medium',
      require_confirmation: false,
      code_analysis_enabled: true,
      auto_fix_enabled: true,
      auto_fix_confidence_threshold: 0.7,
      code_quality_threshold: 70,
      max_retry_attempts: 3,
      learning_batch_size: 100,
      cache_enabled: true,
      cache_ttl_minutes: 60,
      experimental_features_enabled: false,
      debug_mode: false,
      telemetry_enabled: true,
    };

    // عدم محاولة الحفظ في قاعدة البيانات للمستخدمين التجريبيين
    if (!this.isDemoUser) {
      try {
        await this.saveSettings(defaultSettings);
      } catch (error) {
        console.log('⚠️ لا يمكن حفظ الإعدادات في قاعدة البيانات - استخدام الإعدادات المحلية');
      }
    }
    
    this.settings = defaultSettings;
    return defaultSettings;
  }

  private addToPendingSync(type: string, data: any): void {
    const queue = this.pendingSync.get(type) || [];
    queue.push(data);
    this.pendingSync.set(type, queue);

    // مزامنة تلقائية إذا وصلنا للحد
    if (queue.length >= (this.options.batchSize || 50)) {
      if (type === 'experiences') {
        this.syncExperiences();
      } else if (type === 'knowledge') {
        this.syncKnowledge();
      }
    }
  }

  private async syncExperiences(): Promise<void> {
    const experiences = this.pendingSync.get('experiences') || [];
    if (experiences.length === 0) return;

    try {
      const { error } = await supabase
        .from('ai_experiences')
        .insert(experiences);

      if (error) throw error;

      this.pendingSync.set('experiences', []);
      console.log(`✅ تم مزامنة ${experiences.length} تجربة`);
    } catch (error: any) {
      console.error('❌ فشلت مزامنة ا��تجارب:', error.message);
    }
  }

  private async syncKnowledge(): Promise<void> {
    const knowledge = this.pendingSync.get('knowledge') || [];
    if (knowledge.length === 0) return;

    try {
      const { error } = await supabase
        .from('ai_knowledge')
        .upsert(knowledge);

      if (error) throw error;

      this.pendingSync.set('knowledge', []);
      console.log(`✅ تم مزامنة ${knowledge.length} معرفة`);
    } catch (error: any) {
      console.error('❌ فشلت مزامنة المعرفة:', error.message);
    }
  }

  /**
   * تصدير جميع البيانات
   */
  async exportAllData(): Promise<any> {
    if (!this.userId) throw new Error('User not initialized');

    const [experiences, knowledge, patterns, models, settings] = await Promise.all([
      this.loadExperiences(),
      this.loadKnowledge(),
      this.loadPatterns(),
      this.loadModels(),
      this.loadSettings(),
    ]);

    return {
      version: '1.0.0',
      exportDate: new Date(),
      userId: this.userId,
      settings,
      experiences,
      knowledge,
      patterns,
      models,
    };
  }

  /**
   * استيراد البيانات
   */
  async importData(data: any): Promise<boolean> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      // استيراد الإعدادات
      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      // استيراد التجارب
      if (data.experiences?.length > 0) {
        for (const exp of data.experiences) {
          await this.saveExperience(exp);
        }
      }

      // استيراد المعرفة
      if (data.knowledge?.length > 0) {
        for (const know of data.knowledge) {
          await this.saveKnowledge(know);
        }
      }

      await this.syncAll();

      console.log('✅ تم الاستيراد بنجاح');
      return true;
    } catch (error: any) {
      console.error('❌ فشل الاستيراد:', error.message);
      return false;
    }
  }
}

// مثيل مشترك
export const databaseSync = new DatabaseSync();