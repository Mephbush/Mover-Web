/**
 * قاعدة المعرفة - تخزين واسترجاع المعرفة المكتسبة
 * Knowledge Base - Store and retrieve acquired knowledge
 */

export interface KnowledgeEntry {
  id: string;
  category: 'selector' | 'workflow' | 'pattern' | 'solution' | 'insight';
  domain: string;
  content: any;
  tags: string[];
  confidence: number;
  usage_count: number;
  success_rate: number;
  created_at: Date;
  updated_at: Date;
  metadata: {
    source?: string;
    context?: any;
    related_entries?: string[];
  };
}

export interface Query {
  category?: string;
  domain?: string;
  tags?: string[];
  minConfidence?: number;
  searchText?: string;
  limit?: number;
}

export interface Insight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestions: string[];
  evidence: any[];
  createdAt: Date;
}

/**
 * قاعدة المعرفة الذكية
 */
export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private insights: Map<string, Insight> = new Map();
  private indexByCategory: Map<string, Set<string>> = new Map();
  private indexByDomain: Map<string, Set<string>> = new Map();
  private indexByTags: Map<string, Set<string>> = new Map();

  /**
   * إضافة معرفة جديدة
   */
  async addKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullEntry: KnowledgeEntry = {
      ...entry,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.entries.set(id, fullEntry);

    // تحديث الفهارس
    this.updateIndexes(fullEntry);

    console.log(`📚 تم إضافة معرفة جديدة: ${id} (${entry.category})`);

    // حفظ في قاعدة البيانات
    await this.persistKnowledge(fullEntry);

    return id;
  }

  /**
   * البحث عن معرفة
   */
  async search(query: Query): Promise<KnowledgeEntry[]> {
    let resultIds = new Set<string>(this.entries.keys());

    // تصفية حسب الفئة
    if (query.category) {
      const categoryIds = this.indexByCategory.get(query.category);
      if (categoryIds) {
        resultIds = new Set([...resultIds].filter((id) => categoryIds.has(id)));
      } else {
        return [];
      }
    }

    // تصفية حسب المجال
    if (query.domain) {
      const domainIds = this.indexByDomain.get(query.domain);
      if (domainIds) {
        resultIds = new Set([...resultIds].filter((id) => domainIds.has(id)));
      } else {
        return [];
      }
    }

    // تصفية حسب الوسوم
    if (query.tags && query.tags.length > 0) {
      const tagIds = new Set<string>();
      query.tags.forEach((tag) => {
        const ids = this.indexByTags.get(tag);
        if (ids) {
          ids.forEach((id) => tagIds.add(id));
        }
      });
      resultIds = new Set([...resultIds].filter((id) => tagIds.has(id)));
    }

    // تحويل إلى مصفوفة
    let results = Array.from(resultIds)
      .map((id) => this.entries.get(id))
      .filter((entry): entry is KnowledgeEntry => entry !== undefined);

    // تصفية حسب الثقة
    if (query.minConfidence !== undefined) {
      results = results.filter((entry) => entry.confidence >= query.minConfidence!);
    }

    // بحث نصي
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      results = results.filter((entry) => {
        const contentStr = JSON.stringify(entry.content).toLowerCase();
        return contentStr.includes(searchLower);
      });
    }

    // ترتيب حسب الثقة ومعدل الاستخدام
    results.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + (a.success_rate * 0.4);
      const scoreB = b.confidence * 0.6 + (b.success_rate * 0.4);
      return scoreB - scoreA;
    });

    // تحديد العدد
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * الحصول على أفضل حل لمشكلة
   */
  async getBestSolution(
    problem: string,
    domain: string,
    context?: any
  ): Promise<KnowledgeEntry | null> {
    const solutions = await this.search({
      category: 'solution',
      domain,
      searchText: problem,
      minConfidence: 0.5,
    });

    if (solutions.length === 0) {
      return null;
    }

    // اختيار أفضل حل بناءً على السياق
    const scored = solutions.map((solution) => ({
      solution,
      score: this.calculateRelevanceScore(solution, problem, context),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0].solution;
  }

  /**
   * تحديث معرفة موجودة
   */
  async updateKnowledge(
    id: string,
    updates: Partial<KnowledgeEntry>
  ): Promise<boolean> {
    const entry = this.entries.get(id);

    if (!entry) {
      return false;
    }

    const updatedEntry = {
      ...entry,
      ...updates,
      updated_at: new Date(),
    };

    this.entries.set(id, updatedEntry);

    // إعادة بناء الفهارس
    this.rebuildIndexes();

    await this.persistKnowledge(updatedEntry);

    return true;
  }

  /**
   * تسجيل اس��خدام معرفة
   */
  async recordUsage(id: string, success: boolean): Promise<void> {
    const entry = this.entries.get(id);

    if (!entry) {
      return;
    }

    entry.usage_count++;

    // تحديث معدل النجاح
    const totalAttempts = entry.usage_count;
    const previousSuccesses = Math.round(entry.success_rate * (totalAttempts - 1));
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    entry.success_rate = newSuccesses / totalAttempts;

    // تحديث الثقة بناءً على الأداء
    if (entry.usage_count > 10) {
      entry.confidence = entry.success_rate * 0.8 + entry.confidence * 0.2;
    }

    entry.updated_at = new Date();

    this.entries.set(id, entry);
    await this.persistKnowledge(entry);
  }

  /**
   * توليد رؤى من المعرفة المتراكمة
   */
  async generateInsights(domain?: string): Promise<Insight[]> {
    console.log('🔮 توليد رؤى من قاعدة المعرفة...');

    const insights: Insight[] = [];

    // تحليل الأنماط
    const patternInsights = await this.analyzePatterns(domain);
    insights.push(...patternInsights);

    // تحليل معدلات النجاح
    const performanceInsights = await this.analyzePerformance(domain);
    insights.push(...performanceInsights);

    // اكتشاف الفجوات
    const gapInsights = await this.identifyGaps(domain);
    insights.push(...gapInsights);

    // تحليل الاتجاهات
    const trendInsights = await this.analyzeTrends(domain);
    insights.push(...trendInsights);

    // حفظ الرؤى
    insights.forEach((insight) => {
      this.insights.set(insight.id, insight);
    });

    return insights;
  }

  /**
   * الحصول على إحصائيات قاعدة المعرفة
   */
  getStatistics(): {
    totalEntries: number;
    byCategory: Map<string, number>;
    byDomain: Map<string, number>;
    averageConfidence: number;
    averageSuccessRate: number;
    mostUsedEntries: KnowledgeEntry[];
  } {
    const totalEntries = this.entries.size;

    // إحصاء حسب الفئة
    const byCategory = new Map<string, number>();
    this.indexByCategory.forEach((ids, category) => {
      byCategory.set(category, ids.size);
    });

    // إحصاء حسب المجال
    const byDomain = new Map<string, number>();
    this.indexByDomain.forEach((ids, domain) => {
      byDomain.set(domain, ids.size);
    });

    // حساب المتوسطات
    let totalConfidence = 0;
    let totalSuccessRate = 0;

    this.entries.forEach((entry) => {
      totalConfidence += entry.confidence;
      totalSuccessRate += entry.success_rate;
    });

    const averageConfidence = totalEntries > 0 ? totalConfidence / totalEntries : 0;
    const averageSuccessRate = totalEntries > 0 ? totalSuccessRate / totalEntries : 0;

    // أكثر الإدخالات استخداماً
    const mostUsedEntries = Array.from(this.entries.values())
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    return {
      totalEntries,
      byCategory,
      byDomain,
      averageConfidence,
      averageSuccessRate,
      mostUsedEntries,
    };
  }

  /**
   * تصدير قاعدة المعرفة
   */
  exportKnowledge(domain?: string): KnowledgeEntry[] {
    let entries = Array.from(this.entries.values());

    if (domain) {
      entries = entries.filter((entry) => entry.domain === domain);
    }

    return entries;
  }

  /**
   * استيراد قاعدة معرفة
   */
  async importKnowledge(entries: KnowledgeEntry[]): Promise<number> {
    let imported = 0;

    for (const entry of entries) {
      this.entries.set(entry.id, entry);
      this.updateIndexes(entry);
      imported++;
    }

    console.log(`📥 تم استيراد ${imported} إدخال`);

    return imported;
  }

  // ====== وظائف مساعدة خاصة ======

  private updateIndexes(entry: KnowledgeEntry): void {
    // فهرس الفئة
    if (!this.indexByCategory.has(entry.category)) {
      this.indexByCategory.set(entry.category, new Set());
    }
    this.indexByCategory.get(entry.category)!.add(entry.id);

    // فهرس المجال
    if (!this.indexByDomain.has(entry.domain)) {
      this.indexByDomain.set(entry.domain, new Set());
    }
    this.indexByDomain.get(entry.domain)!.add(entry.id);

    // فهرس الوسوم
    entry.tags.forEach((tag) => {
      if (!this.indexByTags.has(tag)) {
        this.indexByTags.set(tag, new Set());
      }
      this.indexByTags.get(tag)!.add(entry.id);
    });
  }

  private rebuildIndexes(): void {
    this.indexByCategory.clear();
    this.indexByDomain.clear();
    this.indexByTags.clear();

    this.entries.forEach((entry) => {
      this.updateIndexes(entry);
    });
  }

  private calculateRelevanceScore(
    solution: KnowledgeEntry,
    problem: string,
    context?: any
  ): number {
    let score = solution.confidence * 0.4 + solution.success_rate * 0.4;

    // مكافأة الاستخدام المتكرر
    score += Math.min(solution.usage_count / 100, 0.2);

    // TODO: تحسين بناءً على السياق

    return score;
  }

  private async analyzePatterns(domain?: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    const patterns = await this.search({
      category: 'pattern',
      domain,
      minConfidence: 0.7,
    });

    if (patterns.length > 5) {
      insights.push({
        id: `insight_patterns_${Date.now()}`,
        type: 'pattern',
        title: 'أنماط ناجحة متكررة',
        description: `تم اكتشاف ${patterns.length} نمط ناجح يمكن الاستفادة منه`,
        impact: 'medium',
        actionable: true,
        suggestions: ['استخدم هذه الأنماط في المهام المستقبلية'],
        evidence: patterns.slice(0, 3),
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private async analyzePerformance(domain?: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    const allEntries = domain
      ? Array.from(this.entries.values()).filter((e) => e.domain === domain)
      : Array.from(this.entries.values());

    const lowPerformance = allEntries.filter((e) => e.success_rate < 0.5 && e.usage_count > 5);

    if (lowPerformance.length > 0) {
      insights.push({
        id: `insight_performance_${Date.now()}`,
        type: 'warning',
        title: 'معرفة ذات أداء منخفض',
        description: `${lowPerformance.length} إدخال بمعدل نجاح منخفض`,
        impact: 'medium',
        actionable: true,
        suggestions: ['مراجعة وتحديث المعرفة ذات الأداء المنخفض', 'البحث عن بدائل أفضل'],
        evidence: lowPerformance.slice(0, 3),
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private async identifyGaps(domain?: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    const categories = ['selector', 'workflow', 'pattern', 'solution'];
    const categoryCounts = new Map<string, number>();

    categories.forEach((cat) => {
      const count = this.indexByCategory.get(cat)?.size || 0;
      categoryCounts.set(cat, count);
    });

    const minCount = Math.min(...Array.from(categoryCounts.values()));
    const maxCount = Math.max(...Array.from(categoryCounts.values()));

    if (maxCount > minCount * 3) {
      const weakCategories = Array.from(categoryCounts.entries())
        .filter(([_, count]) => count < maxCount / 2)
        .map(([cat]) => cat);

      insights.push({
        id: `insight_gaps_${Date.now()}`,
        type: 'recommendation',
        title: 'فجوات في قاعدة المعرفة',
        description: `بعض الفئات تحتاج المزيد من المعرفة`,
        impact: 'low',
        actionable: true,
        suggestions: [`التركيز على جمع معرفة في: ${weakCategories.join(', ')}`],
        evidence: [],
        createdAt: new Date(),
      });
    }

    return insights;
  }

  private async analyzeTrends(domain?: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // تحليل الاتجاهات الزمنية
    const recentEntries = Array.from(this.entries.values()).filter(
      (e) => Date.now() - e.created_at.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentEntries.length > 20) {
      const avgSuccessRate =
        recentEntries.reduce((sum, e) => sum + e.success_rate, 0) / recentEntries.length;

      if (avgSuccessRate > 0.8) {
        insights.push({
          id: `insight_trends_${Date.now()}`,
          type: 'optimization',
          title: 'تحسن في الأداء',
          description: `معدل نجاح المعرفة الحديثة: ${(avgSuccessRate * 100).toFixed(1)}%`,
          impact: 'high',
          actionable: false,
          suggestions: ['استمر في نفس الاستراتيجية'],
          evidence: [],
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  private async persistKnowledge(entry: KnowledgeEntry): Promise<void> {
    // حفظ في قاعدة البيانات (Supabase)
    console.log('💾 حفظ المعرفة:', entry.id);
  }
}

// مثيل مشترك
export const knowledgeBase = new KnowledgeBase();
