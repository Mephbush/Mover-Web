/**
 * نظام توليد محددات XPath
 * XPath Selector Generator
 * 
 * توليد ترتيب وتقييم محددات XPath الفعالة
 */

export interface XPathOption {
  xpath: string;
  type: 'absolute' | 'relative' | 'text' | 'attribute' | 'hybrid' | 'proximity';
  score: number;
  confidence: number;
  specificity: number;
  robustness: number;
  description: string;
  examples?: string[];
}

export interface XPathGenerationOptions {
  includeAbsolute?: boolean;
  includeRelative?: boolean;
  includeText?: boolean;
  includeAttribute?: boolean;
  includeHybrid?: boolean;
  includeProximity?: boolean;
  targetElement?: string; // e.g., 'button', 'input'
  maxOptions?: number;
}

/**
 * محرك توليد XPath
 */
export class XPathSelectorGenerator {
  /**
   * توليد مجموعة من خيارات XPath
   */
  static generateXPathOptions(
    elementInfo: any,
    options: XPathGenerationOptions = {}
  ): XPathOption[] {
    const xpaths: XPathOption[] = [];

    const {
      includeAbsolute = true,
      includeRelative = true,
      includeText = true,
      includeAttribute = true,
      includeHybrid = true,
      includeProximity = true,
      targetElement = 'element',
      maxOptions = 10,
    } = options;

    try {
      // 1. Absolute XPath
      if (includeAbsolute && elementInfo.absolutePath) {
        xpaths.push({
          xpath: elementInfo.absolutePath,
          type: 'absolute',
          score: 0.6,
          confidence: 0.5,
          specificity: 1.0,
          robustness: 0.3,
          description: 'Full absolute path from root',
        });
      }

      // 2. Relative XPath
      if (includeRelative && elementInfo.id) {
        xpaths.push({
          xpath: `//${elementInfo.tag}[@id='${elementInfo.id}']`,
          type: 'relative',
          score: 0.95,
          confidence: 0.9,
          specificity: 1.0,
          robustness: 0.9,
          description: `Element by ID: ${elementInfo.id}`,
        });
      }

      // 3. Text-based XPath
      if (includeText && elementInfo.text) {
        const text = this.escapeXPathString(elementInfo.text);

        // Exact text match
        xpaths.push({
          xpath: `//${elementInfo.tag}[text()='${text}']`,
          type: 'text',
          score: 0.75,
          confidence: 0.7,
          specificity: 0.7,
          robustness: 0.5,
          description: `Element with exact text: "${elementInfo.text}"`,
        });

        // Partial text match
        xpaths.push({
          xpath: `//${elementInfo.tag}[contains(text(), '${text}')]`,
          type: 'text',
          score: 0.65,
          confidence: 0.6,
          specificity: 0.5,
          robustness: 0.7,
          description: `Element containing text: "${elementInfo.text}"`,
        });

        // Text with normalize-space (handles whitespace)
        xpaths.push({
          xpath: `//${elementInfo.tag}[contains(normalize-space(), '${text}')]`,
          type: 'text',
          score: 0.68,
          confidence: 0.65,
          specificity: 0.55,
          robustness: 0.8,
          description: `Element with normalized text: "${elementInfo.text}"`,
        });
      }

      // 4. Attribute-based XPath
      if (includeAttribute) {
        // data-testid
        if (elementInfo.dataTestId) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@data-testid='${elementInfo.dataTestId}']`,
            type: 'attribute',
            score: 0.92,
            confidence: 0.88,
            specificity: 0.95,
            robustness: 0.9,
            description: `Element by data-testid: ${elementInfo.dataTestId}`,
          });
        }

        // aria-label
        if (elementInfo.ariaLabel) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@aria-label='${elementInfo.ariaLabel}']`,
            type: 'attribute',
            score: 0.85,
            confidence: 0.8,
            specificity: 0.85,
            robustness: 0.8,
            description: `Element by aria-label: ${elementInfo.ariaLabel}`,
          });
        }

        // name attribute
        if (elementInfo.name) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@name='${elementInfo.name}']`,
            type: 'attribute',
            score: 0.8,
            confidence: 0.75,
            specificity: 0.8,
            robustness: 0.75,
            description: `Element by name: ${elementInfo.name}`,
          });
        }

        // placeholder attribute
        if (elementInfo.placeholder) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@placeholder='${elementInfo.placeholder}']`,
            type: 'attribute',
            score: 0.78,
            confidence: 0.72,
            specificity: 0.75,
            robustness: 0.7,
            description: `Element by placeholder: ${elementInfo.placeholder}`,
          });
        }

        // class attribute
        if (elementInfo.class) {
          const classes = elementInfo.class.split(/\s+/);
          classes.forEach((cls: string) => {
            if (cls) {
              xpaths.push({
                xpath: `//${elementInfo.tag}[contains(@class, '${cls}')]`,
                type: 'attribute',
                score: 0.65,
                confidence: 0.6,
                specificity: 0.6,
                robustness: 0.6,
                description: `Element with class: ${cls}`,
              });
            }
          });
        }

        // type attribute (for inputs)
        if (elementInfo.type) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@type='${elementInfo.type}']`,
            type: 'attribute',
            score: 0.7,
            confidence: 0.65,
            specificity: 0.65,
            robustness: 0.65,
            description: `Element with type: ${elementInfo.type}`,
          });
        }
      }

      // 5. Hybrid XPath (combining conditions)
      if (includeHybrid) {
        // Type + attribute combination
        if (elementInfo.type && elementInfo.name) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@type='${elementInfo.type}' and @name='${elementInfo.name}']`,
            type: 'hybrid',
            score: 0.88,
            confidence: 0.85,
            specificity: 0.95,
            robustness: 0.85,
            description: `Element with type and name`,
          });
        }

        // Text + tag combination
        if (elementInfo.text && elementInfo.tag) {
          const text = this.escapeXPathString(elementInfo.text);
          xpaths.push({
            xpath: `//button[contains(text(), '${text}')]/ancestor::form//${elementInfo.tag}`,
            type: 'hybrid',
            score: 0.72,
            confidence: 0.68,
            specificity: 0.75,
            robustness: 0.7,
            description: `Related element near text match`,
          });
        }

        // Multiple attributes
        if (elementInfo.dataTestId && elementInfo.type) {
          xpaths.push({
            xpath: `//${elementInfo.tag}[@data-testid='${elementInfo.dataTestId}' and @type='${elementInfo.type}']`,
            type: 'hybrid',
            score: 0.94,
            confidence: 0.91,
            specificity: 0.98,
            robustness: 0.9,
            description: `Element by multiple attributes`,
          });
        }
      }

      // 6. Proximity-based XPath
      if (includeProximity && elementInfo.relatedElement) {
        const relatedLabel = elementInfo.relatedElement.text || elementInfo.relatedElement.id;

        xpaths.push({
          xpath: `//label[text()='${relatedLabel}']/following-sibling::${elementInfo.tag}`,
          type: 'proximity',
          score: 0.75,
          confidence: 0.7,
          specificity: 0.7,
          robustness: 0.65,
          description: `Element following related label`,
        });

        xpaths.push({
          xpath: `//label[contains(text(), '${relatedLabel}')]/following::${elementInfo.tag}[1]`,
          type: 'proximity',
          score: 0.73,
          confidence: 0.68,
          specificity: 0.65,
          robustness: 0.7,
          description: `First element after related label`,
        });
      }

      // 7. Index-based XPath
      if (elementInfo.index !== undefined) {
        xpaths.push({
          xpath: `(${elementInfo.tag})[${elementInfo.index + 1}]`,
          type: 'attribute',
          score: 0.55,
          confidence: 0.5,
          specificity: 0.4,
          robustness: 0.3,
          description: `Element by index: ${elementInfo.index}`,
        });
      }

      // 8. Role-based XPath
      if (elementInfo.role) {
        xpaths.push({
          xpath: `//*[@role='${elementInfo.role}']`,
          type: 'attribute',
          score: 0.7,
          confidence: 0.65,
          specificity: 0.6,
          robustness: 0.75,
          description: `Element by ARIA role: ${elementInfo.role}`,
        });
      }

      // Sort by score and limit
      const sortedXPaths = xpaths
        .sort((a, b) => b.score - a.score)
        .slice(0, maxOptions);

      return sortedXPaths;
    } catch (error: any) {
      console.error(`Error generating XPath options: ${error.message}`);
      return [];
    }
  }

  /**
   * توليد XPath من معلومات العنصر المحدودة
   */
  static generateBasicXPath(elementType: string, hints?: any): string[] {
    const xpaths: string[] = [];

    // Basic by tag
    xpaths.push(`//${elementType}`);

    // By common attributes
    if (hints?.id) {
      xpaths.push(`//${elementType}[@id='${hints.id}']`);
    }

    if (hints?.text) {
      const text = this.escapeXPathString(hints.text);
      xpaths.push(`//${elementType}[contains(text(), '${text}')]`);
    }

    if (hints?.ariaLabel) {
      xpaths.push(`//${elementType}[@aria-label='${hints.ariaLabel}']`);
    }

    if (hints?.dataTestId) {
      xpaths.push(`//${elementType}[@data-testid='${hints.dataTestId}']`);
    }

    return xpaths;
  }

  /**
   * تقدير قوة XPath
   */
  static scoreXPath(xpath: string, elementInfo?: any): number {
    let score = 0.5;

    // Penalize absolute paths (fragile)
    if (xpath.startsWith('/html')) {
      score -= 0.2;
    }

    // Reward ID-based selectors
    if (xpath.includes('[@id=')) {
      score += 0.2;
    }

    // Reward data-testid
    if (xpath.includes('[@data-testid=')) {
      score += 0.25;
    }

    // Reward text-based with normalize-space
    if (xpath.includes('normalize-space')) {
      score += 0.15;
    }

    // Penalize complex combinators
    const combinatorCount = (xpath.match(/(\[|\]|\(|\))/g) || []).length;
    if (combinatorCount > 8) {
      score -= 0.1;
    }

    // Ensure score is in 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * تحويل CSS Selector إلى XPath
   */
  static cssToXPath(cssSelector: string): string {
    // Simple conversion for common patterns
    // This is a basic implementation; complex CSS selectors may need more sophisticated conversion

    let xpath = cssSelector;

    // Convert ID selector
    xpath = xpath.replace(/#([a-zA-Z0-9_-]+)/g, "[@id='$1']");

    // Convert class selector
    xpath = xpath.replace(/\.([a-zA-Z0-9_-]+)/g, "[contains(@class, '$1')]");

    // Convert attribute selector
    xpath = xpath.replace(/\[([a-zA-Z]+)="([^"]+)"\]/g, "[@$1='$2']");

    // Add // prefix if not present
    if (!xpath.startsWith('//') && !xpath.startsWith('.')) {
      xpath = '//' + xpath;
    }

    return xpath;
  }

  /**
   * Escape XPath string literals
   */
  private static escapeXPathString(str: string): string {
    // Handle both single and double quotes
    if (!str.includes("'")) {
      return str;
    }

    if (!str.includes('"')) {
      return str;
    }

    // If it contains both, use concat function
    const parts = str.split("'");
    return `concat('${parts.join("', \"'\", '"')}')`;
  }
}