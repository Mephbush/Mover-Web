/**
 * نظام اجتياز Shadow DOM و iframes
 * DOM Traversal System
 * 
 * البحث عن العناصر في Shadow DOM و iframes
 */

export interface DOMLocation {
  context: 'document' | 'iframe' | 'shadowDOM';
  frameId?: string;
  framePath?: string[];
  shadowHost?: string;
  selector: string;
  absolutePath: string;
}

export interface DOMSearchResult {
  found: boolean;
  element?: any;
  location: DOMLocation;
  method: string;
  confidence: number;
  traversalDepth: number;
}

/**
 * نظام اجتياز DOM المتقدم
 */
export class DOMTraversalSystem {
  /**
   * البحث عن عنصر مع دعم Shadow DOM و iframes
   */
  static async findElementInDOM(
    page: any,
    selector: string,
    options: {
      searchShadowDOM?: boolean;
      searchIframes?: boolean;
      maxDepth?: number;
      timeout?: number;
    } = {}
  ): Promise<DOMSearchResult> {
    const {
      searchShadowDOM = true,
      searchIframes = true,
      maxDepth = 3,
      timeout = 5000,
    } = options;

    const startTime = Date.now();

    // 1. Try standard DOM first
    try {
      const element = await page.locator(selector).first();
      const isValid = await this.isElementValid(element);

      if (isValid) {
        return {
          found: true,
          element,
          location: {
            context: 'document',
            selector,
            absolutePath: selector,
          },
          method: 'standard_dom',
          confidence: 0.95,
          traversalDepth: 0,
        };
      }
    } catch (error: any) {
      console.debug(`Standard DOM search failed: ${error.message}`);
    }

    // 2. Try Shadow DOM
    if (searchShadowDOM) {
      const shadowResult = await this.searchShadowDOM(page, selector, maxDepth);
      if (shadowResult.found) {
        return {
          ...shadowResult,
          method: 'shadow_dom',
          confidence: 0.9,
        };
      }
    }

    // 3. Try iframes
    if (searchIframes) {
      const iframeResult = await this.searchIframes(page, selector, maxDepth);
      if (iframeResult.found) {
        return {
          ...iframeResult,
          method: 'iframe',
          confidence: 0.85,
        };
      }
    }

    return {
      found: false,
      location: {
        context: 'document',
        selector,
        absolutePath: selector,
      },
      method: 'not_found',
      confidence: 0,
      traversalDepth: 0,
    };
  }

  /**
   * البحث في Shadow DOM
   */
  private static async searchShadowDOM(
    page: any,
    selector: string,
    maxDepth: number,
    depth: number = 0,
    path: string[] = []
  ): Promise<DOMSearchResult> {
    if (depth > maxDepth) {
      return {
        found: false,
        location: {
          context: 'shadowDOM',
          selector,
          absolutePath: path.join(' > '),
        },
        method: 'shadow_dom_search',
        confidence: 0,
        traversalDepth: depth,
      };
    }

    try {
      // Get all shadow hosts
      const shadowHosts = await page.evaluate(() => {
        const hosts: any[] = [];
        const walker = document.createTreeWalker(
          document.documentElement,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          const el = node as Element;
          if (el.shadowRoot) {
            hosts.push({
              tag: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className,
            });
          }
        }

        return hosts;
      });

      // Search within each shadow root
      for (const host of shadowHosts) {
        try {
          // Try to pierce the shadow DOM
          const element = await page.evaluate(
            ({ selector, hostSelector }) => {
              const root = document.querySelector(hostSelector)?.shadowRoot;
              if (root) {
                return root.querySelector(selector);
              }
              return null;
            },
            { selector, hostSelector: `${host.tag}${host.id ? `#${host.id}` : ''}` }
          );

          if (element) {
            return {
              found: true,
              location: {
                context: 'shadowDOM',
                shadowHost: `${host.tag}${host.id ? `#${host.id}` : ''}`,
                selector,
                absolutePath: [...path, host.tag].join(' > '),
              },
              method: 'shadow_dom_search',
              confidence: 0.88,
              traversalDepth: depth,
            };
          }
        } catch (error: any) {
          console.debug(`Shadow DOM traversal failed: ${error.message}`);
        }
      }

      // Recursive search deeper
      const deeperResult = await this.searchShadowDOM(page, selector, maxDepth, depth + 1, [
        ...path,
        'shadow',
      ]);

      return deeperResult;
    } catch (error: any) {
      console.debug(`Shadow DOM search error: ${error.message}`);
      return {
        found: false,
        location: {
          context: 'shadowDOM',
          selector,
          absolutePath: path.join(' > '),
        },
        method: 'shadow_dom_search',
        confidence: 0,
        traversalDepth: depth,
      };
    }
  }

  /**
   * البحث في iframes
   */
  private static async searchIframes(
    page: any,
    selector: string,
    maxDepth: number,
    depth: number = 0,
    path: string[] = []
  ): Promise<DOMSearchResult> {
    if (depth > maxDepth) {
      return {
        found: false,
        location: {
          context: 'iframe',
          framePath: path,
          selector,
          absolutePath: path.join(' > '),
        },
        method: 'iframe_search',
        confidence: 0,
        traversalDepth: depth,
      };
    }

    try {
      // Get all iframes
      const frames = page.frames();

      for (const frame of frames) {
        try {
          // Try to find element in this frame
          const frameSelector = await frame.$(selector);

          if (frameSelector) {
            return {
              found: true,
              location: {
                context: 'iframe',
                framePath: [...path, frame.name() || 'unnamed'],
                selector,
                absolutePath: [...path, frame.name() || 'unnamed'].join(' > '),
              },
              method: 'iframe_search',
              confidence: 0.85,
              traversalDepth: depth,
            };
          }

          // Recursively search nested iframes
          try {
            const childFrames = await frame.evaluate(() => {
              const iframes = document.querySelectorAll('iframe');
              return Array.from(iframes).map((f: any) => ({
                name: f.name,
                id: f.id,
              }));
            });

            if (childFrames.length > 0) {
              const deeperResult = await this.searchIframes(
                page,
                selector,
                maxDepth,
                depth + 1,
                [...path, frame.name() || 'unnamed']
              );

              if (deeperResult.found) {
                return deeperResult;
              }
            }
          } catch {
            // Skip nested frame search if it fails
          }
        } catch (error: any) {
          console.debug(`Frame search failed: ${error.message}`);
        }
      }

      return {
        found: false,
        location: {
          context: 'iframe',
          framePath: path,
          selector,
          absolutePath: path.join(' > '),
        },
        method: 'iframe_search',
        confidence: 0,
        traversalDepth: depth,
      };
    } catch (error: any) {
      console.debug(`iframe search error: ${error.message}`);
      return {
        found: false,
        location: {
          context: 'iframe',
          framePath: path,
          selector,
          absolutePath: path.join(' > '),
        },
        method: 'iframe_search',
        confidence: 0,
        traversalDepth: depth,
      };
    }
  }

  /**
   * البحث عن جميع العناصر بما في ذلك Shadow DOM و iframes
   */
  static async findAllElements(
    page: any,
    selector: string,
    options: {
      searchShadowDOM?: boolean;
      searchIframes?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<DOMSearchResult[]> {
    const results: DOMSearchResult[] = [];

    // Search in main document
    try {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        if (await this.isElementValid(element)) {
          results.push({
            found: true,
            element,
            location: {
              context: 'document',
              selector,
              absolutePath: selector,
            },
            method: 'standard_dom',
            confidence: 0.95,
            traversalDepth: 0,
          });
        }
      }
    } catch {
      // Continue to other search methods
    }

    // Search in Shadow DOM
    if (options.searchShadowDOM !== false) {
      try {
        const shadowResults = await page.evaluate((selector: string) => {
          const results: any[] = [];
          const walker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
          );

          let node;
          while ((node = walker.nextNode())) {
            const el = node as Element;
            if (el.shadowRoot) {
              const found = el.shadowRoot.querySelectorAll(selector);
              found.forEach((el) => {
                results.push({
                  context: 'shadowDOM',
                  shadowHost: el.parentElement?.tagName || 'unknown',
                });
              });
            }
          }

          return results;
        }, selector);

        results.push(
          ...shadowResults.map((r: any) => ({
            found: true,
            location: {
              context: 'shadowDOM' as const,
              shadowHost: r.shadowHost,
              selector,
              absolutePath: selector,
            },
            method: 'shadow_dom',
            confidence: 0.9,
            traversalDepth: 1,
          }))
        );
      } catch {
        // Shadow DOM search failed
      }
    }

    // Search in iframes
    if (options.searchIframes !== false) {
      const frames = page.frames();
      for (const frame of frames) {
        try {
          const frameElements = await frame.$$(selector);
          if (frameElements && frameElements.length > 0) {
            results.push({
              found: true,
              location: {
                context: 'iframe',
                framePath: [frame.name() || 'unnamed'],
                selector,
                absolutePath: selector,
              },
              method: 'iframe',
              confidence: 0.85,
              traversalDepth: 1,
            });
          }
        } catch {
          // Frame search failed
        }
      }
    }

    return results;
  }

  /**
   * التحقق من صحة العنصر
   */
  private static async isElementValid(element: any): Promise<boolean> {
    try {
      const boundingBox = await element.boundingBox?.();
      return boundingBox !== null && boundingBox.width > 0 && boundingBox.height > 0;
    } catch {
      return false;
    }
  }

  /**
   * الحصول على معلومات عن هيكل DOM
   */
  static async getDOMStructureInfo(page: any): Promise<{
    hasFrames: boolean;
    frameCount: number;
    hasShadowRoots: boolean;
    shadowRootCount: number;
  }> {
    try {
      const frames = page.frames();
      const shadowInfo = await page.evaluate(() => {
        let count = 0;
        const walker = document.createTreeWalker(
          document.documentElement,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          const el = node as Element;
          if (el.shadowRoot) {
            count++;
          }
        }

        return count;
      });

      return {
        hasFrames: frames.length > 1,
        frameCount: frames.length,
        hasShadowRoots: shadowInfo > 0,
        shadowRootCount: shadowInfo,
      };
    } catch {
      return {
        hasFrames: false,
        frameCount: 0,
        hasShadowRoots: false,
        shadowRootCount: 0,
      };
    }
  }
}
