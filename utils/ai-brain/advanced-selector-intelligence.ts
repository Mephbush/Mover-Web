/**
 * نظام ذكاء المحددات المتقدم
 * Advanced Selector Intelligence System
 *
 * يحسّن من قدرة الروبوت على اكتشاف والتعامل مع محددات العناصر
 * Improves selector detection, ranking, and fallback strategies
 */

import { LearningEngine } from './learning-engine';
import { getErrorLogger } from './error-telemetry-system';

export interface SelectorCandidate {
  selector: string;
  type: 'css' | 'xpath' | 'id' | 'class' | 'data-testid' | 'aria-label' | 'text' | 'hybrid';
  score: number; // 0-1
  confidence: number; // 0-1
  reliability: number; // معدل النجاح السابق
  specificity: number; // مدى تخصص المحدد
  robustness: number; // مدى مقاومة المحدد للتغييرات
  estimatedWaitTime: number; // ms
  fallbackLevel: number; // 0 = primary, 1+ = fallback
  metadata: {
    weight: number;
    occurrences: number;
    lastUsed: Date;
    successCount: number;
    failureCount: number;
    tags: string[];
  };
}

export interface SelectorContext {
  website: string;
  taskType: string; // login, click, type, extract, etc.
  elementType: string; // button, input, link, div, etc.
  elementRole?: string; // from ARIA
  elementText?: string;
  pageStructure?: any;
  previousSelectors?: string[];
}

export interface SelectorStrategy {
  primary: SelectorCandidate[];
  fallbacks: SelectorCandidate[];
  recommendations: string[];
  estimatedSuccessRate: number;
  reasoning: string;
}

export interface SelectorReport {
  context: SelectorContext;
  candidates: SelectorCandidate[];
  strategy: SelectorStrategy;
  timestamp: Date;
  performance: {
    foundElements: number;
    totalAttempts: number;
    successRate: number;
    averageTime: number;
  };
}

/**
 * محرك اختيار المحددات الذكي المتقدم
 */
export class AdvancedSelectorIntelligence {
  private learningCache: Map<string, SelectorCandidate[]> = new Map();
  private performanceHistory: Map<string, SelectorReport[]> = new Map();
  private selectorPatterns: Map<string, RegExp> = new Map();
  private learningEngine: LearningEngine;
  private errorLogger = getErrorLogger();

  /**
   * Initialize selector patterns
   */
  constructor(learningEngine?: LearningEngine) {
    this.learningEngine = learningEngine || new LearningEngine();
    this.initializeSelectorPatterns();
  }

  /**
   * تهيئة أنماط المحددات الشهيرة
   */
  private initializeSelectorPatterns(): void {
    // أنماط محددات شهيرة للعناصر المختلفة
    this.selectorPatterns.set('email_field', /(?:email|mail|user|account)/i);
    this.selectorPatterns.set('password_field', /(?:password|pass|pwd)/i);
    this.selectorPatterns.set('submit_button', /(?:submit|login|signin|enter|search)/i);
    this.selectorPatterns.set('search_field', /(?:search|query|find)/i);
    this.selectorPatterns.set('first_name', /(?:first|fname|given)/i);
    this.selectorPatterns.set('last_name', /(?:last|lname|family)/i);
    this.selectorPatterns.set('phone_field', /(?:phone|mobile|tel)/i);
    this.selectorPatterns.set('address_field', /(?:address|street|location)/i);
  }

  /**
   * اختيار أفضل مجموعة من محددات العناصر
   *
   * الخطوات:
   * 1. توليد جميع المحددات الممكنة (من التعلم، DOM snapshot، و pageStructure)
   * 2. تقييم كل محدد
   * 3. ترتيب حسب الثقة والموثوقية
   * 4. بناء استراتيجية مع fallbacks
   */
  async selectBestSelectors(
    context: SelectorContext,
    pageContent?: string,
    pageStructure?: any,
    page?: any // Playwright Page instance اختياري
  ): Promise<SelectorStrategy> {
    console.log(`🎯 اختيار محددات ذكية للموقع: ${context.website}`);
    console.log(`   المهمة: ${context.taskType}, نوع العنصر: ${context.elementType}`);

    // 1. البحث في قاعدة التعلم
    const learnedCandidates = await this.getLearnedSelectors(context);
    console.log(`   📚 محددات متعلمة: ${learnedCandidates.length}`);

    let generatedCandidates: SelectorCandidate[] = [];
    let snapshotUsed = false;

    // 2. استخراج DOM snapshot من الصفحة الفعلية (أولوية أعلى)
    if (page) {
      try {
        const snapshot = await this.extractDOMSnapshot(page, context);
        if (snapshot.elements.length > 0) {
          generatedCandidates = this.generateSelectorsFromDOMSnapshot(snapshot, context);
          snapshotUsed = true;
          console.log(`   🌐 محددات من DOM snapshot: ${generatedCandidates.length} (الحقيقي!)`);
        }
      } catch (error: any) {
        console.log(`   ⚠️ فشل استخراج DOM snapshot: ${error.message}`);
      }
    }

    // 3. fallback: توليد محددات من محتوى الصفحة (regex)
    if (!snapshotUsed && pageContent) {
      generatedCandidates = this.generateSelectorsFromContent(pageContent, context);
      console.log(`   🔍 محددات مولدة (regex): ${generatedCandidates.length}`);
    }

    // 4. توليد محددات من البنية DOM
    const structureCandidates = pageStructure
      ? this.generateSelectorsFromStructure(pageStructure, context)
      : [];
    console.log(`   🏗️ محددات من البنية: ${structureCandidates.length}`);

    // 5. دمج جميع المحددات
    const allCandidates = [
      ...learnedCandidates,
      ...generatedCandidates,
      ...structureCandidates,
    ];

    // 6. إزالة التكرار والتقييم
    const uniqueCandidates = this.deduplicateSelectors(allCandidates);
    console.log(`   🔄 محددات فريدة: ${uniqueCandidates.length}`);

    // 7. تقييم كل محدد
    const scoredCandidates = await this.scoreSelectors(
      uniqueCandidates,
      context
    );
    console.log(`   📊 تم تقييم المحددات بنجاح`);

    // 8. بناء الاستراتيجية
    const strategy = this.buildStrategy(scoredCandidates, context);
    console.log(`   ✅ استراتيجية محددات جاهزة`);
    console.log(`   🎯 معدل النجاح المتوقع: ${(strategy.estimatedSuccessRate * 100).toFixed(1)}%`);
    if (snapshotUsed) {
      console.log(`   ✨ تم استخدام بيانات runtime حقيقية من الصفحة`);
    }

    return strategy;
  }

  /**
   * الحصول على محددات متعلمة من التجارب السابقة
   */
  private async getLearnedSelectors(
    context: SelectorContext
  ): Promise<SelectorCandidate[]> {
    const cacheKey = `${context.website}:${context.taskType}:${context.elementType}`;

    // التحقق من الذاكرة المؤقتة
    if (this.learningCache.has(cacheKey)) {
      const cached = this.learningCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      // Get learned selectors from learning engine
      const learnedSelector = await this.learningEngine.getBestSelector(
        context.taskType,
        context.website,
        context
      );

      const candidates: SelectorCandidate[] = [];

      if (learnedSelector && learnedSelector.selector) {
        candidates.push({
          selector: learnedSelector.selector,
          type: 'css',
          score: Math.min(learnedSelector.confidence * 1.2, 1.0), // Boost learned selectors
          confidence: learnedSelector.confidence,
          reliability: learnedSelector.confidence,
          specificity: 0.8,
          robustness: 0.85,
          estimatedWaitTime: 300,
          fallbackLevel: 0,
          metadata: {
            weight: 120,
            occurrences: 1,
            lastUsed: new Date(),
            successCount: 1,
            failureCount: 0,
            tags: ['learned', context.taskType, context.elementType],
          },
        });
      }

      // Cache the results
      if (candidates.length > 0) {
        this.learningCache.set(cacheKey, candidates);
      }

      return candidates;
    } catch (error: any) {
      this.errorLogger.logError({
        category: 'unknown',
        severity: 'warning',
        message: `Failed to get learned selectors: ${error.message}`,
        context: {
          website: context.website,
          taskType: context.taskType,
          elementType: context.elementType,
          timestamp: new Date(),
        },
        metadata: {
          customData: { context },
        },
      });
      return [];
    }
  }

  /**
   * استخراج snapshot DOM غني من الصفحة الفعلية باستخدام page.evaluate
   * يوفر معلومات runtime: computed styles, visibility, actual attributes
   * يشمل: Shadow DOM, iframes, web components
   */
  async extractDOMSnapshot(
    page: any,
    context: SelectorContext
  ): Promise<{
    elements: any[];
    shadowDOMElements: any[];
    iframeElements: any[];
    pageMetadata: any;
  }> {
    try {
      const snapshot = await page.evaluate(() => {
        const elements: any[] = [];
        const shadowDOMElements: any[] = [];
        const iframeElements: any[] = [];

        // ========== البحث في DOM العادي ==========
        document.querySelectorAll('button, input, a, [role="button"], [data-testid], [aria-label]')
          .forEach((el) => {
            const rect = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);

            elements.push({
              tagName: el.tagName,
              type: (el as any).type || null,
              id: el.id || null,
              className: el.className || null,
              textContent: el.textContent?.trim().substring(0, 100) || null,
              ariaLabel: el.getAttribute('aria-label'),
              dataTestId: el.getAttribute('data-testid'),
              role: el.getAttribute('role'),
              placeholder: (el as any).placeholder || null,
              isVisible: rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden' && computed.display !== 'none',
              isDisabled: (el as any).disabled || false,
              offsetHeight: rect.height,
              offsetWidth: rect.width,
              parentTagName: el.parentElement?.tagName || null,
              dataAttributes: Array.from(el.attributes)
                .filter(attr => attr.name.startsWith('data-'))
                .map(attr => ({ name: attr.name, value: attr.value })),
              source: 'regular_dom',
            });
          });

        // ========== البحث في Shadow DOM ==========
        document.querySelectorAll('*').forEach((el) => {
          if (el.shadowRoot) {
            el.shadowRoot.querySelectorAll('button, input, a, [role="button"], [data-testid], [aria-label]')
              .forEach((shadowEl) => {
                const rect = shadowEl.getBoundingClientRect();
                const computed = window.getComputedStyle(shadowEl);

                shadowDOMElements.push({
                  tagName: shadowEl.tagName,
                  type: (shadowEl as any).type || null,
                  id: shadowEl.id || null,
                  className: shadowEl.className || null,
                  textContent: shadowEl.textContent?.trim().substring(0, 100) || null,
                  ariaLabel: shadowEl.getAttribute('aria-label'),
                  dataTestId: shadowEl.getAttribute('data-testid'),
                  role: shadowEl.getAttribute('role'),
                  placeholder: (shadowEl as any).placeholder || null,
                  isVisible: rect.width > 0 && rect.height > 0 && computed.visibility !== 'hidden' && computed.display !== 'none',
                  isDisabled: (shadowEl as any).disabled || false,
                  parentTagName: el.tagName,
                  parentId: el.id,
                  dataAttributes: Array.from(shadowEl.attributes)
                    .filter(attr => attr.name.startsWith('data-'))
                    .map(attr => ({ name: attr.name, value: attr.value })),
                  source: 'shadow_dom',
                });
              });
          }
        });

        // ========== البحث في iframes ==========
        // ملاحظة: قد لا يعمل إذا كان iframe من domain مختلف (same-origin policy)
        document.querySelectorAll('iframe').forEach((iframe) => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              iframeDoc.querySelectorAll('button, input, a, [role="button"], [data-testid], [aria-label]')
                .forEach((iframeEl) => {
                  const rect = iframeEl.getBoundingClientRect?.() || { width: 0, height: 0 };
                  const computed = (iframeEl.ownerDocument?.defaultView?.getComputedStyle || window.getComputedStyle)(iframeEl);

                  iframeElements.push({
                    tagName: iframeEl.tagName,
                    type: (iframeEl as any).type || null,
                    id: iframeEl.id || null,
                    className: iframeEl.className || null,
                    textContent: iframeEl.textContent?.trim().substring(0, 100) || null,
                    ariaLabel: iframeEl.getAttribute('aria-label'),
                    dataTestId: iframeEl.getAttribute('data-testid'),
                    role: iframeEl.getAttribute('role'),
                    iframeSrc: iframe.src,
                    iframeId: iframe.id,
                    isVisible: rect.width > 0 && rect.height > 0,
                    isDisabled: (iframeEl as any).disabled || false,
                    dataAttributes: Array.from(iframeEl.attributes)
                      .filter(attr => attr.name.startsWith('data-'))
                      .map(attr => ({ name: attr.name, value: attr.value })),
                    source: 'iframe',
                  });
                });
            }
          } catch (e) {
            // Cross-origin iframe - skip
          }
        });

        return {
          elements,
          shadowDOMElements,
          iframeElements,
          pageUrl: window.location.href,
          pageTitle: document.title,
          domReady: document.readyState === 'complete',
        };
      });

      if (this.errorLogger) {
        this.errorLogger.logInfo('DOM snapshot extracted successfully (with Shadow DOM & iframes)', {
          elementCount: snapshot.elements.length,
          shadowDOMCount: snapshot.shadowDOMElements.length,
          iframeCount: snapshot.iframeElements.length,
          pageUrl: snapshot.pageUrl,
        });
      }

      return snapshot;
    } catch (error: any) {
      if (this.errorLogger) {
        this.errorLogger.logError({
          category: 'dom_extraction',
          severity: 'warning',
          message: `Failed to extract DOM snapshot: ${error.message}`,
          context: { elementType: context.elementType },
        } as any);
      }
      return { elements: [], shadowDOMElements: [], iframeElements: [], pageMetadata: {} };
    }
  }

  /**
   * توليد محددات من DOM snapshot حقيقي (أسلوب محسّن)
   * يشمل: regular DOM, Shadow DOM, iframes
   */
  private generateSelectorsFromDOMSnapshot(
    snapshot: {
      elements: any[];
      shadowDOMElements?: any[];
      iframeElements?: any[];
    },
    context: SelectorContext
  ): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    const seenSelectors = new Set<string>();

    // معالجة جميع مصادر العناصر
    const allElements = [
      ...(snapshot.elements || []),
      ...(snapshot.shadowDOMElements || []).map(e => ({...e, domType: 'shadow' as const})),
      ...(snapshot.iframeElements || []).map(e => ({...e, domType: 'iframe' as const})),
    ];

    allElements.forEach((element) => {
      // حساب معدل الموثوقية بناءً على مصدر العنصر
      const isShadowDOM = element.domType === 'shadow';
      const isIframe = element.domType === 'iframe';
      const domSourceTag = isShadowDOM ? 'shadow-dom' : isIframe ? 'iframe' : 'regular-dom';

      // Adjust confidence for elements from complex DOM structures
      const domComplexityFactor = isShadowDOM ? 0.85 : isIframe ? 0.8 : 1.0;

      // 1. استخدم data-testid إن وجد
      if (element.dataTestId && !seenSelectors.has(`[data-testid="${element.dataTestId}"]`)) {
        const selector = `[data-testid="${element.dataTestId}"]`;
        seenSelectors.add(selector);
        candidates.push({
          selector,
          type: 'data-testid',
          score: (element.isVisible ? 0.95 : 0.75) * domComplexityFactor,
          confidence: 0.9 * domComplexityFactor,
          reliability: 0.88 * domComplexityFactor,
          specificity: 0.98,
          robustness: 0.95 * domComplexityFactor,
          estimatedWaitTime: isShadowDOM ? 400 : isIframe ? 600 : 300,
          fallbackLevel: isIframe ? 2 : isShadowDOM ? 1 : 0,
          metadata: {
            weight: isIframe ? 85 : isShadowDOM ? 100 : 110,
            occurrences: 1,
            lastUsed: new Date(),
            successCount: 0,
            failureCount: 0,
            tags: ['data-testid', 'runtime-extracted', domSourceTag, context.elementType],
          },
        });
      }

      // 2. استخدم aria-label إن وجد وكان مناسباً
      if (element.ariaLabel && !seenSelectors.has(`[aria-label="${element.ariaLabel}"]`)) {
        const selector = `[aria-label="${element.ariaLabel}"]`;
        seenSelectors.add(selector);
        candidates.push({
          selector,
          type: 'aria-label',
          score: element.isVisible ? 0.9 : 0.7,
          confidence: 0.85,
          reliability: 0.82,
          specificity: 0.92,
          robustness: 0.88,
          estimatedWaitTime: 400,
          fallbackLevel: 1,
          metadata: {
            weight: 95,
            occurrences: 1,
            lastUsed: new Date(),
            successCount: 0,
            failureCount: 0,
            tags: ['aria-label', 'runtime-extracted', context.elementType],
          },
        });
      }

      // 3. استخدم ID إن وجد
      if (element.id && !seenSelectors.has(`#${element.id}`)) {
        const selector = `#${element.id}`;
        seenSelectors.add(selector);
        candidates.push({
          selector,
          type: 'id',
          score: element.isVisible ? 0.98 : 0.85,
          confidence: 0.95,
          reliability: 0.92,
          specificity: 1.0,
          robustness: 0.98,
          estimatedWaitTime: 250,
          fallbackLevel: 0,
          metadata: {
            weight: 120,
            occurrences: 1,
            lastUsed: new Date(),
            successCount: 0,
            failureCount: 0,
            tags: ['id', 'runtime-extracted', context.elementType],
          },
        });
      }

      // 4. استخدم role attribute مع aria-label
      if (element.role && element.ariaLabel) {
        const selector = `[role="${element.role}"][aria-label="${element.ariaLabel}"]`;
        if (!seenSelectors.has(selector)) {
          seenSelectors.add(selector);
          candidates.push({
            selector,
            type: 'hybrid',
            score: element.isVisible ? 0.88 : 0.68,
            confidence: 0.83,
            reliability: 0.80,
            specificity: 0.95,
            robustness: 0.85,
            estimatedWaitTime: 500,
            fallbackLevel: 1,
            metadata: {
              weight: 85,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['hybrid', 'role+aria', context.elementType],
            },
          });
        }
      }
    });

    return candidates;
  }

  /**
   * توليد محددات من محتوى الصفحة (fallback من regex للتوافقية)
   */
  private generateSelectorsFromContent(
    pageContent: string,
    context: SelectorContext
  ): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];

    // 1. البحث عن data-testid
    const dataTestIdMatches = pageContent.match(
      /data-testid=["']([^"']*)/gi
    );
    if (dataTestIdMatches) {
      dataTestIdMatches.forEach((match) => {
        const testId = match.replace(/data-testid=["']/, '');
        candidates.push({
          selector: `[data-testid="${testId}"]`,
          type: 'data-testid',
          score: 0.85,
          confidence: 0.80,
          reliability: 0.75,
          specificity: 0.92,
          robustness: 0.87,
          estimatedWaitTime: 500,
          fallbackLevel: 1,
          metadata: {
            weight: 90,
            occurrences: 1,
            lastUsed: new Date(),
            successCount: 0,
            failureCount: 0,
            tags: ['data-testid', 'regex-extracted', context.elementType],
          },
        });
      });
    }

    // 2. البحث عن aria-label
    const ariaLabelMatches = pageContent.match(
      /aria-label=["']([^"']*)/gi
    );
    if (ariaLabelMatches) {
      ariaLabelMatches.forEach((match) => {
        const label = match.replace(/aria-label=["']/, '');
        if (label.toLowerCase().includes(context.elementType.toLowerCase())) {
          candidates.push({
            selector: `[aria-label="${label}"]`,
            type: 'aria-label',
            score: 0.85,
            confidence: 0.8,
            reliability: 0.75,
            specificity: 0.85,
            robustness: 0.85,
            estimatedWaitTime: 800,
            fallbackLevel: 1,
            metadata: {
              weight: 80,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['aria-label', context.elementType],
            },
          });
        }
      });
    }

    // 3. البحث عن attributes محددة
    candidates.push(...this.generateFromAttributes(pageContent, context));

    // 4. البحث عن text content
    if (context.elementText) {
      candidates.push({
        selector: `//*[contains(text(), "${context.elementText}")]`,
        type: 'text',
        score: 0.7,
        confidence: 0.65,
        reliability: 0.6,
        specificity: 0.5,
        robustness: 0.4,
        estimatedWaitTime: 1500,
        fallbackLevel: 2,
        metadata: {
          weight: 50,
          occurrences: 1,
          lastUsed: new Date(),
          successCount: 0,
          failureCount: 0,
          tags: ['text-match', context.elementType],
        },
      });
    }

    return candidates;
  }

  /**
   * توليد محددات من Attributes
   */
  private generateFromAttributes(
    pageContent: string,
    context: SelectorContext
  ): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];

    // البحث عن ID attributes
    const idMatches = pageContent.match(/id=["']([^"']*)/gi);
    if (idMatches) {
      idMatches.forEach((match) => {
        const id = match.replace(/id=["']/, '');
        if (this.matchesContext(id, context)) {
          candidates.push({
            selector: `#${id}`,
            type: 'id',
            score: 0.95,
            confidence: 0.9,
            reliability: 0.85,
            specificity: 1.0,
            robustness: 0.95,
            estimatedWaitTime: 300,
            fallbackLevel: 0,
            metadata: {
              weight: 110,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['id', context.elementType],
            },
          });
        }
      });
    }

    // البحث عن Class attributes
    const classMatches = pageContent.match(/class=["']([^"']*)/gi);
    if (classMatches) {
      classMatches.forEach((match) => {
        const classes = match.replace(/class=["']/, '').split(' ');
        classes.forEach((cls) => {
          if (this.matchesContext(cls, context)) {
            candidates.push({
              selector: `.${cls}`,
              type: 'class',
              score: 0.75,
              confidence: 0.7,
              reliability: 0.65,
              specificity: 0.6,
              robustness: 0.65,
              estimatedWaitTime: 600,
              fallbackLevel: 1,
              metadata: {
                weight: 70,
                occurrences: 1,
                lastUsed: new Date(),
                successCount: 0,
                failureCount: 0,
                tags: ['class', context.elementType],
              },
            });
          }
        });
      });
    }

    return candidates;
  }

  /**
   * توليد محددات من بنية DOM
   */
  private generateSelectorsFromStructure(
    structure: any,
    context: SelectorContext
  ): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];

    // سيتم تنفيذ هذا الجزء بناءً على بنية DOM الفعلية
    // هنا نستخدم مثال بسيط

    // محددات معتمدة على نوع العنصر
    const elementSelectors = this.getElementTypeSelectors(context.elementType);
    candidates.push(...elementSelectors);

    return candidates;
  }

  /**
   * الحصول على محددات معتمدة على نوع العنصر
   */
  private getElementTypeSelectors(elementType: string): SelectorCandidate[] {
    const selectors: Map<string, SelectorCandidate[]> = new Map([
      [
        'input',
        [
          {
            selector: 'input[type="text"]',
            type: 'css',
            score: 0.7,
            confidence: 0.65,
            reliability: 0.6,
            specificity: 0.7,
            robustness: 0.65,
            estimatedWaitTime: 500,
            fallbackLevel: 1,
            metadata: {
              weight: 70,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['input-text'],
            },
          },
        ],
      ],
      [
        'button',
        [
          {
            selector: 'button',
            type: 'css',
            score: 0.75,
            confidence: 0.7,
            reliability: 0.65,
            specificity: 0.5,
            robustness: 0.6,
            estimatedWaitTime: 400,
            fallbackLevel: 1,
            metadata: {
              weight: 75,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['button'],
            },
          },
        ],
      ],
      [
        'link',
        [
          {
            selector: 'a[href]',
            type: 'css',
            score: 0.7,
            confidence: 0.65,
            reliability: 0.6,
            specificity: 0.5,
            robustness: 0.55,
            estimatedWaitTime: 500,
            fallbackLevel: 1,
            metadata: {
              weight: 70,
              occurrences: 1,
              lastUsed: new Date(),
              successCount: 0,
              failureCount: 0,
              tags: ['link'],
            },
          },
        ],
      ],
    ]);

    return selectors.get(elementType) || [];
  }

  /**
   * تقييم المحددات بناءً على معايير متعددة
   */
  private async scoreSelectors(
    candidates: SelectorCandidate[],
    context: SelectorContext
  ): Promise<SelectorCandidate[]> {
    const scored = candidates.map((candidate) => {
      // 1. حساب درجة الثقة بناءً على النوع
      const typeScore = this.getTypeScore(candidate.type);

      // 2. حساب درجة الموثوقية من التاريخ
      const reliabilityScore = candidate.metadata.successCount /
        (candidate.metadata.successCount + candidate.metadata.failureCount + 1);

      // 3. حساب درجة الخصوصية
      const specificityScore = this.calculateSpecificity(candidate.selector);

      // 4. حساب درجة المقاومة للتغييرات
      const robustnessScore = this.calculateRobustness(
        candidate.selector,
        context
      );

      // 5. الدرجة الكلية (مرجح)
      const finalScore =
        typeScore * 0.3 + // وزن النوع
        reliabilityScore * 0.3 + // وزن الموثوقية
        specificityScore * 0.2 + // وزن الخصوصية
        robustnessScore * 0.2; // وزن المقاومة

      return {
        ...candidate,
        score: Math.max(0, Math.min(1, finalScore)),
        confidence: Math.max(0, Math.min(1, finalScore * 0.9)),
      };
    });

    // ترتيب تنازلي حسب الدرجة
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * حساب درجة النوع
   */
  private getTypeScore(type: string): number {
    const scores: Record<string, number> = {
      id: 0.95,
      'data-testid': 0.9,
      'aria-label': 0.85,
      css: 0.7,
      xpath: 0.65,
      class: 0.6,
      text: 0.5,
      hybrid: 0.75,
    };
    return scores[type] || 0.5;
  }

  /**
   * حساب درجة الخصوصية (كم عدد العناصر التي تطابق المحدد)
   */
  private calculateSpecificity(selector: string): number {
    let score = 0.5;

    // IDs لها specificity عالية جداً
    if (selector.includes('#')) score = Math.max(score, 0.95);

    // data-testid عالية جداً
    if (selector.includes('[data-testid')) score = Math.max(score, 0.9);

    // Classes عالية
    if (selector.includes('.')) score = Math.max(score, 0.7);

    // XPath عالية إذا كانت محددة بشكل دقيق
    if (selector.startsWith('/')) {
      if (selector.includes('[position()') || selector.includes('[1]')) {
        score = Math.max(score, 0.8);
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * حساب درجة المقاومة للتغييرات
   */
  private calculateRobustness(selector: string, context: SelectorContext): number {
    let score = 0.5;

    // المحددات المبنية على attributes ثابتة أكثر
    if (selector.includes('[data-') || selector.includes('[aria-')) {
      score = Math.max(score, 0.85);
    }

    // IDs ثابتة جداً
    if (selector.startsWith('#')) {
      score = Math.max(score, 0.9);
    }

    // المحددات القائمة على text أقل stability
    if (selector.includes('text()')) {
      score = Math.min(score, 0.4);
    }

    // المحددات القائمة على position قد تتغير
    if (selector.includes('[position()') || selector.includes('nth-')) {
      score = Math.min(score, 0.5);
    }

    return Math.min(score, 1.0);
  }

  /**
   * التحقق من توافق المحدد مع السياق
   */
  private matchesContext(candidate: string, context: SelectorContext): boolean {
    const lowerCandidate = candidate.toLowerCase();
    const lowerType = context.elementType.toLowerCase();

    // التحقق من أنماط محددة
    if (this.selectorPatterns.has(context.taskType)) {
      const pattern = this.selectorPatterns.get(context.taskType);
      if (pattern && pattern.test(candidate)) {
        return true;
      }
    }

    // التحقق من توافق أساسي
    return (
      lowerCandidate.includes(lowerType) ||
      lowerCandidate.includes(context.taskType.toLowerCase())
    );
  }

  /**
   * إزالة محددات مكررة
   */
  private deduplicateSelectors(
    candidates: SelectorCandidate[]
  ): SelectorCandidate[] {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      if (seen.has(candidate.selector)) {
        return false;
      }
      seen.add(candidate.selector);
      return true;
    });
  }

  /**
   * بناء استراتيجية محددات
   */
  private buildStrategy(
    candidates: SelectorCandidate[],
    context: SelectorContext
  ): SelectorStrategy {
    // الفصل بين المحددات الأولية والبدائل
    const primary = candidates.filter((c) => c.fallbackLevel === 0);
    const fallbacks = candidates.filter((c) => c.fallbackLevel > 0);

    // ضمان وجود أساسيات
    if (primary.length === 0 && candidates.length > 0) {
      primary.push(candidates[0]);
      fallbacks.splice(fallbacks.indexOf(candidates[0]), 1);
    }

    // حساب معدل النجاح المتوقع
    const primarySuccess =
      primary.length > 0 ? primary[0].confidence : 0.3;
    const fallbackBoost =
      fallbacks.reduce((sum, f) => sum + f.confidence, 0) /
      (fallbacks.length || 1);
    const estimatedSuccessRate = Math.min(
      0.99,
      primarySuccess + fallbackBoost * 0.2
    );

    const recommendations: string[] = [];

    // إنشاء توصيات بناءً على السياق
    if (primary.length === 0) {
      recommendations.push('⚠️ لم يتم العثور على محددات أولية قوية');
      recommendations.push('💡 جرب استخدام DevTools للبحث عن data-testid');
    }

    if (primary.length > 0 && primary[0].confidence < 0.7) {
      recommendations.push('⚠️ مستوى ثقة منخفض في المحدد الأول');
      recommendations.push('💡 استخدم عدة محددات بديلة');
    }

    if (context.elementType === 'input' && !candidates.some((c) => c.type === 'id')) {
      recommendations.push('💡 البحث عن ID أو data-testid للـ input');
    }

    const reasoning = `تم اختيار ${primary.length} محددات أولية و ${fallbacks.length} محددات بديلة. 
معدل النجاح المتوقع: ${(estimatedSuccessRate * 100).toFixed(1)}%. 
الأولوية: ${primary.map((c) => c.selector).join(', ')}`;

    return {
      primary: primary.slice(0, 3), // أقصى 3 محددات أولية
      fallbacks: fallbacks.slice(0, 5), // أقصى 5 محددات بديلة
      recommendations,
      estimatedSuccessRate,
      reasoning,
    };
  }

  /**
   * تحديث أداء المحدد بناءً على النتائج
   */
  async updatePerformance(
    selector: string,
    success: boolean,
    executionTime: number,
    context: SelectorContext
  ): Promise<void> {
    const cacheKey = `${context.website}:${context.taskType}:${context.elementType}`;

    if (this.learningCache.has(cacheKey)) {
      const cached = this.learningCache.get(cacheKey);
      if (cached) {
        const candidate = cached.find((c) => c.selector === selector);
        if (candidate) {
          if (success) {
            candidate.metadata.successCount++;
            candidate.reliability = candidate.metadata.successCount /
              (candidate.metadata.successCount +
                candidate.metadata.failureCount);
          } else {
            candidate.metadata.failureCount++;
          }
          candidate.metadata.lastUsed = new Date();
        }
      }
    }
  }

  /**
   * الحصول على تقرير تفصيلي عن المحددات
   */
  getDetailedReport(
    strategy: SelectorStrategy,
    context: SelectorContext
  ): SelectorReport {
    return {
      context,
      candidates: [...strategy.primary, ...strategy.fallbacks],
      strategy,
      timestamp: new Date(),
      performance: {
        foundElements: 0,
        totalAttempts: 0,
        successRate: 0,
        averageTime: 0,
      },
    };
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clearCache(): void {
    this.learningCache.clear();
    console.log('✅ تم مسح ذاكرة المحددات المؤقتة');
  }
}

// Export singleton instance
export const advancedSelectorIntelligence = new AdvancedSelectorIntelligence();
