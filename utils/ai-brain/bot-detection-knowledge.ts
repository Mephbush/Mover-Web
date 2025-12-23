/**
 * دالة مساعدة للحصول على user agent عشوائي
 */
export function getRandomUserAgent(browser?: 'chrome' | 'firefox' | 'safari' | 'edge'): string {
  if (browser && REAL_USER_AGENTS[browser]) {
    const agents = REAL_USER_AGENTS[browser];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  // عشوائي من كل المتصفحات
  const allAgents = Object.values(REAL_USER_AGENTS).flat();
  return allAgents[Math.floor(Math.random() * allAgents.length)];
}

/**
 * معرفة متقدمة حول اختبارات كاشفات الروبوتات الشهيرة
 */
export const FAMOUS_BOT_DETECTION_TESTS = {
  // اختبار Sannysoft - أحد أشهر الاختبارات
  sannysoft: {
    name: 'Sannysoft Bot Detection Test',
    url: 'https://bot.sannysoft.com/',
    tests: [
      {
        name: 'WebDriver Detection',
        description: 'يتحقق من وجود navigator.webdriver',
        solution: 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})',
        severity: 'critical',
      },
      {
        name: 'Chrome Detection',
        description: 'يتحقق من وجود window.chrome',
        solution: 'إضافة window.chrome مع properties مناسبة',
        severity: 'high',
      },
      {
        name: 'Permissions Detection',
        description: 'يتحقق من navigator.permissions',
        solution: 'إضافة permissions API كامل',
        severity: 'medium',
      },
      {
        name: 'Plugins Detection',
        description: 'يتحقق من navigator.plugins.length',
        solution: 'إضافة plugins واقعية (PDF, Chrome PDF Viewer)',
        severity: 'high',
      },
      {
        name: 'Languages Detection',
        description: 'يتحقق من navigator.languages',
        solution: 'إضافة قائمة لغات واقعية',
        severity: 'medium',
      },
    ],
    bypassStrategy: `
      // حل شامل لاختبار Sannysoft
      async function bypassSannysoft(page) {
        await page.evaluateOnNewDocument(() => {
          // 1. إخفاء webdriver
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          
          // 2. إضافة chrome
          window.chrome = {
            runtime: {},
            loadTimes: function() {},
            csi: function() {},
            app: {},
          };
          
          // 3. إضافة permissions
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications'
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery(parameters)
          );
          
          // 4. إضافة plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [
              {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer'},
              {name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai'},
              {name: 'Native Client', filename: 'internal-nacl-plugin'},
            ],
          });
          
          // 5. إضافة languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en', 'ar'],
          });
        });
      }
    `,
  },

  // اختبار Incolumitas - اختبار متقدم جداً
  incolumitas: {
    name: 'Incolumitas Bot Detection',
    url: 'https://bot.incolumitas.com/',
    tests: [
      {
        name: 'HeadlessChrome Detection',
        description: 'يكشف Chrome Headless من خلال User-Agent',
        solution: 'استخدام --user-agent flag مع user agent عادي',
        severity: 'critical',
      },
      {
        name: 'WebGL Vendor',
        description: 'يتحقق من WebGL vendor و renderer',
        solution: 'تعديل WebGL parameters لتطابق GPU حقيقي',
        severity: 'high',
      },
      {
        name: 'Canvas Fingerprint',
        description: 'يحسب بصمة Canvas',
        solution: 'إضافة ضجيج عشوائي لـ Canvas',
        severity: 'high',
      },
      {
        name: 'AudioContext Fingerprint',
        description: 'يحسب بصمة AudioContext',
        solution: 'تعديل AudioContext output',
        severity: 'medium',
      },
    ],
    bypassStrategy: `
      // حل لاختبار Incolumitas
      async function bypassIncolumitas(page) {
        await page.evaluateOnNewDocument(() => {
          // 1. WebGL spoofing
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) {
              return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
            }
            if (parameter === 37446) {
              return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL
            }
            return getParameter.call(this, parameter);
          };
          
          // 2. Canvas noise
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function(...args) {
            const context = this.getContext('2d');
            const imageData = context.getImageData(0, 0, this.width, this.height);
            
            // إضافة ضجيج صغير
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] += Math.floor(Math.random() * 3) - 1;
            }
            
            context.putImageData(imageData, 0, 0);
            return originalToDataURL.apply(this, args);
          };
        });
      }
    `,
  },

  // اختبار CreepJS - أحدث وأقوى الاختبارات
  creepjs: {
    name: 'CreepJS Fingerprinting',
    url: 'https://abrahamjuliot.github.io/creepjs/',
    tests: [
      {
        name: 'Comprehensive Fingerprinting',
        description: 'يجمع أكثر من 50 نقطة بيانات مختلفة',
        solution: 'استخدام browser profiles حقيقية ومتسقة',
        severity: 'extreme',
      },
      {
        name: 'Lies Detection',
        description: 'يكتشف التناقضات بين البيانات المختلفة',
        solution: 'ضمان consistency كامل في كل البيانات',
        severity: 'critical',
      },
      {
        name: 'Trust Score',
        description: 'يحسب درجة ثقة شاملة',
        solution: 'تجنب أي modifications غير واقعية',
        severity: 'high',
      },
    ],
    bypassStrategy: `
      // CreepJS صعب جداً - الحل الأفضل هو real browser
      // استخدام undetected-chromedriver أو playwright-stealth
      const { chromium } = require('playwright-extra');
      const stealth = require('puppeteer-extra-plugin-stealth')();
      
      chromium.use(stealth);
      
      const browser = await chromium.launch({
        headless: false, // يفضل عدم استخدام headless
      });
    `,
  },

  // اختبار BrowserLeaks
  browserleaks: {
    name: 'BrowserLeaks Detection Tests',
    url: 'https://browserleaks.com/',
    tests: [
      {
        name: 'WebRTC Leak',
        description: 'يكشف IP الحقيقي من خلال WebRTC',
        solution: 'تعطيل WebRTC أو استخدام fake WebRTC IP',
        severity: 'high',
      },
      {
        name: 'DNS Leak',
        description: 'يكشف DNS servers المستخدمة',
        solution: 'استخدام VPN أو proxy مع DNS خاص',
        severity: 'medium',
      },
      {
        name: 'Font Fingerprinting',
        description: 'يكشف الخطوط المثبتة',
        solution: 'استخدام font fingerprint واقعي',
        severity: 'medium',
      },
    ],
  },

  // اختبار PixelScan
  pixelscan: {
    name: 'PixelScan Bot Detection',
    url: 'https://pixelscan.net/',
    tests: [
      {
        name: 'Automation Framework Detection',
        description: 'يكتشف Selenium, Puppeteer, Playwright',
        solution: 'استخدام stealth plugins و patches',
        severity: 'critical',
      },
      {
        name: 'Behavioral Analysis',
        description: 'يحلل سلوك المستخدم',
        solution: 'محاكاة سلوك بشري طبيعي',
        severity: 'high',
      },
    ],
  },
};

/**
 * قاعدة بيانات شاملة لتقنيات Anti-Detection
 */
export const ANTI_DETECTION_TECHNIQUES = {
  // تقنيات Playwright/Puppeteer
  playwrightStealth: {
    name: 'Playwright Stealth Configuration',
    effectiveness: 85,
    code: `
      import { chromium } from 'playwright-extra';
      import stealth from 'puppeteer-extra-plugin-stealth';
      
      chromium.use(stealth());
      
      const browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1920,1080',
        ],
      });
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation', 'notifications'],
      });
    `,
  },

  // تقنيات Selenium
  seleniumStealth: {
    name: 'Selenium Stealth Configuration',
    effectiveness: 75,
    code: `
      from selenium import webdriver
      from selenium.webdriver.chrome.options import Options
      from selenium_stealth import stealth
      
      options = Options()
      options.add_argument('--disable-blink-features=AutomationControlled')
      options.add_experimental_option('excludeSwitches', ['enable-automation'])
      options.add_experimental_option('useAutomationExtension', False)
      
      driver = webdriver.Chrome(options=options)
      
      stealth(driver,
        languages=['en-US', 'en'],
        vendor='Google Inc.',
        platform='Win32',
        webgl_vendor='Intel Inc.',
        renderer='Intel Iris OpenGL Engine',
        fix_hairline=True,
      )
    `,
  },

  // Browser Fingerprint Randomization
  fingerprintRandomization: {
    name: 'Dynamic Fingerprint Randomization',
    effectiveness: 80,
    description: 'تغيير البصمة بشكل ديناميكي لكل جلسة',
    code: `
      // توليد fingerprint عشوائي لكن واقعي
      function generateRealisticFingerprint() {
        const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
        const vendors = ['Google Inc.', 'Apple Inc.', 'Intel Inc.'];
        const renderers = [
          'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.1)',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060, OpenGL 4.1)',
          'Intel Iris OpenGL Engine',
        ];
        
        return {
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          vendor: vendors[Math.floor(Math.random() * vendors.length)],
          renderer: renderers[Math.floor(Math.random() * renderers.length)],
          hardwareConcurrency: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
          deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
        };
      }
    `,
  },

  // Residential Proxy Rotation
  proxyRotation: {
    name: 'Smart Proxy Rotation',
    effectiveness: 90,
    description: 'استخدام residential proxies مع تدوير ذكي',
    guidelines: [
      'استخدام residential proxies بدلاً من datacenter',
      'تدوير الـ IP كل 5-10 طلبات',
      'استخدام IPs من نفس المنطقة الجغرافية',
      'تجنب IPs المحروقة (burned)',
      'استخدام sticky sessions عند الحاجة',
    ],
    providers: [
      'BrightData (Luminati)',
      'Smartproxy',
      'Oxylabs',
      'NetNut',
      'GeoSurf',
    ],
  },

  // Cookie Management
  cookieManagement: {
    name: 'Advanced Cookie Management',
    effectiveness: 70,
    description: 'إدارة متقدمة للكوكيز للحفاظ على الجلسات',
    code: `
      // حفظ cookies من جلسة ناجحة
      async function saveCookies(page, filepath) {
        const cookies = await page.context().cookies();
        await fs.writeFile(filepath, JSON.stringify(cookies, null, 2));
      }
      
      // تحميل cookies في جلسة جديدة
      async function loadCookies(context, filepath) {
        const cookies = JSON.parse(await fs.readFile(filepath));
        await context.addCookies(cookies);
      }
      
      // تدوير cookies
      async function rotateCookies(cookiePool) {
        const randomCookie = cookiePool[Math.floor(Math.random() * cookiePool.length)];
        return randomCookie;
      }
    `,
  },

  // Request Header Consistency
  headerConsistency: {
    name: 'Request Header Consistency',
    effectiveness: 75,
    description: 'ضمان تطابق headers مع browser fingerprint',
    code: `
      // Headers يجب أن تتطابق مع User-Agent
      function getConsistentHeaders(userAgent) {
        const isChrome = userAgent.includes('Chrome');
        const isFirefox = userAgent.includes('Firefox');
        
        const baseHeaders = {
          'User-Agent': userAgent,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        };
        
        if (isChrome) {
          return {
            ...baseHeaders,
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
          };
        }
        
        return baseHeaders;
      }
    `,
  },
};

/**
 * استراتيجيات التعامل مع Captcha
 */
export const CAPTCHA_SOLVING_STRATEGIES = {
  // حل reCAPTCHA
  recaptcha: {
    methods: [
      {
        name: '2Captcha API',
        cost: 'منخفض ($1-3 per 1000)',
        speed: '10-30 ثانية',
        successRate: 95,
        code: `
          const TwoCaptcha = require('2captcha');
          const solver = new TwoCaptcha.Solver('YOUR_API_KEY');
          
          const result = await solver.recaptcha({
            pageurl: 'https://example.com',
            googlekey: 'SITE_KEY',
          });
          
          // استخدام الحل
          await page.evaluate((token) => {
            document.getElementById('g-recaptcha-response').value = token;
          }, result.data);
        `,
      },
      {
        name: 'Audio Challenge',
        cost: 'مجاني',
        speed: '30-60 ثانية',
        successRate: 70,
        description: 'حل التحدي الصوتي باستخدام speech-to-text',
      },
      {
        name: 'Behavioral Bypass',
        cost: 'مجاني',
        speed: 'فوري',
        successRate: 60,
        description: 'محاكاة سلوك بشري للحصول على score عالي',
      },
    ],
  },

  // حل hCaptcha
  hcaptcha: {
    methods: [
      {
        name: 'Machine Learning Recognition',
        effectiveness: 85,
        description: 'استخدام YOLO أو ResNet للتعرف على الصور',
      },
      {
        name: 'Capsolver API',
        cost: 'منخفض',
        speed: 'سريع',
        successRate: 90,
      },
    ],
  },

  // حل FunCaptcha (Arkose)
  funcaptcha: {
    methods: [
      {
        name: 'Capsolver Arkose Solver',
        effectiveness: 75,
        note: 'Arkose صعب جداً ويتطلب حلول متخصصة',
      },
    ],
  },
};

/**
 * دليل شامل للتعامل مع المواقع الشهيرة
 */
export const POPULAR_SITES_GUIDE = {
  amazon: {
    protection: ['AWS WAF', 'Behavioral Analysis', 'Rate Limiting'],
    difficulty: 'high',
    tips: [
      'استخدام residential proxies',
      'محاكاة سلوك تصفح طبيعي',
      'إضافة items إلى wishlist قبل الشراء',
      'تجنب scraping سريع جداً',
    ],
  },

  google: {
    protection: ['reCAPTCHA v3', 'Advanced Fingerprinting'],
    difficulty: 'extreme',
    tips: [
      'استخدام Google accounts حقيقية',
      'الحفاظ على cookies طويلة الأمد',
      'محاكاة نشاط بشري متنوع',
    ],
  },

  facebook: {
    protection: ['Custom Bot Detection', 'Behavioral Analysis'],
    difficulty: 'extreme',
    tips: [
      'استخدام accounts عمرها أكثر من شهر',
      'نشاط متنوع (like, comment, share)',
      'تجنب automation واضح',
    ],
  },

  linkedin: {
    protection: ['Arkose Labs', 'Rate Limiting', 'IP Tracking'],
    difficulty: 'high',
    tips: [
      'استخدام real browser',
      'احترام rate limits بشدة',
      'استخدام residential proxies',
    ],
  },

  shopify: {
    protection: ['reCAPTCHA', 'Queue-it', 'Rate Limiting'],
    difficulty: 'medium',
    tips: [
      'الحصول على session مبكراً',
      'استخدام checkout links مباشرة',
      'تجنب bot-like behavior',
    ],
  },
};