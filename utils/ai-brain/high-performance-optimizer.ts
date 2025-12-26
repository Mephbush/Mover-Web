/**
 * محسّن الأداء العالي جداً
 * High-Performance Selector Optimizer
 * 
 * نظام متخصص في تحسين سرعة وأداء البحث عن العناصر
 * 
 * المميزات:
 * 1. ذاكرة تخزين ذكية للمحددات الناجحة
 * 2. فهرسة متقدمة للعناصر
 * 3. تحسين استقطاعي للأداء
 * 4. معالجة متقدمة للحالات الخاصة
 * 5. تقليل التأخير إلى الحد الأدنى
 */

export interface CachedSelector {
  selector: string;
  successRate: number;
  lastUsed: number;
  useCount: number;
  averageTime: number;
  domain: string;
  elementType: string;
  confidence: number;
}

export interface PerformanceOptimization {
  cacheHits: number;
  cacheMisses: number;
  savedTime: number;
  optimizationRatio: number;
  avgResponseTime: number;
}

/**
 * نظام التخزين الذكي
 */
class SmartCachingSystem {
  private cache: Map<string, CachedSelector> = new Map();
  private readonly maxCacheSize = 5000;
  private readonly ttl = 7 * 24 * 60 * 60 * 1000; // 7 أيام

  /**
   * الحصول من الكاش
   */
  get(key: string): CachedSelector | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // التحقق من انتهاء الصلاحية
    if (Date.now() - cached.lastUsed > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // تحديث معلومات الاستخدام
    cached.lastUsed = Date.now();
    cached.useCount++;

    return cached;
  }

  /**
   * حفظ في الكاش
   */
  set(selector: string, data: CachedSelector): void {
    // التحقق من الحد الأقصى
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(selector, {
      ...data,
      lastUsed: Date.now(),
      useCount: (this.cache.get(selector)?.useCount || 0) + 1,
    });
  }

  /**
   * حذف العناصر الأقل استخداماً
   */
  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastUsed < lruTime) {
        lruTime = value.lastUsed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * الحصول على إحصائيات الكاش
   */
  getStats(): {
    size: number;
    hitRate: number;
    topSelectors: string[];
  } {
    const sorted = Array.from(this.cache.values()).sort(
      (a, b) => b.useCount - a.useCount
    );

    return {
      size: this.cache.size,
      hitRate: this.cache.size / this.maxCacheSize,
      topSelectors: sorted.slice(0, 10).map(s => s.selector),
    };
  }

  /**
   * تنظيف الكاش القديم
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.lastUsed > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

/**
 * نظام الفهرسة المتقدم
 */
class AdvancedIndexingSystem {
  private indices: {
    byType: Map<string, Set<string>>;
    byDomain: Map<string, Set<string>>;
    byTag: Map<string, Set<string>>;
    byAttribute: Map<string, Set<string>>;
  } = {
    byType: new Map(),
    byDomain: new Map(),
    byTag: new Map(),
    byAttribute: new Map(),
  };

  /**
   * إضافة محدد إلى الفهرسة
   */
  index(selector: string, metadata: any): void {
    if (metadata.elementType) {
      if (!this.indices.byType.has(metadata.elementType)) {
        this.indices.byType.set(metadata.elementType, new Set());
      }
      this.indices.byType.get(metadata.elementType)!.add(selector);
    }

    if (metadata.domain) {
      if (!this.indices.byDomain.has(metadata.domain)) {
        this.indices.byDomain.set(metadata.domain, new Set());
      }
      this.indices.byDomain.get(metadata.domain)!.add(selector);
    }
  }

  /**
   * البحث السريع باستخدام الفهرسة
   */
  quickFind(
    query: {
      elementType?: string;
      domain?: string;
      tag?: string;
    }
  ): string[] {
    const results: Set<string> = new Set();

    if (query.elementType && this.indices.byType.has(query.elementType)) {
      const set = this.indices.byType.get(query.elementType)!;
      set.forEach(s => results.add(s));
    }

    if (query.domain && this.indices.byDomain.has(query.domain)) {
      const set = this.indices.byDomain.get(query.domain)!;
      set.forEach(s => results.add(s));
    }

    return Array.from(results);
  }
}

/**
 * محرك التحسين التدريجي
 */
class IncrementalOptimizer {
  private baselineTime = 0;
  private improvements: number[] = [];

  /**
   * قياس التحسن
   */
  measureImprovement(currentTime: number, previousTime: number): number {
    const improvement = ((previousTime - currentTime) / previousTime) * 100;
    this.improvements.push(improvement);

    if (this.baselineTime === 0) {
      this.baselineTime = previousTime;
    }

    return improvement;
  }

  /**
   * الحصول على متوسط التحسن
   */
  getAverageImprovement(): number {
    if (this.improvements.length === 0) return 0;
    return this.improvements.reduce((a, b) => a + b, 0) / this.improvements.length;
  }

  /**
   * التنبؤ بالتحسن المستقبلي
   */
  predictFutureImprovement(): number {
    if (this.improvements.length < 2) return 0;

    const recent = this.improvements.slice(-5);
    const trend = recent.reduce((sum, val, i) => {
      return sum + val * (i + 1) / recent.length;
    }, 0);

    return Math.max(0, trend);
  }
}

/**
 * النظام المتخصص في معالجة الحالات الصعبة
 */
class HardCaseHandler {
  /**
   * اكتشاف الحالات الصعبة
   */
  isHardCase(selector: string, failureRate: number): boolean {
    return (
      failureRate > 0.3 ||
      selector.length > 500 ||
      (selector.match(/[>+~]/g) || []).length > 5 ||
      selector.includes(':not(') ||
      selector.includes(':has(')
    );
  }

  /**
   * توليد محددات بديلة للحالات الصعبة
   */
  generateAlternatives(selector: string): string[] {
    const alternatives: string[] = [];

    // 1. تبسيط بالتدريج
    const parts = selector.split(' ');
    for (let i = 1; i < parts.length; i++) {
      alternatives.push(parts.slice(-i).join(' '));
    }

    // 2. استخدام XPath
    alternatives.push(this.selectorToXPath(selector));

    // 3. استخدام البحث عن الخصائص
    alternatives.push(this.extractAttributes(selector));

    // 4. استخدام البحث عن النص
    if (selector.includes('text') || selector.includes('content')) {
      alternatives.push(this.extractTextPattern(selector));
    }

    return alternatives.filter(alt => alt.length > 0 && alt !== selector);
  }

  /**
   * تحويل CSS selector إلى XPath
   */
  private selectorToXPath(selector: string): string {
    // تحويل بسيط
    let xpath = '//';

    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return `//*[@id='${id}']`;
    }

    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return `//*[contains(@class, '${className}')]`;
    }

    // العام
    return `//${selector.replace(/\./g, '/*[@class=').replace(/\[/g, '[@')}`;
  }

  /**
   * استخراج الخصائص
   */
  private extractAttributes(selector: string): string {
    const match = selector.match(/\[([^\]]+)\]/);
    if (match) {
      return `[${match[1]}]`;
    }
    return '';
  }

  /**
   * استخراج نمط النص
   */
  private extractTextPattern(selector: string): string {
    const match = selector.match(/text\s*=\s*['"]([^'"]+)['"]/);
    if (match) {
      return `//*[contains(text(), '${match[1]}')]`;
    }
    return '';
  }
}

/**
 * محسّن الأداء الرئيسي المتكامل
 */
export class HighPerformanceOptimizer {
  private cachingSystem: SmartCachingSystem;
  private indexingSystem: AdvancedIndexingSystem;
  private incrementalOptimizer: IncrementalOptimizer;
  private hardCaseHandler: HardCaseHandler;

  private cacheHits = 0;
  private cacheMisses = 0;
  private totalTime = 0;

  constructor() {
    this.cachingSystem = new SmartCachingSystem();
    this.indexingSystem = new AdvancedIndexingSystem();
    this.incrementalOptimizer = new IncrementalOptimizer();
    this.hardCaseHandler = new HardCaseHandler();

    // تنظيف دوري للكاش
    setInterval(() => {
      this.cachingSystem.cleanup();
    }, 60 * 60 * 1000); // كل ساعة
  }

  /**
   * البحث المحسّن
   */
  async optimizedFind(
    selectors: string[],
    page: any,
    context: any
  ): Promise<{
    selector: string;
    element: any;
    responseTime: number;
    fromCache: boolean;
  }> {
    const startTime = Date.now();

    // 1. محاولة الكاش أولاً
    for (const selector of selectors) {
      const cached = this.cachingSystem.get(selector);

      if (cached && cached.successRate > 0.8) {
        try {
          const element = await page.locator(selector).first();
          const box = await element.boundingBox();

          if (box && box.width > 0 && box.height > 0) {
            this.cacheHits++;
            const responseTime = Date.now() - startTime;
            this.totalTime += responseTime;

            return {
              selector,
              element,
              responseTime,
              fromCache: true,
            };
          }
        } catch {}
      }
    }

    // 2. البحث العادي
    this.cacheMisses++;

    for (const selector of selectors) {
      const isHardCase = this.hardCaseHandler.isHardCase(selector, 0.5);

      if (isHardCase) {
        // معالجة خاصة للحالات الصعبة
        const alternatives = this.hardCaseHandler.generateAlternatives(selector);

        for (const alt of alternatives) {
          try {
            const element = await page.locator(alt).first();
            const box = await element.boundingBox();

            if (box && box.width > 0 && box.height > 0) {
              const responseTime = Date.now() - startTime;
              this.totalTime += responseTime;
              this.updateCache(alt, true, responseTime, context);

              return {
                selector: alt,
                element,
                responseTime,
                fromCache: false,
              };
            }
          } catch {}
        }
      } else {
        // البحث العادي
        try {
          const element = await page.locator(selector).first();
          const box = await element.boundingBox();

          if (box && box.width > 0 && box.height > 0) {
            const responseTime = Date.now() - startTime;
            this.totalTime += responseTime;
            this.updateCache(selector, true, responseTime, context);

            return {
              selector,
              element,
              responseTime,
              fromCache: false,
            };
          }
        } catch {}
      }
    }

    throw new Error('لم يتم العثور على العنصر');
  }

  /**
   * تحديث الكاش بناءً على النتيجة
   */
  private updateCache(
    selector: string,
    success: boolean,
    responseTime: number,
    context: any
  ): void {
    const cached = this.cachingSystem.get(selector);

    if (cached) {
      cached.successRate = success ? 1 : 0;
      cached.averageTime = responseTime;
    } else {
      this.cachingSystem.set(selector, {
        selector,
        successRate: success ? 1 : 0,
        lastUsed: Date.now(),
        useCount: 1,
        averageTime: responseTime,
        domain: context.domain || '',
        elementType: context.elementType || '',
        confidence: success ? 1 : 0,
      });
    }
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getOptimizationStats(): PerformanceOptimization {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const savedTime = this.cacheHits * 50; // تقدير توفير الوقت

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      savedTime,
      optimizationRatio:
        totalRequests > 0
          ? (this.cacheHits / totalRequests) * 100
          : 0,
      avgResponseTime:
        totalRequests > 0
          ? this.totalTime / totalRequests
          : 0,
    };
  }

  /**
   * تقرير الأداء
   */
  generatePerformanceReport(): string {
    const stats = this.getOptimizationStats();
    const improvement = this.incrementalOptimizer.getAverageImprovement();

    let report = '📊 تقرير الأداء\n';
    report += '═══════════════════════\n\n';

    report += `📈 الإحصائيات:\n`;
    report += `  • نجاحات الكاش: ${stats.cacheHits}\n`;
    report += `  • فشل الكاش: ${stats.cacheMisses}\n`;
    report += `  • نسبة النجاح: ${stats.optimizationRatio.toFixed(1)}%\n`;
    report += `  • الوقت المحفوظ: ${stats.savedTime}ms\n`;
    report += `  • متوسط الاستجابة: ${stats.avgResponseTime.toFixed(0)}ms\n\n`;

    report += `📊 التحسن:\n`;
    report += `  • متوسط التحسن: ${improvement.toFixed(1)}%\n`;
    report += `  • التحسن المتوقع: ${this.incrementalOptimizer.predictFutureImprovement().toFixed(1)}%\n`;

    return report;
  }
}

/**
 * دالة مساعدة لإنشاء المحسّن
 */
export function createHighPerformanceOptimizer(): HighPerformanceOptimizer {
  return new HighPerformanceOptimizer();
}
