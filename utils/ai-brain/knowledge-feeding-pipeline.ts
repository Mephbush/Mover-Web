/**
 * نظام تغذية المعرفة - حقن المعرفة المنظمة في نظام AI
 * Knowledge Feeding Pipeline - Structured knowledge injection system
 */

import { knowledgeBase, KnowledgeEntry } from './knowledge-base';
import { databaseSync } from './database-sync';

export interface KnowledgeTemplate {
  category: 'selector' | 'workflow' | 'pattern' | 'solution' | 'insight';
  domain: string;
  content: any;
  tags: string[];
  confidence: number;
  successRate?: number;
  metadata?: any;
}

export interface FeedingBatch {
  id: string;
  timestamp: Date;
  items: KnowledgeTemplate[];
  validationResults: ValidationResult[];
  successCount: number;
  failureCount: number;
  qualityScore: number;
}

export interface ValidationResult {
  itemIndex: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  confidenceAdjustment: number;
  qualityScore: number;
}

export interface ConflictResolution {
  existingId: string;
  newItemIndex: number;
  conflictType: 'domain' | 'selector' | 'workflow' | 'duplicate';
  resolution: 'keep_existing' | 'replace_new' | 'merge' | 'skip';
  reason: string;
}

export interface FeedingReport {
  batchId: string;
  totalItems: number;
  successfulInsertions: number;
  skippedItems: number;
  conflictsResolved: number;
  averageQualityScore: number;
  overallValidityRate: number;
  recommendations: string[];
  processingTime: number;
}

/**
 * نظام تغذية المعرفة الذكي
 */
export class KnowledgeFeedingPipeline {
  private batches: Map<string, FeedingBatch> = new Map();
  private conflictLog: ConflictResolution[] = [];
  private readonly maxBatchSize = 1000;
  private readonly minConfidenceThreshold = 0.3;
  private readonly qualityScoreThreshold = 0.5;

  /**
   * إنشاء دفعة تغذية معرفة جديدة
   */
  async createFeedingBatch(items: KnowledgeTemplate[]): Promise<FeedingBatch> {
    const batchId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📚 Creating knowledge feeding batch: ${batchId}`);
    console.log(`📚 Items to process: ${items.length}`);

    const batchStartTime = Date.now();

    // التحقق من حجم الدفعة
    if (items.length > this.maxBatchSize) {
      console.warn(`⚠️ Batch exceeds max size (${items.length} > ${this.maxBatchSize})`);
      items = items.slice(0, this.maxBatchSize);
    }

    // التحقق من صحة العناصر
    const validationResults = await this.validateItems(items);

    // فصل العناصر الصحيحة والخاطئة
    const validItems = items.filter((_, i) => validationResults[i].valid);
    const invalidItems = items.filter((_, i) => !validationResults[i].valid);

    console.log(`✅ Valid items: ${validItems.length}`);
    console.log(`❌ Invalid items: ${invalidItems.length}`);

    // إنشاء دفعة
    const batch: FeedingBatch = {
      id: batchId,
      timestamp: new Date(),
      items: validItems,
      validationResults,
      successCount: 0,
      failureCount: invalidItems.length,
      qualityScore: validationResults.reduce((sum, r) => sum + r.qualityScore, 0) / validationResults.length,
    };

    this.batches.set(batchId, batch);

    return batch;
  }

  /**
   * التحقق من صحة العناصر
   */
  private async validateItems(items: KnowledgeTemplate[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const errors: string[] = [];
      const warnings: string[] = [];
      let qualityScore = 1.0;
      let confidenceAdjustment = 0;

      // التحقق من الحقول المطلوبة
      if (!item.category) {
        errors.push('Missing category');
        qualityScore -= 0.2;
      }

      if (!item.domain) {
        errors.push('Missing domain');
        qualityScore -= 0.2;
      }

      if (!item.content) {
        errors.push('Missing content');
        qualityScore -= 0.2;
      }

      if (!item.tags || item.tags.length === 0) {
        warnings.push('No tags provided');
        qualityScore -= 0.1;
      }

      // التحقق من الثقة
      if (item.confidence < this.minConfidenceThreshold) {
        warnings.push(`Low confidence (${item.confidence})`);
        confidenceAdjustment = this.minConfidenceThreshold - item.confidence;
        qualityScore -= 0.15;
      }

      // التحقق من معدل النجاح
      if (item.successRate !== undefined) {
        if (item.successRate < 0 || item.successRate > 1) {
          errors.push('Success rate must be between 0 and 1');
          qualityScore -= 0.1;
        }
      }

      // التحقق من المحتوى (بناءً على النوع)
      if (item.category === 'selector') {
        if (typeof item.content !== 'string') {
          errors.push('Selector content must be a string');
          qualityScore -= 0.2;
        }
        if (!item.content || item.content.trim().length === 0) {
          errors.push('Selector content cannot be empty');
          qualityScore -= 0.2;
        }
      } else if (item.category === 'workflow') {
        if (!Array.isArray(item.content)) {
          errors.push('Workflow content must be an array');
          qualityScore -= 0.2;
        }
        if (item.content.length === 0) {
          errors.push('Workflow cannot be empty');
          qualityScore -= 0.2;
        }
      }

      // ضمان أن النتيجة بين 0 و 1
      qualityScore = Math.max(0, Math.min(1, qualityScore));

      const isValid = errors.length === 0 && qualityScore >= this.qualityScoreThreshold;

      results.push({
        itemIndex: i,
        valid: isValid,
        errors,
        warnings,
        confidenceAdjustment,
        qualityScore,
      });
    }

    return results;
  }

  /**
   * معالجة دفعة التغذية
   */
  async processFeedingBatch(batchId: string): Promise<FeedingReport> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    const processingStartTime = Date.now();
    console.log(`🔄 Processing feeding batch: ${batchId}`);

    let successCount = 0;
    let conflictCount = 0;

    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];
      const validation = batch.validationResults[i];

      try {
        // تعديل الثقة بناءً على التحقق
        let adjustedConfidence = item.confidence + validation.confidenceAdjustment;
        adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence));

        // فحص التضارب
        const conflict = await this.checkConflicts(item, i);

        if (conflict) {
          conflictCount++;
          const resolution = await this.resolveConflict(conflict);

          if (resolution.resolution === 'skip') {
            console.log(`⊘ Skipped due to conflict: ${conflict.conflictType}`);
            continue;
          }

          this.conflictLog.push(resolution);
        }

        // إضافة المعرفة
        const entryId = await knowledgeBase.addKnowledge({
          category: item.category,
          domain: item.domain,
          content: item.content,
          tags: item.tags,
          confidence: adjustedConfidence,
          usage_count: 0,
          success_rate: item.successRate || 0.5,
          metadata: {
            source: 'feeding_pipeline',
            context: item.metadata,
            qualityScore: validation.qualityScore,
            batchId,
          },
        });

        console.log(`✅ Added knowledge entry: ${entryId}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to add knowledge item ${i}:`, error.message);
      }
    }

    batch.successCount = successCount;

    const processingTime = Date.now() - processingStartTime;

    const report: FeedingReport = {
      batchId,
      totalItems: batch.items.length,
      successfulInsertions: successCount,
      skippedItems: batch.items.length - successCount,
      conflictsResolved: conflictCount,
      averageQualityScore: batch.qualityScore,
      overallValidityRate: successCount / batch.items.length,
      recommendations: this.generateRecommendations(batch, successCount),
      processingTime,
    };

    console.log('📊 Feeding report:');
    console.log(`  Total items: ${report.totalItems}`);
    console.log(`  Successful: ${report.successfulInsertions}`);
    console.log(`  Skipped: ${report.skippedItems}`);
    console.log(`  Conflicts resolved: ${report.conflictsResolved}`);
    console.log(`  Quality score: ${report.averageQualityScore.toFixed(2)}`);
    console.log(`  Processing time: ${processingTime}ms`);

    return report;
  }

  /**
   * فحص التضارب المحتملة
   */
  private async checkConflicts(
    item: KnowledgeTemplate,
    itemIndex: number
  ): Promise<ConflictResolution | null> {
    // فحص العناصر الموجودة بالفعل
    const existingEntries = await knowledgeBase.search({
      domain: item.domain,
      category: item.category,
    });

    if (existingEntries.length === 0) {
      return null;
    }

    // البحث عن تطابقات محتملة
    for (const existing of existingEntries) {
      // إذا كان المحتوى متطابقاً
      if (JSON.stringify(existing.content) === JSON.stringify(item.content)) {
        return {
          existingId: existing.id,
          newItemIndex: itemIndex,
          conflictType: 'duplicate',
          resolution: 'keep_existing',
          reason: 'Duplicate content detected',
        };
      }

      // إذا كان selector نفسه
      if (item.category === 'selector' && existing.content === item.content) {
        return {
          existingId: existing.id,
          newItemIndex: itemIndex,
          conflictType: 'selector',
          resolution: item.confidence > existing.confidence ? 'replace_new' : 'keep_existing',
          reason: `Selector conflict (new confidence: ${item.confidence}, existing: ${existing.confidence})`,
        };
      }
    }

    return null;
  }

  /**
   * حل التضارب
   */
  private async resolveConflict(conflict: ConflictResolution): Promise<ConflictResolution> {
    console.log(`⚔️ Resolving conflict: ${conflict.conflictType}`);
    console.log(`   Resolution: ${conflict.resolution}`);

    // في الإصدار الحالي، نستخدم استراتيجية بسيطة
    // يمكن تحسينها لاحقاً
    return conflict;
  }

  /**
   * توليد التوصيات
   */
  private generateRecommendations(batch: FeedingBatch, successCount: number): string[] {
    const recommendations: string[] = [];

    const successRate = successCount / batch.items.length;

    if (successRate < 0.5) {
      recommendations.push('Most items failed validation. Check data quality.');
    }

    if (batch.qualityScore < 0.6) {
      recommendations.push('Average quality score is low. Consider validating items more carefully.');
    }

    if (batch.failureCount > 0) {
      recommendations.push('Some items were invalid. Check validation errors and retry.');
    }

    if (this.conflictLog.length > 5) {
      recommendations.push('Multiple conflicts detected. Review conflict resolution strategy.');
    }

    if (successCount > 100) {
      recommendations.push('Large batch processed successfully. Monitor system performance.');
    }

    if (successCount === 0) {
      recommendations.push('No items were successfully added. Verify batch data format.');
    }

    return recommendations;
  }

  /**
   * التنبؤ بجودة المعرفة المحقونة
   */
  async predictQuality(items: KnowledgeTemplate[]): Promise<{
    averageQuality: number;
    estimatedSuccessRate: number;
    riskFactors: string[];
  }> {
    const validationResults = await this.validateItems(items);
    const averageQuality = validationResults.reduce((sum, r) => sum + r.qualityScore, 0) / validationResults.length;
    const estimatedSuccessRate = validationResults.filter(r => r.valid).length / validationResults.length;
    const riskFactors: string[] = [];

    if (averageQuality < 0.6) {
      riskFactors.push('Low average quality score');
    }

    if (estimatedSuccessRate < 0.7) {
      riskFactors.push('High validation failure rate');
    }

    const hasWarnings = validationResults.some(r => r.warnings.length > 0);
    if (hasWarnings) {
      riskFactors.push('Multiple validation warnings');
    }

    return {
      averageQuality,
      estimatedSuccessRate,
      riskFactors,
    };
  }

  /**
   * الحصول على تقرير الدفعة
   */
  getBatchReport(batchId: string): FeedingBatch | null {
    return this.batches.get(batchId) || null;
  }

  /**
   * الحصول على سجل التضارب
   */
  getConflictLog(limit: number = 50): ConflictResolution[] {
    return this.conflictLog.slice(-limit);
  }

  /**
   * إنشاء قالب معرفة للموقع الشهير
   */
  createSelectorTemplate(
    domain: string,
    selectors: { [key: string]: string },
    confidence: number = 0.8
  ): KnowledgeTemplate {
    return {
      category: 'selector',
      domain,
      content: selectors,
      tags: ['auto-generated', domain, 'selector'],
      confidence,
      successRate: 0.85,
      metadata: {
        type: 'selector_collection',
        generatedAt: new Date(),
      },
    };
  }

  /**
   * إنشاء قالب معرفة لعملية
   */
  createWorkflowTemplate(
    domain: string,
    workflowSteps: any[],
    confidence: number = 0.75
  ): KnowledgeTemplate {
    return {
      category: 'workflow',
      domain,
      content: workflowSteps,
      tags: ['workflow', domain, 'automated'],
      confidence,
      successRate: 0.8,
      metadata: {
        type: 'workflow_sequence',
        stepCount: workflowSteps.length,
      },
    };
  }

  /**
   * حقن معرفة من قاعدة بيانات خارجية
   */
  async injectFromExternalSource(
    sourceUrl: string,
    transformer: (data: any) => KnowledgeTemplate[]
  ): Promise<FeedingReport | null> {
    try {
      console.log(`🌐 Fetching knowledge from external source: ${sourceUrl}`);

      // محاكاة جلب البيانات
      // في الإنتاج، ستحتاج إلى استدعاء API فعلي
      const response = await fetch(sourceUrl);
      const data = await response.json();

      const templates = transformer(data);
      const batch = await this.createFeedingBatch(templates);
      const report = await this.processFeedingBatch(batch.id);

      return report;
    } catch (error: any) {
      console.error('Failed to inject from external source:', error.message);
      return null;
    }
  }

  /**
   * إعادة تعيين خط الأنابيب
   */
  reset(): void {
    this.batches.clear();
    this.conflictLog = [];
    console.log('✅ Knowledge feeding pipeline reset');
  }
}

// Export singleton instance
export const knowledgeFeedingPipeline = new KnowledgeFeedingPipeline();
