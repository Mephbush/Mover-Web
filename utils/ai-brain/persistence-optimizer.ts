/**
 * محسّن المثابرة - تحسين تخزين البيانات والمزامنة مع قاعدة البيانات
 * Persistence Optimizer - Optimize data storage and database synchronization
 */

import { Experience } from './learning-engine';

export interface StorageOptimization {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeMs: number;
}

export interface BatchOperation {
  id: string;
  type: 'insert' | 'update' | 'delete' | 'sync';
  items: any[];
  priority: number;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
}

export interface SyncReport {
  batchesProcessed: number;
  itemsSynced: number;
  failedItems: number;
  averageLatency: number;
  totalTime: number;
  successRate: number;
  optimizationMetrics: {
    compressionRatio: number;
    spaceFreed: number;
    cacheHitRate: number;
  };
}

export interface DataIndexEntry {
  id: string;
  type: string;
  size: number;
  lastAccessed: Date;
  frequency: number;
  compressed: boolean;
}

/**
 * محسّن المثابرة الذكي
 */
export class PersistenceOptimizer {
  private batchQueue: BatchOperation[] = [];
  private dataIndex: Map<string, DataIndexEntry> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly batchSize = 100;
  private readonly maxBatchAge = 30000; // 30 seconds
  private readonly compressionThreshold = 1024; // 1KB
  private processingBatch = false;

  /**
   * إضافة عملية إلى قائمة الانتظار
   */
  queueOperation(
    type: BatchOperation['type'],
    items: any[],
    priority: number = 5
  ): string {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const operation: BatchOperation = {
      id: batchId,
      type,
      items,
      priority,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    this.batchQueue.push(operation);
    this.batchQueue.sort((a, b) => b.priority - a.priority);

    console.log(`📝 Queued ${type} operation: ${batchId} (${items.length} items)`);

    return batchId;
  }

  /**
   * معالجة قائمة الانتظار
   */
  async processBatch(): Promise<SyncReport> {
    if (this.processingBatch || this.batchQueue.length === 0) {
      return this.getEmptyReport();
    }

    this.processingBatch = true;
    const startTime = Date.now();
    const reportData = {
      batchesProcessed: 0,
      itemsSynced: 0,
      failedItems: 0,
      latencies: [] as number[],
      compressionMetrics: { totalOriginal: 0, totalCompressed: 0, hitRate: 0 },
    };

    try {
      console.log('🔄 Processing batch queue...');

      while (this.batchQueue.length > 0) {
        const batch = this.batchQueue.shift();
        if (!batch) break;

        batch.status = 'processing';
        const batchStartTime = Date.now();

        try {
          // تقسيم البيانات إلى وحدات أصغر
          const chunks = this.chunkItems(batch.items, this.batchSize);

          for (const chunk of chunks) {
            // ضغط البيانات إذا لزم الأمر
            const optimized = await this.optimizeData(chunk);
            reportData.compressionMetrics.totalOriginal += optimized.originalSize;
            reportData.compressionMetrics.totalCompressed += optimized.compressedSize;

            // محاكاة العملية (في الإنتاج ستكون استدعاء API فعلي)
            await new Promise(resolve => setTimeout(resolve, 10));

            reportData.itemsSynced += chunk.length;
          }

          batch.status = 'completed';
          reportData.batchesProcessed++;

          const latency = Date.now() - batchStartTime;
          reportData.latencies.push(latency);

          console.log(`✅ Batch ${batch.id} completed (${latency}ms)`);
        } catch (error: any) {
          console.error(`❌ Batch ${batch.id} failed:`, error.message);
          batch.status = 'failed';
          batch.retryCount++;

          // أعد محاولة الدفعات الفاشلة (حتى 3 مرات)
          if (batch.retryCount < 3) {
            batch.status = 'pending';
            this.batchQueue.push(batch);
          } else {
            reportData.failedItems += batch.items.length;
          }
        }
      }

      const totalTime = Date.now() - startTime;

      // حساب معدل الضغط
      const compressionRatio =
        reportData.compressionMetrics.totalOriginal > 0
          ? reportData.compressionMetrics.totalCompressed /
            reportData.compressionMetrics.totalOriginal
          : 0;

      const spaceFreed =
        reportData.compressionMetrics.totalOriginal -
        reportData.compressionMetrics.totalCompressed;

      const cacheHitRate =
        this.cacheHits + this.cacheMisses > 0
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0;

      const report: SyncReport = {
        batchesProcessed: reportData.batchesProcessed,
        itemsSynced: reportData.itemsSynced,
        failedItems: reportData.failedItems,
        averageLatency:
          reportData.latencies.length > 0
            ? reportData.latencies.reduce((a, b) => a + b, 0) /
              reportData.latencies.length
            : 0,
        totalTime,
        successRate:
          reportData.itemsSynced > 0
            ? reportData.itemsSynced /
              (reportData.itemsSynced + reportData.failedItems)
            : 0,
        optimizationMetrics: {
          compressionRatio,
          spaceFreed,
          cacheHitRate,
        },
      };

      console.log('📊 Batch processing report:');
      console.log(`  Batches: ${report.batchesProcessed}`);
      console.log(`  Items: ${report.itemsSynced}`);
      console.log(`  Success rate: ${(report.successRate * 100).toFixed(2)}%`);
      console.log(`  Compression ratio: ${compressionRatio.toFixed(2)}`);
      console.log(`  Space freed: ${(spaceFreed / 1024).toFixed(2)}KB`);
      console.log(`  Time: ${report.totalTime}ms`);

      return report;
    } finally {
      this.processingBatch = false;
    }
  }

  /**
   * تقسيم البيانات إلى وحدات
   */
  private chunkItems(items: any[], size: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * تحسين البيانات (ضغط وتطبيع)
   */
  private async optimizeData(items: any[]): Promise<StorageOptimization> {
    const startTime = performance.now();

    // تحويل إلى JSON
    const jsonStr = JSON.stringify(items);
    const originalSize = new Blob([jsonStr]).size;

    // محاكاة الضغط
    let compressed = jsonStr;
    if (originalSize > this.compressionThreshold) {
      // تطبيق تقنيات ضغط بسيطة
      compressed = this.applySimpleCompression(jsonStr);
    }

    const compressedSize = new Blob([compressed]).size;
    const timeMs = performance.now() - startTime;

    return {
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize,
      timeMs,
    };
  }

  /**
   * تطبيق ضغط بسيط
   */
  private applySimpleCompression(str: string): string {
    // استبدال الأنماط المتكررة بأحرف أقصر
    let compressed = str;

    // استبدال المفاتيح الشائعة
    const replacements = [
      ['"success":true', '"s":1'],
      ['"success":false', '"s":0'],
      ['"timestamp":', '"t":'],
      ['"metadata":', '"m":'],
      ['"context":', '"c":'],
    ];

    for (const [pattern, replacement] of replacements) {
      compressed = compressed.replace(new RegExp(pattern, 'g'), replacement);
    }

    return compressed;
  }

  /**
   * الحصول على حالة قائمة الانتظار
   */
  getQueueStatus(): {
    pendingBatches: number;
    processingBatches: number;
    totalItems: number;
    averageBatchSize: number;
  } {
    const totalItems = this.batchQueue.reduce((sum, b) => sum + b.items.length, 0);
    const averageBatchSize =
      this.batchQueue.length > 0 ? totalItems / this.batchQueue.length : 0;

    return {
      pendingBatches: this.batchQueue.filter(b => b.status === 'pending').length,
      processingBatches: this.batchQueue.filter(b => b.status === 'processing')
        .length,
      totalItems,
      averageBatchSize,
    };
  }

  /**
   * الحصول على إحصائيات الذاكرة
   */
  getMemoryStats(): {
    indexSize: number;
    cachedItems: number;
    cacheHitRate: number;
    estimatedMemoryUsage: number;
  } {
    const cachedItems = this.dataIndex.size;
    const estimatedMemoryUsage = Array.from(this.dataIndex.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    const cacheHitRate =
      this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0;

    return {
      indexSize: this.dataIndex.size,
      cachedItems,
      cacheHitRate,
      estimatedMemoryUsage,
    };
  }

  /**
   * تنظيف البيانات القديمة
   */
  async cleanupOldData(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    console.log('🧹 Cleaning up old data...');

    let deletedCount = 0;
    const now = new Date();

    for (const [key, entry] of this.dataIndex.entries()) {
      const age = now.getTime() - entry.lastAccessed.getTime();

      if (age > maxAgeMs && entry.frequency < 2) {
        this.dataIndex.delete(key);
        deletedCount++;
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} old entries`);

    return deletedCount;
  }

  /**
   * تحسين الفهرس
   */
  optimizeIndex(): {
    beforeSize: number;
    afterSize: number;
    entriesRemoved: number;
  } {
    console.log('🔧 Optimizing index...');

    const beforeSize = this.dataIndex.size;

    // إزالة الإدخالات ذات التكرار المنخفض جداً
    for (const [key, entry] of this.dataIndex.entries()) {
      if (entry.frequency < 1 && entry.size > 10000) {
        this.dataIndex.delete(key);
      }
    }

    const entriesRemoved = beforeSize - this.dataIndex.size;
    const afterSize = this.dataIndex.size;

    console.log(`✅ Index optimized: ${entriesRemoved} entries removed`);

    return {
      beforeSize,
      afterSize,
      entriesRemoved,
    };
  }

  /**
   * الحصول على تقرير جودة التخزين
   */
  getStorageQualityReport(): {
    indexFragmentation: number;
    averageItemSize: number;
    compressionEfficiency: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const entries = Array.from(this.dataIndex.values());

    if (entries.length === 0) {
      return {
        indexFragmentation: 0,
        averageItemSize: 0,
        compressionEfficiency: 0,
        recommendations: ['No data indexed yet'],
      };
    }

    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const averageItemSize = totalSize / entries.length;

    // حساب التجزئة
    const compressedEntries = entries.filter(e => e.compressed).length;
    const compressionEfficiency = (compressedEntries / entries.length) * 100;

    // توليد التوصيات
    if (compressionEfficiency < 30) {
      recommendations.push('Enable compression for more items');
    }

    if (averageItemSize > 100000) {
      recommendations.push('Average item size is high, consider optimizing');
    }

    const cacheHitRate =
      this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0;

    if (cacheHitRate < 0.5) {
      recommendations.push('Cache efficiency is low, improve indexing strategy');
    }

    if (this.batchQueue.length > 10) {
      recommendations.push('Large batch queue detected, process batches more frequently');
    }

    const fragmentation =
      entries.filter(e => e.frequency === 0).length / entries.length;

    return {
      indexFragmentation: fragmentation,
      averageItemSize,
      compressionEfficiency,
      recommendations,
    };
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  resetStatistics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('✅ Statistics reset');
  }

  /**
   * الحصول على تقرير فارغ
   */
  private getEmptyReport(): SyncReport {
    return {
      batchesProcessed: 0,
      itemsSynced: 0,
      failedItems: 0,
      averageLatency: 0,
      totalTime: 0,
      successRate: 0,
      optimizationMetrics: {
        compressionRatio: 0,
        spaceFreed: 0,
        cacheHitRate: 0,
      },
    };
  }

  /**
   * تسجيل وصول للفهرس
   */
  recordAccess(id: string, size: number): void {
    const entry = this.dataIndex.get(id);

    if (entry) {
      entry.lastAccessed = new Date();
      entry.frequency++;
      this.cacheHits++;
    } else {
      this.dataIndex.set(id, {
        id,
        type: 'unknown',
        size,
        lastAccessed: new Date(),
        frequency: 1,
        compressed: false,
      });
      this.cacheMisses++;
    }
  }

  /**
   * مسح قائمة الانتظار
   */
  clearQueue(): number {
    const count = this.batchQueue.length;
    this.batchQueue = [];
    console.log(`✅ Cleared ${count} batches from queue`);
    return count;
  }

  /**
   * الحصول على حجم البيانات المتراكمة
   */
  getAccumulatedDataSize(): number {
    return Array.from(this.dataIndex.values()).reduce((sum, e) => sum + e.size, 0);
  }
}

// Export singleton instance
export const persistenceOptimizer = new PersistenceOptimizer();
