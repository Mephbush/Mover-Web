/**
 * نظام المحددات القائمة على القرب
 * Proximity-Based Selector System
 * 
 * استخدام العناصر القريبة والعلاقات للعثور على عنصر محدد
 */

export interface ProximitySelector {
  selector: string;
  type: 'label-for' | 'aria-labelledby' | 'sibling' | 'parent-child' | 'nearest-text' | 'visual-proximity';
  score: number;
  confidence: number;
  relationship: string;
  distance: number; // pixels or DOM distance
  examples?: string[];
}

export interface ElementRelationship {
  element: string;
  relationshipType: 'label' | 'parent' | 'sibling' | 'nearby' | 'aria-described';
  element_details: {
    tag: string;
    text?: string;
    id?: string;
    class?: string;
  };
  distance: number;
}

/**
 * نظام المحددات القائمة على القرب
 */
export class ProximitySelectorSystem {
  /**
   * إنشاء محددات قائمة على القرب
   */
  static async generateProximitySelectors(
    page: any,
    targetSelector: string,
    options: {
      maxDistance?: number;
      includeVisualProximity?: boolean;
      includeAriaRelations?: boolean;
      maxSelectors?: number;
    } = {}
  ): Promise<ProximitySelector[]> {
    const {
      maxDistance = 300,
      includeVisualProximity = true,
      includeAriaRelations = true,
      maxSelectors = 5,
    } = options;

    const selectors: ProximitySelector[] = [];

    try {
      // 1. Get information about the target element
      const targetInfo = await page.evaluate((selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const parent = el.parentElement;
        const previous = el.previousElementSibling;
        const next = el.nextElementSibling;
        const label = el.closest('label');

        return {
          id: el.id,
          className: el.className,
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.substring(0, 100),
          placeholder: el instanceof HTMLInputElement ? el.placeholder : null,
          parent: {
            tag: parent?.tagName.toLowerCase(),
            class: parent?.className,
            id: parent?.id,
          },
          previous: {
            tag: previous?.tagName.toLowerCase(),
            text: previous?.textContent?.substring(0, 50),
            class: previous?.className,
          },
          next: {
            tag: next?.tagName.toLowerCase(),
            text: next?.textContent?.substring(0, 50),
            class: next?.className,
          },
          label: label ? {
            text: label.textContent,
            id: label.id,
          } : null,
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledby: el.getAttribute('aria-labelledby'),
          ariaDescribedby: el.getAttribute('aria-describedby'),
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        };
      }, targetSelector);

      if (!targetInfo) {
        return selectors;
      }

      // 2. Label-for relationship (for inputs)
      if (includeAriaRelations && targetInfo.ariaLabelledby) {
        selectors.push({
          selector: `label[id="${targetInfo.ariaLabelledby}"] + input`,
          type: 'aria-labelledby',
          score: 0.95,
          confidence: 0.92,
          relationship: `aria-labelledby from label#${targetInfo.ariaLabelledby}`,
          distance: 0,
        });
      }

      // 3. Label element proximity
      if (targetInfo.label) {
        selectors.push({
          selector: `label:contains("${targetInfo.label.text}") + ${targetInfo.tagName}`,
          type: 'label-for',
          score: 0.88,
          confidence: 0.85,
          relationship: `Sibling of label: "${targetInfo.label.text}"`,
          distance: 1,
        });

        // Alternative: label with for attribute
        if (targetInfo.id) {
          selectors.push({
            selector: `label[for="${targetInfo.id}"]`,
            type: 'label-for',
            score: 0.92,
            confidence: 0.9,
            relationship: `Label with for attribute: ${targetInfo.id}`,
            distance: 0,
          });
        }
      }

      // 4. Aria-label relationship
      if (includeAriaRelations && targetInfo.ariaLabel) {
        selectors.push({
          selector: `${targetInfo.tagName}[aria-label="${targetInfo.ariaLabel}"]`,
          type: 'aria-labelledby',
          score: 0.9,
          confidence: 0.88,
          relationship: `aria-label: "${targetInfo.ariaLabel}"`,
          distance: 0,
        });
      }

      // 5. Parent-child relationship
      if (targetInfo.parent.class) {
        selectors.push({
          selector: `.${targetInfo.parent.class.split(' ')[0]} ${targetInfo.tagName}`,
          type: 'parent-child',
          score: 0.7,
          confidence: 0.65,
          relationship: `Child of parent with class: ${targetInfo.parent.class}`,
          distance: 1,
        });
      }

      // 6. Sibling relationship
      if (targetInfo.previous?.text) {
        const siblingText = this.escapeForSelector(targetInfo.previous.text);
        selectors.push({
          selector: `${targetInfo.previous.tag}:contains("${siblingText}") + ${targetInfo.tagName}`,
          type: 'sibling',
          score: 0.75,
          confidence: 0.7,
          relationship: `Follows sibling: "${targetInfo.previous.text}"`,
          distance: 1,
        });
      }

      if (targetInfo.next?.text) {
        const siblingText = this.escapeForSelector(targetInfo.next.text);
        selectors.push({
          selector: `${targetInfo.tagName} + ${targetInfo.next.tag}:contains("${siblingText}")`,
          type: 'sibling',
          score: 0.72,
          confidence: 0.67,
          relationship: `Precedes sibling: "${targetInfo.next.text}"`,
          distance: 1,
        });
      }

      // 7. Nearest text proximity
      if (targetInfo.placeholder) {
        selectors.push({
          selector: `${targetInfo.tagName}[placeholder="${targetInfo.placeholder}"]`,
          type: 'nearest-text',
          score: 0.82,
          confidence: 0.8,
          relationship: `Input with placeholder: "${targetInfo.placeholder}"`,
          distance: 0,
        });
      }

      // 8. Visual proximity (nearby elements)
      if (includeVisualProximity) {
        const nearbySelectors = await this.findVisualProximitySelectors(
          page,
          targetInfo,
          targetSelector,
          maxDistance
        );
        selectors.push(...nearbySelectors);
      }

      // 9. Aria-describedby relationship
      if (includeAriaRelations && targetInfo.ariaDescribedby) {
        selectors.push({
          selector: `${targetInfo.tagName}[aria-describedby="${targetInfo.ariaDescribedby}"]`,
          type: 'aria-labelledby',
          score: 0.85,
          confidence: 0.82,
          relationship: `aria-describedby: ${targetInfo.ariaDescribedby}`,
          distance: 0,
        });
      }

      // Sort by score and limit
      return selectors
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSelectors);
    } catch (error: any) {
      console.debug(`Error generating proximity selectors: ${error.message}`);
      return selectors;
    }
  }

  /**
   * إيجاد محددات القرب البصري
   */
  private static async findVisualProximitySelectors(
    page: any,
    targetInfo: any,
    targetSelector: string,
    maxDistance: number
  ): Promise<ProximitySelector[]> {
    const selectors: ProximitySelector[] = [];

    try {
      const nearbyElements = await page.evaluate(
        (selector: string, maxDist: number) => {
          const target = document.querySelector(selector);
          if (!target) return [];

          const rect = target.getBoundingClientRect();
          const nearby: any[] = [];

          // Find all nearby elements
          const allElements = document.querySelectorAll('input, button, select, label, [role="button"]');

          allElements.forEach((el) => {
            if (el === target) return;

            const elRect = el.getBoundingClientRect();

            // Calculate visual distance
            const dx = Math.min(Math.abs(rect.left - elRect.left), Math.abs(rect.right - elRect.right));
            const dy = Math.min(Math.abs(rect.top - elRect.top), Math.abs(rect.bottom - elRect.bottom));
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= maxDist && distance > 0) {
              nearby.push({
                tag: el.tagName.toLowerCase(),
                text: el.textContent?.substring(0, 50),
                id: el.id,
                class: el.className,
                distance: Math.round(distance),
                position: {
                  top: elRect.top,
                  left: elRect.left,
                },
              });
            }
          });

          // Sort by distance
          return nearby.sort((a, b) => a.distance - b.distance).slice(0, 5);
        },
        targetSelector,
        maxDistance
      );

      // Create selectors from nearby elements
      nearbyElements.forEach((nearby) => {
        if (nearby.text) {
          selectors.push({
            selector: `${nearby.tag}:contains("${this.escapeForSelector(nearby.text)}")`,
            type: 'visual-proximity',
            score: Math.max(0.5, 1 - nearby.distance / maxDistance),
            confidence: Math.max(0.4, 0.9 - nearby.distance / (maxDistance * 2)),
            relationship: `Visually near: "${nearby.text}" (${nearby.distance}px away)`,
            distance: nearby.distance,
          });
        }

        if (nearby.id) {
          selectors.push({
            selector: `#${nearby.id}`,
            type: 'visual-proximity',
            score: Math.max(0.6, 1 - nearby.distance / (maxDistance * 0.75)),
            confidence: Math.max(0.5, 0.95 - nearby.distance / (maxDistance * 1.5)),
            relationship: `Visually near element #${nearby.id} (${nearby.distance}px away)`,
            distance: nearby.distance,
          });
        }
      });
    } catch (error: any) {
      console.debug(`Error finding visual proximity selectors: ${error.message}`);
    }

    return selectors;
  }

  /**
   * الحصول على جميع العلاقات الممكنة لعنصر
   */
  static async getElementRelationships(
    page: any,
    selector: string
  ): Promise<ElementRelationship[]> {
    const relationships: ElementRelationship[] = [];

    try {
      const info = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;

        const result: any = {
          relationships: [],
        };

        // Check for label relationship
        const label = el.closest('label');
        if (label) {
          result.relationships.push({
            type: 'label',
            text: label.textContent,
            id: label.id,
          });
        }

        // Check for aria-labelledby
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        if (ariaLabelledby) {
          const labelElement = document.getElementById(ariaLabelledby);
          if (labelElement) {
            result.relationships.push({
              type: 'aria-labelledby',
              text: labelElement.textContent,
              id: ariaLabelledby,
            });
          }
        }

        // Check for aria-describedby
        const ariaDescribedby = el.getAttribute('aria-describedby');
        if (ariaDescribedby) {
          const descElement = document.getElementById(ariaDescribedby);
          if (descElement) {
            result.relationships.push({
              type: 'aria-describedby',
              text: descElement.textContent,
              id: ariaDescribedby,
            });
          }
        }

        // Parent relationship
        result.relationships.push({
          type: 'parent',
          tag: el.parentElement?.tagName.toLowerCase(),
          class: el.parentElement?.className,
          id: el.parentElement?.id,
        });

        // Sibling relationships
        if (el.previousElementSibling) {
          result.relationships.push({
            type: 'previous-sibling',
            tag: el.previousElementSibling.tagName.toLowerCase(),
            text: el.previousElementSibling.textContent?.substring(0, 50),
          });
        }

        if (el.nextElementSibling) {
          result.relationships.push({
            type: 'next-sibling',
            tag: el.nextElementSibling.tagName.toLowerCase(),
            text: el.nextElementSibling.textContent?.substring(0, 50),
          });
        }

        return result;
      }, selector);

      if (info) {
        info.relationships.forEach((rel: any) => {
          relationships.push({
            element: rel.text || `${rel.tag}#${rel.id}` || rel.tag,
            relationshipType: rel.type,
            element_details: {
              tag: rel.tag || 'unknown',
              text: rel.text,
              id: rel.id,
              class: rel.class,
            },
            distance: 1,
          });
        });
      }
    } catch (error: any) {
      console.debug(`Error getting relationships: ${error.message}`);
    }

    return relationships;
  }

  /**
   * تجنب الأحرف الخاصة
   */
  private static escapeForSelector(text: string): string {
    return text
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .substring(0, 50);
  }
}
