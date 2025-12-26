/**
 * نظام التحقق المحسّن من العناصر
 * Enhanced Element Validator
 * 
 * تحقق متعدد المستويات: Visibility, Interactivity, Size, Shadow DOM, Context
 */

export interface ElementValidationResult {
  isValid: boolean;
  confidence: number;
  checks: {
    isVisible: boolean;
    isEnabled: boolean;
    hasSize: boolean;
    isInViewport: boolean;
    isInteractable: boolean;
    hasShadowDOM: boolean;
    isInIframe: boolean;
    contextuallyRelevant: boolean;
  };
  failureReasons: string[];
  warnings: string[];
  metadata: {
    boundingBox: any;
    displayStyle: string;
    opacity: number;
    pointerEvents: string;
  };
}

export interface EnhancedValidationOptions {
  checkVisibility?: boolean;
  checkEnability?: boolean;
  checkSize?: boolean;
  checkViewport?: boolean;
  checkInteractability?: boolean;
  checkShadowDOM?: boolean;
  checkIframe?: boolean;
  minSize?: { width: number; height: number };
  contextQuery?: any;
  timeoutMs?: number;
}

/**
 * محقق العناصر المحسّن
 */
export class EnhancedElementValidator {
  private static readonly DEFAULT_MIN_WIDTH = 1;
  private static readonly DEFAULT_MIN_HEIGHT = 1;
  private static readonly DEFAULT_TIMEOUT = 5000;

  /**
   * تحقق شامل من العنصر
   */
  static async validate(
    element: any,
    page?: any,
    options: EnhancedValidationOptions = {}
  ): Promise<ElementValidationResult> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || this.DEFAULT_TIMEOUT;
    const failureReasons: string[] = [];
    const warnings: string[] = [];

    const checks = {
      isVisible: false,
      isEnabled: false,
      hasSize: false,
      isInViewport: false,
      isInteractable: false,
      hasShadowDOM: false,
      isInIframe: false,
      contextuallyRelevant: false,
    };

    const metadata = {
      boundingBox: null,
      displayStyle: '',
      opacity: 1,
      pointerEvents: 'auto',
    };

    try {
      // 1. Check visibility
      if (options.checkVisibility !== false) {
        checks.isVisible = await this.checkVisibility(element, page);
        if (!checks.isVisible) {
          failureReasons.push('Element is not visible');
        }
      } else {
        checks.isVisible = true;
      }

      // 2. Check enablement
      if (options.checkEnability !== false) {
        checks.isEnabled = await this.checkEnablement(element);
        if (!checks.isEnabled) {
          warnings.push('Element is disabled or readonly');
        }
      } else {
        checks.isEnabled = true;
      }

      // 3. Check size
      if (options.checkSize !== false) {
        const sizeResult = await this.checkSize(element, options.minSize);
        checks.hasSize = sizeResult.valid;
        metadata.boundingBox = sizeResult.boundingBox;
        if (!checks.hasSize) {
          failureReasons.push(`Element too small: ${sizeResult.reason}`);
        }
      } else {
        checks.hasSize = true;
        metadata.boundingBox = await this.getBoundingBox(element);
      }

      // 4. Check viewport
      if (options.checkViewport !== false) {
        checks.isInViewport = await this.checkViewport(element, metadata.boundingBox);
        if (!checks.isInViewport) {
          warnings.push('Element is outside viewport');
        }
      } else {
        checks.isInViewport = true;
      }

      // 5. Check interactability
      if (options.checkInteractability !== false) {
        const interactResult = await this.checkInteractability(element);
        checks.isInteractable = interactResult.isInteractable;
        metadata.pointerEvents = interactResult.pointerEvents;
        if (!checks.isInteractable) {
          failureReasons.push(interactResult.reason);
        }
      } else {
        checks.isInteractable = true;
      }

      // 6. Check for shadow DOM
      if (options.checkShadowDOM !== false) {
        checks.hasShadowDOM = await this.checkShadowDOM(element);
        if (checks.hasShadowDOM) {
          warnings.push('Element is within Shadow DOM');
        }
      }

      // 7. Check for iframe
      if (options.checkIframe !== false && page) {
        checks.isInIframe = await this.checkIframe(page);
        if (checks.isInIframe) {
          warnings.push('Element might be in iframe');
        }
      }

      // 8. Contextual relevance
      if (options.contextQuery) {
        checks.contextuallyRelevant = await this.checkContextualRelevance(element, options.contextQuery);
        if (!checks.contextuallyRelevant) {
          warnings.push('Element may not be contextually relevant');
        }
      } else {
        checks.contextuallyRelevant = true;
      }

      // Get metadata
      metadata.displayStyle = await this.getComputedStyle(element, 'display');
      metadata.opacity = await this.getComputedOpacity(element);

    } catch (error: any) {
      failureReasons.push(`Validation error: ${error.message}`);
    }

    // Determine overall validity
    const criticalFailed = failureReasons.length > 0;
    const isValid = !criticalFailed && checks.isVisible && checks.hasSize && checks.isInteractable;
    
    // Calculate confidence
    const passedChecks = Object.values(checks).filter(v => v).length;
    const confidence = passedChecks / Object.keys(checks).length;

    return {
      isValid,
      confidence,
      checks,
      failureReasons,
      warnings,
      metadata,
    };
  }

  /**
   * تحقق سريع من الرؤية
   */
  private static async checkVisibility(element: any, page?: any): Promise<boolean> {
    try {
      if (page) {
        const isVisible = await element.isVisible();
        return isVisible;
      } else {
        // Fallback: check with element method
        const isVisible = await element.isVisible?.();
        return isVisible ?? true;
      }
    } catch {
      return false;
    }
  }

  /**
   * تحقق من التفعيل
   */
  private static async checkEnablement(element: any): Promise<boolean> {
    try {
      const isEnabled = await element.isEnabled?.();
      if (isEnabled !== undefined) return isEnabled;
      
      // Check for disabled attribute
      const isDisabled = await element.evaluate((el: any) => 
        el.disabled || el.hasAttribute('disabled') || el.readOnly
      ).catch(() => false);
      
      return !isDisabled;
    } catch {
      return true; // Assume enabled if check fails
    }
  }

  /**
   * تحقق من الحجم
   */
  private static async checkSize(
    element: any,
    minSize?: { width: number; height: number }
  ): Promise<{ valid: boolean; boundingBox: any; reason?: string }> {
    try {
      const box = await this.getBoundingBox(element);
      
      if (!box || !box.width || !box.height) {
        return {
          valid: false,
          boundingBox: box,
          reason: 'No bounding box or zero dimensions',
        };
      }

      const minWidth = minSize?.width ?? this.DEFAULT_MIN_WIDTH;
      const minHeight = minSize?.height ?? this.DEFAULT_MIN_HEIGHT;

      if (box.width < minWidth || box.height < minHeight) {
        return {
          valid: false,
          boundingBox: box,
          reason: `Width: ${box.width}px (min: ${minWidth}px), Height: ${box.height}px (min: ${minHeight}px)`,
        };
      }

      return { valid: true, boundingBox: box };
    } catch (error: any) {
      return {
        valid: false,
        boundingBox: null,
        reason: error.message,
      };
    }
  }

  /**
   * تحقق من وجود العنصر في viewport
   */
  private static async checkViewport(element: any, boundingBox: any): Promise<boolean> {
    try {
      if (!boundingBox) return false;

      // Simple viewport check
      const isInViewport = await element.evaluate((el: any) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth &&
          rect.bottom > 0 &&
          rect.right > 0
        );
      }).catch(() => false);

      return isInViewport;
    } catch {
      return true; // Assume in viewport if check fails
    }
  }

  /**
   * تحقق من التفاعلية
   */
  private static async checkInteractability(element: any): Promise<{
    isInteractable: boolean;
    pointerEvents: string;
    reason?: string;
  }> {
    try {
      const result = await element.evaluate((el: any) => {
        const style = window.getComputedStyle(el);
        const pointerEvents = style.pointerEvents;
        const display = style.display;
        const visibility = style.visibility;
        const opacity = parseFloat(style.opacity);

        return {
          pointerEvents,
          display,
          visibility,
          opacity,
        };
      }).catch(() => null);

      if (!result) {
        return {
          isInteractable: true,
          pointerEvents: 'auto',
          reason: 'Could not determine interactability',
        };
      }

      if (result.pointerEvents === 'none') {
        return {
          isInteractable: false,
          pointerEvents: result.pointerEvents,
          reason: 'pointer-events: none',
        };
      }

      if (result.display === 'none') {
        return {
          isInteractable: false,
          pointerEvents: result.pointerEvents,
          reason: 'display: none',
        };
      }

      if (result.visibility === 'hidden') {
        return {
          isInteractable: false,
          pointerEvents: result.pointerEvents,
          reason: 'visibility: hidden',
        };
      }

      if (result.opacity < 0.01) {
        return {
          isInteractable: false,
          pointerEvents: result.pointerEvents,
          reason: 'opacity: 0',
        };
      }

      return {
        isInteractable: true,
        pointerEvents: result.pointerEvents,
      };
    } catch (error: any) {
      return {
        isInteractable: true,
        pointerEvents: 'auto',
        reason: `Check failed: ${error.message}`,
      };
    }
  }

  /**
   * تحقق من Shadow DOM
   */
  private static async checkShadowDOM(element: any): Promise<boolean> {
    try {
      const hasShadow = await element.evaluate((el: any) => {
        let current = el;
        while (current) {
          if (current.getRootNode() instanceof ShadowRoot) {
            return true;
          }
          current = current.parentElement;
        }
        return false;
      }).catch(() => false);

      return hasShadow;
    } catch {
      return false;
    }
  }

  /**
   * تحقق من iframe
   */
  private static async checkIframe(page: any): Promise<boolean> {
    try {
      // Simple iframe detection - if we're in a frame context
      return page.frames().length > 1;
    } catch {
      return false;
    }
  }

  /**
   * تحقق من الملاءمة السياقية
   */
  private static async checkContextualRelevance(element: any, contextQuery: any): Promise<boolean> {
    try {
      const text = await element.textContent?.() ?? '';
      const ariaLabel = await element.getAttribute?.('aria-label') ?? '';
      const dataTestId = await element.getAttribute?.('data-testid') ?? '';

      // Simple matching
      if (contextQuery.text && !text.toLowerCase().includes(contextQuery.text.toLowerCase())) {
        return false;
      }

      if (contextQuery.ariaLabel && !ariaLabel.toLowerCase().includes(contextQuery.ariaLabel.toLowerCase())) {
        return false;
      }

      if (contextQuery.dataTestId && dataTestId !== contextQuery.dataTestId) {
        return false;
      }

      return true;
    } catch {
      return true; // Assume relevant if check fails
    }
  }

  /**
   * الحصول على bounding box
   */
  private static async getBoundingBox(element: any): Promise<any> {
    try {
      return await element.boundingBox?.();
    } catch {
      return null;
    }
  }

  /**
   * الحصول على computed style
   */
  private static async getComputedStyle(element: any, property: string): Promise<string> {
    try {
      const value = await element.evaluate(
        (el: any, prop: string) => window.getComputedStyle(el).getPropertyValue(prop),
        property
      ).catch(() => 'unknown');
      return value;
    } catch {
      return 'unknown';
    }
  }

  /**
   * الحصول على opacity
   */
  private static async getComputedOpacity(element: any): Promise<number> {
    try {
      const opacity = await element.evaluate((el: any) => {
        return parseFloat(window.getComputedStyle(el).opacity);
      }).catch(() => 1);
      return opacity;
    } catch {
      return 1;
    }
  }
}
