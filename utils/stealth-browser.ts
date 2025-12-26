/**
 * Stealth Browser - Real Playwright-based browser with anti-detection
 * سترة متصفح - متصفح Playwright حقيقي مع منع الكشف
 *
 * NOTE: This is a Node.js-only module. It cannot be imported in browser code.
 */

// Check if running in Node.js environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  throw new Error(
    'stealth-browser.ts cannot be imported in browser code. ' +
    'This is a Node.js-only module for server-side automation.'
  );
}

// @ts-ignore - Playwright is Node.js only, type definitions for build-time only
let chromium: any;
let Browser: any;
let BrowserContext: any;
let Page: any;

// Initialize playwright dynamically to avoid build-time errors
async function initializePlaywright() {
  try {
    // Only load in Node.js environments
    if (typeof window === 'undefined') {
      try {
        const playwright = await import('playwright');
        chromium = (playwright as any).default?.chromium || (playwright as any).chromium;
        Browser = (playwright as any).default?.Browser || (playwright as any).Browser;
        BrowserContext = (playwright as any).default?.BrowserContext || (playwright as any).BrowserContext;
        Page = (playwright as any).default?.Page || (playwright as any).Page;
      } catch (importError: any) {
        // Playwright not installed - create stub objects
        console.warn('Playwright not available:', importError.message);
        chromium = null;
        Browser = null;
        BrowserContext = null;
        Page = null;
      }
    }
  } catch (error: any) {
    console.warn('Failed to initialize Playwright:', error.message);
  }
}

export interface StealthConfig {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  timezone?: string;
  locale?: string;
  userAgent?: string;
}

interface UserAgentOption {
  value: string;
}

interface ViewportOption {
  width: number;
  height: number;
}

const STEALTH_CONFIG = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ] as UserAgentOption[] | string[],

  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ] as ViewportOption[],

  timezones: [
    'Asia/Riyadh',
    'Asia/Dubai',
    'Africa/Cairo',
    'Asia/Kuwait',
    'Asia/Qatar',
  ],

  locales: ['ar-SA', 'ar-AE', 'ar-EG', 'en-US'],
};

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDelay(min = 100, max = 500): number {
  return min + Math.random() * (max - min);
}

export class StealthBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, Page> = new Map();

  /**
   * Initialize and launch stealth browser
   */
  async launch(config: StealthConfig = {}): Promise<void> {
    console.log('🚀 Launching stealth browser...');

    const userAgent = (config.userAgent as string | undefined) ||
      (randomChoice(STEALTH_CONFIG.userAgents) as string);
    const viewport = config.viewport || randomChoice(STEALTH_CONFIG.viewports);
    const timezone = config.timezone || randomChoice(STEALTH_CONFIG.timezones);
    const locale = config.locale || randomChoice(STEALTH_CONFIG.locales);

    this.browser = await chromium.launch({
      headless: config.headless !== false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-webrtc',
        '--disable-webrtc-hw-encoding',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent,
      viewport,
      timezoneId: timezone,
      locale,
      javaScriptEnabled: true,
      bypassCSP: true,
      extraHTTPHeaders: {
        'Accept-Language': `${locale},en;q=0.9`,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Inject stealth scripts
    await this.injectStealthScripts();

    console.log('✅ Browser launched successfully');
  }

  /**
   * Inject anti-detection scripts
   */
  private async injectStealthScripts(): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');

    await this.context.addInitScript(() => {
      // Hide navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock Chrome
      (window.navigator as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };

      // Realistic plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: { type: 'application/x-google-chrome-pdf' },
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
            name: 'Chrome PDF Plugin',
          },
          {
            0: { type: 'application/pdf' },
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
            name: 'Chrome PDF Viewer',
          },
          {
            0: { type: 'application/x-nacl' },
            description: 'Native Client Executable',
            filename: 'internal-nacl-plugin',
            length: 1,
            name: 'Native Client',
          },
        ],
      });

      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ar-SA', 'ar', 'en-US', 'en'],
      });

      // Permissions API
      const originalQuery = (window.navigator as any).permissions.query;
      (window.navigator as any).permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: (Notification as any).permission })
          : originalQuery(parameters);

      // Hide battery API
      Object.defineProperty(navigator, 'getBattery', {
        get: () => undefined,
      });

      // WebGL fingerprint obfuscation
      const getParameter = (WebGLRenderingContext.prototype as any).getParameter;
      (WebGLRenderingContext.prototype as any).getParameter = function(
        parameter: number
      ) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };

      // Canvas fingerprint obfuscation
      const getImageData = (CanvasRenderingContext2D.prototype as any)
        .getImageData;
      (CanvasRenderingContext2D.prototype as any).getImageData = function() {
        const imageData = getImageData.apply(this, arguments);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] + Math.floor(Math.random() * 2);
        }
        return imageData;
      };

      // Audio fingerprint obfuscation
      const audioContext = (AudioContext.prototype as any).createOscillator;
      (AudioContext.prototype as any).createOscillator = function() {
        const oscillator = audioContext.apply(this, arguments);
        const originalFrequency = oscillator.frequency.value;
        oscillator.frequency.value = originalFrequency + Math.random() * 0.0001;
        return oscillator;
      };

      // Remove automation markers
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      delete (window as any)._playwright;
      delete (window as any).__playwright;

      // Screen properties
      Object.defineProperty(screen, 'availWidth', {
        get: () => screen.width,
      });
      Object.defineProperty(screen, 'availHeight', {
        get: () => screen.height - 40,
      });

      // Connection API
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50,
          downlink: 10,
          saveData: false,
        }),
      });
    });
  }

  /**
   * Create or get a page
   */
  async getPage(pageId?: string): Promise<Page> {
    if (!this.context) throw new Error('Browser not initialized');

    const id = pageId || 'default';

    if (this.pages.has(id)) {
      return this.pages.get(id)!;
    }

    const page = await this.context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    this.pages.set(id, page);
    return page;
  }

  /**
   * Close a specific page
   */
  async closePage(pageId?: string): Promise<void> {
    const id = pageId || 'default';
    const page = this.pages.get(id);

    if (page) {
      await page.close();
      this.pages.delete(id);
    }
  }

  /**
   * Navigate to URL
   */
  async navigateTo(url: string, pageId?: string): Promise<void> {
    const page = await this.getPage(pageId);

    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Random delay after navigation
    await this.humanDelay(1000, 3000);
  }

  /**
   * Human-like click
   */
  async humanClick(selector: string, pageId?: string): Promise<void> {
    const page = await this.getPage(pageId);

    console.log(`🖱️ Clicking: ${selector}`);

    try {
      const element = page.locator(selector);
      const box = await element.boundingBox();

      if (box) {
        // Move mouse to element with natural curve
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const targetX =
          box.x + box.width / 2 + (Math.random() - 0.5) * 20;
        const targetY =
          box.y + box.height / 2 + (Math.random() - 0.5) * 20;

        const steps = 10 + Math.floor(Math.random() * 15);
        await page.mouse.move(startX, startY);
        await this.humanDelay(50, 150);

        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          const x = startX + (targetX - startX) * progress;
          const y = startY + (targetY - startY) * progress;
          await page.mouse.move(x, y);
          await this.humanDelay(5, 15);
        }

        await this.humanDelay(100, 300);
        await element.click();
        await this.humanDelay(150, 400);
      } else {
        // Fallback: direct click
        await element.click();
      }

      console.log(`✅ Clicked: ${selector}`);
    } catch (error: any) {
      throw new Error(`Failed to click ${selector}: ${error.message}`);
    }
  }

  /**
   * Human-like typing
   */
  async humanType(selector: string, text: string, pageId?: string): Promise<void> {
    const page = await this.getPage(pageId);

    console.log(`⌨️ Typing in: ${selector}`);

    try {
      await this.humanDelay(200, 600);

      // Type character by character
      for (const char of text) {
        await page.type(selector, char, {
          delay: 50 + Math.random() * 150,
        });

        // Occasional natural pauses
        if (Math.random() < 0.1) {
          await this.humanDelay(200, 800);
        }
      }

      await this.humanDelay(100, 400);
      console.log(`✅ Typed: ${text.substring(0, 20)}...`);
    } catch (error: any) {
      throw new Error(`Failed to type in ${selector}: ${error.message}`);
    }
  }

  /**
   * Human-like scroll
   */
  async humanScroll(
    direction: 'up' | 'down' = 'down',
    pageId?: string
  ): Promise<void> {
    const page = await this.getPage(pageId);

    console.log(`📜 Scrolling ${direction}...`);

    const scrollAmount = 200 + Math.random() * 300;
    const scrollSteps = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < scrollSteps; i++) {
      await page.evaluate(
        (amount, dir) => {
          window.scrollBy({
            top: dir === 'down' ? amount : -amount,
            behavior: 'smooth',
          });
        },
        scrollAmount / scrollSteps,
        direction
      );

      await this.humanDelay(300, 800);
    }

    console.log(`✅ Scrolled ${direction}`);
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string, pageId?: string): Promise<void> {
    const page = await this.getPage(pageId);

    console.log(`⏳ Waiting for element: ${selector}`);

    try {
      await page.waitForSelector(selector, { timeout: 30000 });
      console.log(`✅ Element found: ${selector}`);
    } catch (error: any) {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  /**
   * Extract data
   */
  async extractData(selector: string, pageId?: string): Promise<any[]> {
    const page = await this.getPage(pageId);

    console.log(`📤 Extracting from: ${selector}`);

    try {
      const data = await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements).map((el) => ({
          text: el.textContent?.trim(),
          html: el.innerHTML,
          attributes: Array.from(el.attributes).reduce(
            (acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            },
            {} as Record<string, string>
          ),
        }));
      }, selector);

      console.log(`✅ Extracted ${data.length} items`);
      return data;
    } catch (error: any) {
      throw new Error(`Failed to extract from ${selector}: ${error.message}`);
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(pageId?: string): Promise<Buffer> {
    const page = await this.getPage(pageId);

    console.log(`📸 Taking screenshot...`);

    try {
      const screenshot = await page.screenshot({
        fullPage: false,
      });

      console.log(`✅ Screenshot taken`);
      return screenshot;
    } catch (error: any) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Execute JavaScript
   */
  async executeScript<T>(script: string | (() => T), pageId?: string): Promise<T> {
    const page = await this.getPage(pageId);

    try {
      const result = await page.evaluate(script);
      return result;
    } catch (error: any) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }

  /**
   * Get page content
   */
  async getContent(pageId?: string): Promise<string> {
    const page = await this.getPage(pageId);

    try {
      return await page.content();
    } catch (error: any) {
      throw new Error(`Failed to get page content: ${error.message}`);
    }
  }

  /**
   * Human delay
   */
  private async humanDelay(min = 100, max = 500): Promise<void> {
    const delay = randomDelay(min, max);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    console.log('🔒 Closing browser...');

    // Close all pages
    for (const [, page] of this.pages) {
      try {
        await page.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.pages.clear();

    // Close context
    if (this.context) {
      try {
        await this.context.clearCookies();
      } catch (error) {
        // Ignore errors
      }
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log('✅ Browser closed');
  }
}
