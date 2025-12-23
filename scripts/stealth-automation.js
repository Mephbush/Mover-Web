/**
 * سكريبت Stealth Automation المتقدم
 * يتجنب أنظمة كشف الروبوتات المتطورة
 */

const { chromium } = require('playwright');

// ========== إعدادات Stealth ==========

const STEALTH_CONFIG = {
  // User Agents واقعية
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ],
  
  // أحجام نوافذ شائعة
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 }
  ],
  
  // مناطق زمنية
  timezones: [
    'Asia/Riyadh',
    'Asia/Dubai', 
    'Africa/Cairo',
    'Asia/Kuwait',
    'Asia/Qatar'
  ],
  
  // لغات
  locales: [
    'ar-SA',
    'ar-AE',
    'ar-EG',
    'en-US'
  ]
};

// ========== دوال مساعدة ==========

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDelay(min = 100, max = 500) {
  return min + Math.random() * (max - min);
}

// ========== إنشاء متصفح Stealth ==========

async function createStealthBrowser() {
  const userAgent = randomChoice(STEALTH_CONFIG.userAgents);
  const viewport = randomChoice(STEALTH_CONFIG.viewports);
  const timezone = randomChoice(STEALTH_CONFIG.timezones);
  const locale = randomChoice(STEALTH_CONFIG.locales);

  const browser = await chromium.launch({
    headless: true,
    args: [
      // إزالة علامات الأتمتة
      '--disable-blink-features=AutomationControlled',
      
      // تحسينات الأداء
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      
      // إخفاء WebRTC
      '--disable-webrtc',
      '--disable-webrtc-hw-encoding',
      
      // أمان إضافي
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      
      // إخفاء GPU fingerprint
      '--disable-gpu',
      '--disable-software-rasterizer'
    ]
  });

  const context = await browser.newContext({
    userAgent,
    viewport,
    timezoneId: timezone,
    locale,
    
    // أذونات
    permissions: [],
    
    // Headers إضافية
    extraHTTPHeaders: {
      'Accept-Language': `${locale},en;q=0.9`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    
    // تفعيل JavaScript
    javaScriptEnabled: true,
    
    // إخفاء Automation
    bypassCSP: true
  });

  // ========== حقن سكريبتات التخفي ==========
  await context.addInitScript(() => {
    // إخفاء navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // محاكاة Chrome
    window.navigator.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };

    // Plugins واقعية
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: "application/x-google-chrome-pdf" },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        },
        {
          0: { type: "application/pdf" },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Viewer"
        },
        {
          0: { type: "application/x-nacl" },
          description: "Native Client Executable",
          filename: "internal-nacl-plugin",
          length: 1,
          name: "Native Client"
        }
      ]
    });

    // Languages واقعية
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ar-SA', 'ar', 'en-US', 'en']
    });

    // Permission API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Battery API - إخفاء
    Object.defineProperty(navigator, 'getBattery', {
      get: () => undefined
    });

    // WebGL Fingerprint - تعديل
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // إخفاء معلومات الـ GPU
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.apply(this, [parameter]);
    };

    // Canvas Fingerprint - تشويش
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
    
    // إضافة تشويش طفيف للـ Canvas
    CanvasRenderingContext2D.prototype.getImageData = function() {
      const imageData = getImageData.apply(this, arguments);
      for (let i = 0; i < imageData.data.length; i += 4) {
        // تشويش خفيف جداً لا يؤثر على المظهر
        imageData.data[i] = imageData.data[i] + Math.floor(Math.random() * 2);
      }
      return imageData;
    };

    // Audio Fingerprint - تشويش
    const audioContext = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function() {
      const oscillator = audioContext.apply(this, arguments);
      const originalFrequency = oscillator.frequency.value;
      oscillator.frequency.value = originalFrequency + Math.random() * 0.0001;
      return oscillator;
    };

    // إخفاء automation-specific properties
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    
    // إخفاء Playwright
    delete window._playwright;
    delete window.__playwright;
    
    // Screen properties واقعية
    Object.defineProperty(screen, 'availWidth', {
      get: () => screen.width
    });
    Object.defineProperty(screen, 'availHeight', {
      get: () => screen.height - 40 // شريط المهام
    });

    // إضافة Connection API واقعية
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false
      })
    });
  });

  return { browser, context };
}

// ========== محاكاة السلوك البشري ==========

async function humanDelay(min = 100, max = 500) {
  await new Promise(resolve => setTimeout(resolve, randomDelay(min, max)));
}

async function humanClick(page, selector) {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  
  if (box) {
    // تحريك الماوس بشكل طبيعي
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 20;
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 20;
    
    // حركة منحنية للماوس
    const steps = 10 + Math.floor(Math.random() * 15);
    await page.mouse.move(startX, startY);
    await humanDelay(50, 150);
    
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (targetX - startX) * progress;
      const y = startY + (targetY - startY) * progress;
      await page.mouse.move(x, y);
      await humanDelay(5, 15);
    }
    
    // تأخير قبل النقر
    await humanDelay(100, 300);
    
    // النقر
    await element.click();
    
    // تأخير بعد النقر
    await humanDelay(150, 400);
  }
}

async function humanType(page, selector, text) {
  await humanDelay(200, 600);
  
  // كتابة حرف بحرف
  for (const char of text) {
    await page.type(selector, char, {
      delay: 50 + Math.random() * 150
    });
    
    // أحياناً توقف طبيعي
    if (Math.random() < 0.1) {
      await humanDelay(200, 800);
    }
  }
  
  await humanDelay(100, 400);
}

async function humanScroll(page, direction = 'down') {
  const scrollAmount = 200 + Math.random() * 300;
  const scrollSteps = 3 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < scrollSteps; i++) {
    await page.evaluate((amount, dir) => {
      window.scrollBy({
        top: dir === 'down' ? amount : -amount,
        behavior: 'smooth'
      });
    }, scrollAmount / scrollSteps, direction);
    
    await humanDelay(300, 800);
  }
}

async function randomMouseMovement(page) {
  // حركات عشوائية للماوس لمحاكاة التصفح الطبيعي
  const movements = 2 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < movements; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    await page.mouse.move(x, y, { steps: 5 + Math.floor(Math.random() * 10) });
    await humanDelay(200, 600);
  }
}

// ========== مثال على الاستخدام ==========

async function runStealthAutomation(url, taskConfig) {
  console.log('🚀 بدء المهمة بوضع Stealth...');
  
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  
  try {
    console.log('🌐 الانتقال إلى:', url);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // انتظار عشوائي بعد تحميل الصفحة
    await humanDelay(1000, 3000);
    
    // حركات ماوس عشوائية
    await randomMouseMovement(page);
    
    // تمرير طبيعي
    await humanScroll(page);
    
    // مثال: تسجيل دخول
    if (taskConfig.type === 'login') {
      console.log('📝 تسجيل الدخول...');
      
      await humanClick(page, taskConfig.emailSelector || '#email');
      await humanType(page, taskConfig.emailSelector || '#email', taskConfig.email);
      
      await humanDelay(300, 800);
      
      await humanClick(page, taskConfig.passwordSelector || '#password');
      await humanType(page, taskConfig.passwordSelector || '#password', taskConfig.password);
      
      await humanDelay(500, 1200);
      
      await humanClick(page, taskConfig.submitSelector || 'button[type="submit"]');
      
      await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
      
      console.log('✅ تم تسجيل الدخول');
    }
    
    // مثال: جمع بيانات
    else if (taskConfig.type === 'scraping') {
      console.log('📊 جمع البيانات...');
      
      await humanScroll(page);
      await humanDelay(1000, 2000);
      
      const data = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => ({
          text: el.textContent?.trim(),
          html: el.innerHTML
        }));
      }, taskConfig.selector || '.item');
      
      console.log(`✅ تم جمع ${data.length} عنصر`);
      return data;
    }
    
    // التقاط صورة نهائية
    if (taskConfig.screenshot) {
      await page.screenshot({ 
        path: 'screenshot.png',
        fullPage: taskConfig.fullPage || false
      });
      console.log('📸 تم التقاط الصورة');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    throw error;
  } finally {
    // تنظيف
    await context.clearCookies();
    await browser.close();
    console.log('🔒 تم إغلاق المتصفح');
  }
}

// ========== التصدير ==========

module.exports = {
  createStealthBrowser,
  humanClick,
  humanType,
  humanScroll,
  humanDelay,
  randomMouseMovement,
  runStealthAutomation
};

// ========== مثال تشغيل ==========

if (require.main === module) {
  // مثال على تشغيل المهمة
  runStealthAutomation('https://example.com', {
    type: 'scraping',
    selector: '.product',
    screenshot: true,
    fullPage: false
  }).then(() => {
    console.log('✨ اكتملت المهمة بنجاح');
    process.exit(0);
  }).catch(error => {
    console.error('💥 فشلت المهمة:', error);
    process.exit(1);
  });
}
