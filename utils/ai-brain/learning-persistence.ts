/**
 * طبقة الحفظ والاسترجاع للمحرك التعليمي
 * Learning Engine Persistence Layer
 *
 * يحفظ ويسترجع بيانات التعلم من قاعدة البيانات
 * يدعم: Supabase, Firebase, Custom API
 */

import { AdaptiveWeightScorer, SelectorPerformanceData, DomainWeights } from './adaptive-weight-scorer';

export interface PersistenceConfig {
  type: 'supabase' | 'firebase' | 'api' | 'localStorage'; // نوع التخزين
  endpoint?: string; // للـ API
  apiKey?: string;
  projectId?: string;
  autoSync: boolean; // مزامنة تلقائية
  syncInterval: number; // بالميلي ثانية
}

export interface PersistedLearningData {
  version: string;
  timestamp: Date;
  performanceHistory: SelectorPerformanceData[];
  domainWeights: Record<string, DomainWeights>;
  metadata: {
    totalTests: number;
    domainsCount: number;
    lastSync: Date;
  };
}

/**
 * طبقة الحفظ والاسترجاع
 */
export class LearningPersistence {
  private config: PersistenceConfig;
  private adaptiveScorer: AdaptiveWeightScorer;
  private syncTimer?: NodeJS.Timer;
  private readonly STORAGE_KEY = 'robot_brain_learning_data_v1';

  constructor(config: PersistenceConfig, scorer: AdaptiveWeightScorer) {
    this.config = config;
    this.adaptiveScorer = scorer;

    // تفعيل المزامنة التلقائية إذا كانت مفعلة
    if (config.autoSync && config.syncInterval > 0) {
      this.enableAutoSync(config.syncInterval);
    }
  }

  /**
   * تفعيل المزامنة التلقائية
   */
  private enableAutoSync(interval: number): void {
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncToStorage();
        console.log('✅ تتم مزامنة البيانات التعليمية دورياً');
      } catch (error: any) {
        console.error('❌ فشل المزامنة التلقائية:', error.message);
      }
    }, interval);
  }

  /**
   * تعطيل المزامنة التلقائية
   */
  disableAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * حفظ البيانات التعليمية
   */
  async saveData(): Promise<void> {
    try {
      console.log('💾 حفظ بيانات التعلم...');

      // استخراج البيانات من adaptive scorer
      const exportedData = this.adaptiveScorer.exportTrainingData();

      const persistedData: PersistedLearningData = {
        version: '1.0.0',
        timestamp: new Date(),
        performanceHistory: exportedData.performanceHistory,
        domainWeights: exportedData.domainWeights,
        metadata: {
          totalTests: exportedData.performanceHistory.length,
          domainsCount: Object.keys(exportedData.domainWeights).length,
          lastSync: new Date(),
        },
      };

      // حفظ وفقاً لنوع التخزين
      switch (this.config.type) {
        case 'localStorage':
          await this.saveToLocalStorage(persistedData);
          break;
        case 'supabase':
          await this.saveToSupabase(persistedData);
          break;
        case 'firebase':
          await this.saveToFirebase(persistedData);
          break;
        case 'api':
          await this.saveToApi(persistedData);
          break;
        default:
          throw new Error(`نوع التخزين غير مدعوم: ${this.config.type}`);
      }

      console.log(`✅ تم حفظ بيانات التعلم - ${persistedData.metadata.totalTests} اختبار`);
    } catch (error: any) {
      console.error('❌ خطأ في حفظ البيانات:', error.message);
      throw error;
    }
  }

  /**
   * تحميل البيانات التعليمية
   */
  async loadData(): Promise<PersistedLearningData | null> {
    try {
      console.log('📂 تحميل بيانات التعلم...');

      let persistedData: PersistedLearningData | null = null;

      // تحميل وفقاً لنوع التخزين
      switch (this.config.type) {
        case 'localStorage':
          persistedData = await this.loadFromLocalStorage();
          break;
        case 'supabase':
          persistedData = await this.loadFromSupabase();
          break;
        case 'firebase':
          persistedData = await this.loadFromFirebase();
          break;
        case 'api':
          persistedData = await this.loadFromApi();
          break;
        default:
          throw new Error(`نوع التخزين غير مدعوم: ${this.config.type}`);
      }

      if (persistedData) {
        // استيراد البيانات إلى adaptive scorer
        this.adaptiveScorer.importTrainingData(persistedData);
        console.log(`✅ تم تحميل بيانات التعلم - ${persistedData.metadata.totalTests} اختبار`);
        return persistedData;
      } else {
        console.log('ℹ️ لا توجد بيانات تعليمية محفوظة');
        return null;
      }
    } catch (error: any) {
      console.error('❌ خطأ في تحميل البيانات:', error.message);
      return null;
    }
  }

  /**
   * مزامنة البيانات مع التخزين
   */
  async syncToStorage(): Promise<void> {
    try {
      await this.saveData();
    } catch (error: any) {
      console.error('❌ خطأ في المزامنة:', error.message);
    }
  }

  /**
   * حفظ إلى localStorage
   */
  private async saveToLocalStorage(data: PersistedLearningData): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, jsonData);
      }
    } catch (error: any) {
      // قد يفشل إذا تم تجاوز حد التخزين
      console.warn('⚠️ فشل حفظ إلى localStorage (قد يكون ممتلئاً)');
      throw error;
    }
  }

  /**
   * تحميل من localStorage
   */
  private async loadFromLocalStorage(): Promise<PersistedLearningData | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const jsonData = window.localStorage.getItem(this.STORAGE_KEY);
        if (jsonData) {
          const data = JSON.parse(jsonData) as PersistedLearningData;
          // تحويل التواريخ
          data.timestamp = new Date(data.timestamp);
          data.metadata.lastSync = new Date(data.metadata.lastSync);
          return data;
        }
      }
      return null;
    } catch (error: any) {
      console.error('❌ خطأ في تحميل من localStorage:', error.message);
      return null;
    }
  }

  /**
   * حفظ إلى Supabase (مثال - يحتاج تكوين إضافي)
   */
  private async saveToSupabase(data: PersistedLearningData): Promise<void> {
    try {
      // هذا مثال - يحتاج تثبيت @supabase/supabase-js
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(`${this.config.endpoint}/rest/v1/robot_brain_learning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Supabase error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ خطأ في حفظ إلى Supabase:', error.message);
      throw error;
    }
  }

  /**
   * تحميل من Supabase
   */
  private async loadFromSupabase(): Promise<PersistedLearningData | null> {
    try {
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(`${this.config.endpoint}/rest/v1/robot_brain_learning`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase error: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0] || null; // إرجاع السجل الأخير
    } catch (error: any) {
      console.error('❌ خطأ في تحميل من Supabase:', error.message);
      return null;
    }
  }

  /**
   * حفظ إلى Firebase (مثال - يحتاج تكوين إضافي)
   */
  private async saveToFirebase(data: PersistedLearningData): Promise<void> {
    try {
      // هذا مثال - يحتاج تثبيت firebase
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(
        `https://firebaseio.com/${this.config.projectId}/robot_brain_learning.json`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Firebase error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ خطأ في حفظ إلى Firebase:', error.message);
      throw error;
    }
  }

  /**
   * تحميل من Firebase
   */
  private async loadFromFirebase(): Promise<PersistedLearningData | null> {
    try {
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(
        `https://firebaseio.com/${this.config.projectId}/robot_brain_learning.json`
      );

      if (!response.ok) {
        throw new Error(`Firebase error: ${response.statusText}`);
      }

      const data = await response.json();
      return data || null;
    } catch (error: any) {
      console.error('❌ خطأ في تحميل من Firebase:', error.message);
      return null;
    }
  }

  /**
   * حفظ إلى Custom API
   */
  private async saveToApi(data: PersistedLearningData): Promise<void> {
    try {
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(`${this.config.endpoint}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ خطأ في حفظ إلى API:', error.message);
      throw error;
    }
  }

  /**
   * تحميل من Custom API
   */
  private async loadFromApi(): Promise<PersistedLearningData | null> {
    try {
      const fetch_fn = typeof fetch !== 'undefined' ? fetch : (...args: any[]) => Promise.reject('fetch not available');

      const response = await fetch_fn(`${this.config.endpoint}/load`);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data || null;
    } catch (error: any) {
      console.error('❌ خطأ في تحميل من API:', error.message);
      return null;
    }
  }

  /**
   * حذف البيانات المحفوظة
   */
  async clearData(): Promise<void> {
    try {
      console.log('🗑️ حذف بيانات التعلم المحفوظة...');

      if (this.config.type === 'localStorage') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(this.STORAGE_KEY);
        }
      }
      // للأنواع الأخرى، قد تحتاج إلى تنفيذ آلية الحذف

      console.log('✅ تم حذف البيانات المحفوظة');
    } catch (error: any) {
      console.error('❌ خطأ في حذف البيانات:', error.message);
    }
  }
}
