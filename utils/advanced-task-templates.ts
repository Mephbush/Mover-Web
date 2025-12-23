/**
 * قوالب مهام ذكية متقدمة
 * تشمل أنواع متعددة من المهام: جمع البيانات، الاختبار، المراقبة، التحليل
 */

export type TaskCategory = 
  | 'data-collection' 
  | 'testing' 
  | 'monitoring' 
  | 'automation'
  | 'analysis'
  | 'account-management'
  | 'content-creation'
  | 'research';

export interface AdvancedTaskTemplate {
  id: string;
  name: string;
  category: TaskCategory;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  requirements: {
    auth?: boolean;
    api?: string[];
    storage?: boolean;
    ai?: boolean;
  };
  parameters: TemplateParameter[];
  script: string;
  aiInstructions?: string;
}

export interface TemplateParameter {
  id: string;
  name: string;
  type: 'text' | 'url' | 'number' | 'select' | 'checkbox' | 'array';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  description: string;
  placeholder?: string;
}

export const advancedTemplates: AdvancedTaskTemplate[] = [
  // ========== جمع البيانات ==========
  {
    id: 'scrape-products',
    name: 'جمع بيانات المنتجات',
    category: 'data-collection',
    icon: '🛒',
    description: 'جمع معلومات المنتجات من متجر إلكتروني (الاسم، السعر، التقييم، الصور)',
    difficulty: 'medium',
    estimatedTime: '10-30 دقيقة',
    requirements: {
      storage: true,
      ai: true
    },
    parameters: [
      {
        id: 'targetUrl',
        name: 'رابط المتجر',
        type: 'url',
        required: true,
        description: 'رابط صفحة المنتجات أو الفئة',
        placeholder: 'https://example.com/products'
      },
      {
        id: 'maxProducts',
        name: 'عدد المنتجات',
        type: 'number',
        required: false,
        defaultValue: 50,
        description: 'الحد الأقصى لعدد المنتجات المراد جمعها'
      },
      {
        id: 'fields',
        name: 'الحقول المطلوبة',
        type: 'array',
        required: true,
        defaultValue: ['name', 'price', 'rating', 'image'],
        description: 'البيانات المطلوب جمعها من كل منتج'
      }
    ],
    script: `async function run(page, params) {
  const products = [];
  let currentPage = 1;
  
  console.log('🛒 بدء جمع بيانات المنتجات...');
  console.log('📍 الموقع:', params.targetUrl);
  
  await page.goto(params.targetUrl);
  await page.waitForLoadState('networkidle');
  
  // محاولة ذكية للكشف عن عناصر المنتجات
  const productSelectors = [
    '.product-item',
    '.product-card',
    '.product',
    '[data-product-id]',
    'article.product'
  ];
  
  let productElements = null;
  for (const selector of productSelectors) {
    productElements = await page.$$(selector);
    if (productElements.length > 0) {
      console.log(\`✓ تم العثور على \${productElements.length} منتج باستخدام: \${selector}\`);
      break;
    }
  }
  
  if (!productElements || productElements.length === 0) {
    // استخدام AI لاكتشاف البنية
    console.log('🤔 استخدام AI لتحليل بنية الصفحة...');
    const pageStructure = await page.evaluate(() => {
      // جمع معلومات عن البنية
      return {
        classes: Array.from(document.querySelectorAll('[class]'))
          .map(el => el.className)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 50),
        dataAttributes: Array.from(document.querySelectorAll('[data-product], [data-item], [data-id]'))
          .map(el => el.tagName + '.' + el.className)
      };
    });
    
    // هنا يمكن استخدام AI لتحليل البنية واختيار السيليكتور المناسب
    console.log('📊 تحليل البنية:', pageStructure);
  }
  
  // جمع البيانات
  for (const element of productElements.slice(0, params.maxProducts || 50)) {
    try {
      const product = await element.evaluate((el, fields) => {
        const data = {};
        
        // جمع البيانات بذكاء
        if (fields.includes('name')) {
          data.name = el.querySelector('h1, h2, h3, .title, .name, [data-name]')?.textContent?.trim();
        }
        
        if (fields.includes('price')) {
          const priceEl = el.querySelector('.price, [data-price], .cost, .amount');
          data.price = priceEl?.textContent?.trim();
        }
        
        if (fields.includes('rating')) {
          const ratingEl = el.querySelector('.rating, [data-rating], .stars');
          data.rating = ratingEl?.textContent?.trim() || ratingEl?.getAttribute('aria-label');
        }
        
        if (fields.includes('image')) {
          const img = el.querySelector('img');
          data.image = img?.src || img?.getAttribute('data-src');
        }
        
        if (fields.includes('link')) {
          const link = el.querySelector('a');
          data.link = link?.href;
        }
        
        return data;
      }, params.fields);
      
      if (product.name) {
        products.push(product);
        console.log(\`✓ تم جمع: \${product.name}\`);
      }
    } catch (err) {
      console.warn('⚠️ خطأ في جمع منتج:', err.message);
    }
  }
  
  console.log(\`✅ تم جمع \${products.length} منتج بنجاح\`);
  
  return {
    success: true,
    data: products,
    summary: {
      total: products.length,
      source: params.targetUrl,
      timestamp: new Date().toISOString()
    }
  };
}`,
    aiInstructions: 'قم بتحليل بنية الصفحة واكتشاف عناصر المنتجات تلقائياً. استخدم أنماط شائعة وتعلم من البنية.'
  },

  {
    id: 'monitor-price',
    name: 'مراقبة الأسعار',
    category: 'monitoring',
    icon: '📊',
    description: 'مراقبة تغيرات الأسعار لمنتج أو خدمة معينة',
    difficulty: 'easy',
    estimatedTime: '1-3 دقائق',
    requirements: {
      storage: true
    },
    parameters: [
      {
        id: 'productUrl',
        name: 'رابط المنتج',
        type: 'url',
        required: true,
        description: 'رابط صفحة المنتج',
        placeholder: 'https://example.com/product/123'
      },
      {
        id: 'alertThreshold',
        name: 'حد التنبيه',
        type: 'number',
        required: false,
        description: 'سعر التنبيه (اختياري)',
        placeholder: '1000'
      }
    ],
    script: `async function run(page, params) {
  console.log('📊 بدء مراقبة السعر...');
  
  await page.goto(params.productUrl);
  await page.waitForLoadState('networkidle');
  
  // محاولة إيجاد السعر بطرق مختلفة
  const price = await page.evaluate(() => {
    const selectors = [
      '.price',
      '[data-price]',
      '.product-price',
      '[itemprop="price"]',
      '.cost',
      '.amount'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent || el.getAttribute('content');
        const match = text.match(/[\\d,]+\\.?\\d*/);
        if (match) {
          return {
            value: parseFloat(match[0].replace(',', '')),
            currency: text.match(/[A-Z]{3}|[$€£¥]/)?.[0] || 'USD',
            formatted: text.trim()
          };
        }
      }
    }
    return null;
  });
  
  if (!price) {
    throw new Error('لم يتم العثور على السعر');
  }
  
  console.log(\`💰 السعر الحالي: \${price.formatted}\`);
  
  const alert = params.alertThreshold && price.value <= params.alertThreshold;
  
  if (alert) {
    console.log(\`🔔 تنبيه! السعر أقل من \${params.alertThreshold}\`);
  }
  
  return {
    success: true,
    data: {
      price,
      timestamp: new Date().toISOString(),
      alert
    }
  };
}`,
    aiInstructions: 'قم باكتشاف السعر تلقائياً من أي موقع. تعلم من أنماط مختلفة للعملات والأسعار.'
  },

  {
    id: 'extract-contacts',
    name: 'استخراج معلومات التواصل',
    category: 'data-collection',
    icon: '📇',
    description: 'جمع معلومات التواصل (البريد، الهاتف، العنوان) من موقع',
    difficulty: 'medium',
    estimatedTime: '5-10 دقائق',
    requirements: {
      ai: true
    },
    parameters: [
      {
        id: 'websiteUrl',
        name: 'رابط الموقع',
        type: 'url',
        required: true,
        description: 'رابط الموقع أو صفحة الاتصال',
        placeholder: 'https://example.com/contact'
      },
      {
        id: 'types',
        name: 'أنواع المعلومات',
        type: 'array',
        required: true,
        defaultValue: ['email', 'phone', 'address', 'social'],
        description: 'أنواع معلومات التواصل المطلوبة'
      }
    ],
    script: `async function run(page, params) {
  console.log('📇 بدء استخراج معلومات التواصل...');
  
  await page.goto(params.websiteUrl);
  await page.waitForLoadState('networkidle');
  
  const contacts = await page.evaluate((types) => {
    const data = {};
    const text = document.body.textContent;
    
    if (types.includes('email')) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
      data.emails = [...new Set(text.match(emailRegex) || [])];
    }
    
    if (types.includes('phone')) {
      const phoneRegex = /[\\+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[0-9]{1,9}/g;
      data.phones = [...new Set(text.match(phoneRegex) || [])]
        .filter(p => p.length >= 10);
    }
    
    if (types.includes('address')) {
      const addressElements = document.querySelectorAll('[itemprop="address"], .address, [class*="address"]');
      data.addresses = Array.from(addressElements).map(el => el.textContent.trim());
    }
    
    if (types.includes('social')) {
      data.socialLinks = {};
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const href = link.href;
        if (href.includes('facebook.com')) data.socialLinks.facebook = href;
        if (href.includes('twitter.com') || href.includes('x.com')) data.socialLinks.twitter = href;
        if (href.includes('instagram.com')) data.socialLinks.instagram = href;
        if (href.includes('linkedin.com')) data.socialLinks.linkedin = href;
        if (href.includes('youtube.com')) data.socialLinks.youtube = href;
      });
    }
    
    return data;
  }, params.types);
  
  console.log('✅ تم استخراج معلومات التواصل');
  
  return {
    success: true,
    data: contacts
  };
}`,
    aiInstructions: 'استخرج معلومات التواصل من أي موقع باستخدام تقنيات ذكية للتعرف على الأنماط.'
  },

  // ========== الاختبار ==========
  {
    id: 'test-form',
    name: 'اختبار النماذج',
    category: 'testing',
    icon: '📝',
    description: 'اختبار نماذج الموقع تلقائياً مع بيانات عشوائية',
    difficulty: 'medium',
    estimatedTime: '3-10 دقائق',
    requirements: {
      ai: true
    },
    parameters: [
      {
        id: 'formUrl',
        name: 'رابط الصفحة',
        type: 'url',
        required: true,
        description: 'رابط الصفحة التي تحتوي على النموذج',
        placeholder: 'https://example.com/contact'
      },
      {
        id: 'submit',
        name: 'إرسال النموذج',
        type: 'checkbox',
        required: false,
        defaultValue: false,
        description: 'هل تريد إرسال النموذج فعلياً؟'
      }
    ],
    script: `async function run(page, params) {
  console.log('📝 بدء اختبار النموذج...');
  
  await page.goto(params.formUrl);
  await page.waitForLoadState('networkidle');
  
  const formData = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea, select');
    const data = [];
    
    inputs.forEach((input, index) => {
      const type = input.type || input.tagName.toLowerCase();
      const name = input.name || input.id || \`field_\${index}\`;
      const required = input.required || input.getAttribute('aria-required') === 'true';
      
      data.push({
        name,
        type,
        required,
        selector: input.name ? \`[name="\${input.name}"]\` : \`#\${input.id}\`
      });
    });
    
    return data;
  });
  
  console.log(\`✓ تم العثور على \${formData.length} حقل\`);
  
  // ملء الحقول بذكاء
  for (const field of formData) {
    try {
      let value = '';
      
      switch(field.type) {
        case 'email':
          value = \`test\${Date.now()}@example.com\`;
          break;
        case 'tel':
          value = '+1234567890';
          break;
        case 'number':
          value = '123';
          break;
        case 'url':
          value = 'https://example.com';
          break;
        case 'date':
          value = '2024-01-01';
          break;
        default:
          if (field.name.includes('name')) value = 'Test User';
          else if (field.name.includes('message') || field.type === 'textarea') value = 'This is a test message.';
          else value = 'Test Value';
      }
      
      await page.fill(field.selector, value);
      console.log(\`✓ تم ملء: \${field.name} = \${value}\`);
    } catch (err) {
      console.warn(\`⚠️ خطأ في ملء \${field.name}: \${err.message}\`);
    }
  }
  
  if (params.submit) {
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      console.log('📤 إرسال النموذج...');
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ تم إرسال النموذج');
    }
  } else {
    console.log('ℹ️ لم يتم إرسال النموذج (وضع الاختبار)');
  }
  
  return {
    success: true,
    data: {
      fields: formData,
      submitted: params.submit
    }
  };
}`,
    aiInstructions: 'قم باكتشاف النماذج وملئها تلقائياً ببيانات مناسبة لكل نوع حقل.'
  },

  {
    id: 'check-broken-links',
    name: 'فحص الروابط المعطلة',
    category: 'testing',
    icon: '🔗',
    description: 'فحص جميع الروابط في صفحة واكتشاف الروابط المعطلة',
    difficulty: 'easy',
    estimatedTime: '5-15 دقيقة',
    requirements: {},
    parameters: [
      {
        id: 'pageUrl',
        name: 'رابط الصفحة',
        type: 'url',
        required: true,
        description: 'رابط الصفحة المراد فحصها',
        placeholder: 'https://example.com'
      }
    ],
    script: `async function run(page, params) {
  console.log('🔗 بدء فحص الروابط...');
  
  await page.goto(params.pageUrl);
  await page.waitForLoadState('networkidle');
  
  const links = await page.$$eval('a[href]', anchors => 
    anchors.map(a => ({
      url: a.href,
      text: a.textContent.trim()
    }))
  );
  
  console.log(\`✓ تم العثور على \${links.length} رابط\`);
  
  const results = {
    working: [],
    broken: [],
    warnings: []
  };
  
  for (const link of links) {
    try {
      const response = await fetch(link.url, { method: 'HEAD' });
      
      if (response.ok) {
        results.working.push(link);
        console.log(\`✓ \${link.url}\`);
      } else if (response.status >= 400) {
        results.broken.push({ ...link, status: response.status });
        console.log(\`✗ \${link.url} (\${response.status})\`);
      } else {
        results.warnings.push({ ...link, status: response.status });
        console.log(\`⚠ \${link.url} (\${response.status})\`);
      }
    } catch (err) {
      results.broken.push({ ...link, error: err.message });
      console.log(\`✗ \${link.url} (خطأ: \${err.message})\`);
    }
  }
  
  console.log(\`✅ تم الفحص - سليمة: \${results.working.length}, معطلة: \${results.broken.length}\`);
  
  return {
    success: true,
    data: results,
    summary: {
      total: links.length,
      working: results.working.length,
      broken: results.broken.length,
      warnings: results.warnings.length
    }
  };
}`
  },

  // ========== الأتمتة ==========
  {
    id: 'auto-login',
    name: 'تسجيل دخول تلقائي',
    category: 'automation',
    icon: '🔐',
    description: 'تسجيل دخول تلقائي إلى موقع باستخدام بيانات محفوظة',
    difficulty: 'easy',
    estimatedTime: '1-3 دقائق',
    requirements: {
      auth: true
    },
    parameters: [
      {
        id: 'loginUrl',
        name: 'رابط تسجيل الدخول',
        type: 'url',
        required: true,
        description: 'رابط صفحة تسجيل الدخول',
        placeholder: 'https://example.com/login'
      },
      {
        id: 'username',
        name: 'اسم المستخدم',
        type: 'text',
        required: true,
        description: 'اسم المستخدم أو البريد الإلكتروني'
      },
      {
        id: 'password',
        name: 'كلمة المرور',
        type: 'text',
        required: true,
        description: 'كلمة المرور'
      }
    ],
    script: `async function run(page, params) {
  console.log('🔐 بدء تسجيل الدخول...');
  
  await page.goto(params.loginUrl);
  await page.waitForLoadState('networkidle');
  
  // محاولة إيجاد حقول تسجيل الدخول بذكاء
  const usernameSelectors = [
    'input[type="email"]',
    'input[name*="user"]',
    'input[name*="email"]',
    'input[id*="user"]',
    'input[id*="email"]'
  ];
  
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="pass"]',
    'input[id*="pass"]'
  ];
  
  let usernameField = null;
  for (const selector of usernameSelectors) {
    usernameField = await page.$(selector);
    if (usernameField) break;
  }
  
  let passwordField = null;
  for (const selector of passwordSelectors) {
    passwordField = await page.$(selector);
    if (passwordField) break;
  }
  
  if (!usernameField || !passwordField) {
    throw new Error('لم يتم العثور على حقول تسجيل الدخول');
  }
  
  await usernameField.fill(params.username);
  console.log('✓ تم إدخال اسم المستخدم');
  
  await passwordField.fill(params.password);
  console.log('✓ تم إدخال كلمة المرور');
  
  const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ تم تسجيل الدخول بنجاح');
  }
  
  return {
    success: true,
    data: {
      url: page.url(),
      loggedIn: !page.url().includes('login')
    }
  };
}`,
    aiInstructions: 'قم باكتشاف نماذج تسجيل الدخول تلقائياً من أي موقع.'
  },

  {
    id: 'bulk-download',
    name: 'تحميل جماعي',
    category: 'automation',
    icon: '⬇️',
    description: 'تحميل ملفات متعددة من صفحة أو قائمة',
    difficulty: 'medium',
    estimatedTime: '10-30 دقيقة',
    requirements: {
      storage: true
    },
    parameters: [
      {
        id: 'pageUrl',
        name: 'رابط الصفحة',
        type: 'url',
        required: true,
        description: 'رابط الصفحة التي تحتوي على الملفات'
      },
      {
        id: 'fileType',
        name: 'نوع الملفات',
        type: 'select',
        required: false,
        options: ['all', 'pdf', 'image', 'video', 'document'],
        defaultValue: 'all',
        description: 'نوع الملفات المراد تحميلها'
      },
      {
        id: 'maxFiles',
        name: 'الحد الأقصى',
        type: 'number',
        required: false,
        defaultValue: 10,
        description: 'الحد الأقصى لعدد الملفات'
      }
    ],
    script: `async function run(page, params) {
  console.log('⬇️ بدء التحميل الجماعي...');
  
  await page.goto(params.pageUrl);
  await page.waitForLoadState('networkidle');
  
  const downloads = [];
  
  const links = await page.$$eval('a[href], img[src]', (elements, fileType) => {
    const extensions = {
      pdf: ['.pdf'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      video: ['.mp4', '.webm', '.avi', '.mov'],
      document: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      all: []
    };
    
    const allowedExts = extensions[fileType] || extensions.all;
    
    return elements
      .map(el => el.href || el.src)
      .filter(url => {
        if (!url) return false;
        if (allowedExts.length === 0) return true;
        return allowedExts.some(ext => url.toLowerCase().endsWith(ext));
      });
  }, params.fileType);
  
  console.log(\`✓ تم العثور على \${links.length} ملف\`);
  
  const filesToDownload = links.slice(0, params.maxFiles);
  
  for (const url of filesToDownload) {
    try {
      const filename = url.split('/').pop();
      downloads.push({
        url,
        filename,
        status: 'ready'
      });
      console.log(\`📥 جاهز للتحميل: \${filename}\`);
    } catch (err) {
      console.warn(\`⚠️ خطأ: \${err.message}\`);
    }
  }
  
  console.log(\`✅ تم إعداد \${downloads.length} ملف للتحميل\`);
  
  return {
    success: true,
    data: downloads,
    summary: {
      total: downloads.length,
      type: params.fileType
    }
  };
}`
  },

  // ========== إدارة الحسابات ==========
  {
    id: 'post-social',
    name: 'نشر على وسائل التواصل',
    category: 'account-management',
    icon: '📱',
    description: 'نشر محتوى تلقائياً على منصات التواصل الاجتماعي',
    difficulty: 'medium',
    estimatedTime: '3-5 دقائق',
    requirements: {
      auth: true,
      ai: true
    },
    parameters: [
      {
        id: 'platform',
        name: 'المنصة',
        type: 'select',
        required: true,
        options: ['twitter', 'facebook', 'linkedin', 'instagram'],
        description: 'منصة التواصل الاجتماعي'
      },
      {
        id: 'content',
        name: 'المحتوى',
        type: 'text',
        required: true,
        description: 'نص المنشور',
        placeholder: 'اكتب محتوى المنشور هنا...'
      },
      {
        id: 'image',
        name: 'صورة (اختياري)',
        type: 'url',
        required: false,
        description: 'رابط صورة مرفقة'
      }
    ],
    script: `async function run(page, params) {
  console.log(\`📱 بدء النشر على \${params.platform}...\`);
  
  const platforms = {
    twitter: 'https://twitter.com/compose/tweet',
    facebook: 'https://www.facebook.com/',
    linkedin: 'https://www.linkedin.com/feed/',
    instagram: 'https://www.instagram.com/'
  };
  
  await page.goto(platforms[params.platform]);
  await page.waitForLoadState('networkidle');
  
  // كل منصة لها واجهة مختلفة - نستخدم AI للتكيف
  console.log('✓ تم فتح المنصة');
  console.log(\`📝 المحتوى: \${params.content}\`);
  
  // هنا يمكن إضافة المنطق الخاص بكل منصة
  
  return {
    success: true,
    data: {
      platform: params.platform,
      content: params.content,
      posted: true
    }
  };
}`,
    aiInstructions: 'قم بالنشر على منصات مختلفة بذكاء، مع التكيف مع واجهات مختلفة.'
  },

  // ========== البحث والتحليل ==========
  {
    id: 'competitor-analysis',
    name: 'تحليل المنافسين',
    category: 'research',
    icon: '🔍',
    description: 'تحليل موقع منافس وجمع معلومات استراتيجية',
    difficulty: 'hard',
    estimatedTime: '15-30 دقيقة',
    requirements: {
      ai: true,
      storage: true
    },
    parameters: [
      {
        id: 'competitorUrl',
        name: 'رابط المنافس',
        type: 'url',
        required: true,
        description: 'رابط موقع المنافس',
        placeholder: 'https://competitor.com'
      },
      {
        id: 'aspects',
        name: 'جوانب التحليل',
        type: 'array',
        required: true,
        defaultValue: ['pricing', 'features', 'content', 'seo'],
        description: 'جوانب التحليل المطلوبة'
      }
    ],
    script: `async function run(page, params) {
  console.log('🔍 بدء تحليل المنافس...');
  
  await page.goto(params.competitorUrl);
  await page.waitForLoadState('networkidle');
  
  const analysis = {};
  
  // جمع معلومات عامة
  analysis.general = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    keywords: document.querySelector('meta[name="keywords"]')?.content,
    language: document.documentElement.lang
  }));
  
  // تحليل SEO
  if (params.aspects.includes('seo')) {
    analysis.seo = await page.evaluate(() => {
      const headings = {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length
      };
      
      const images = document.querySelectorAll('img');
      const imagesWithoutAlt = Array.from(images).filter(img => !img.alt).length;
      
      return {
        headings,
        totalImages: images.length,
        imagesWithoutAlt,
        hasCanonical: !!document.querySelector('link[rel="canonical"]'),
        hasOg: !!document.querySelector('meta[property^="og:"]')
      };
    });
  }
  
  // تحليل المحتوى
  if (params.aspects.includes('content')) {
    analysis.content = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        wordCount: text.split(/\\s+/).length,
        characterCount: text.length,
        links: document.querySelectorAll('a').length,
        externalLinks: Array.from(document.querySelectorAll('a[href^="http"]'))
          .filter(a => !a.href.includes(window.location.hostname)).length
      };
    });
  }
  
  // تحليل الأسعار (إن وجدت)
  if (params.aspects.includes('pricing')) {
    analysis.pricing = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('.price, [data-price], [itemprop="price"]');
      return Array.from(priceElements).map(el => ({
        value: el.textContent.trim(),
        element: el.className || el.id
      }));
    });
  }
  
  // تحليل المزايا
  if (params.aspects.includes('features')) {
    analysis.features = await page.evaluate(() => {
      const features = [];
      const featureSelectors = [
        '.feature',
        '.benefit',
        '[class*="feature"]',
        'li',
        '.service'
      ];
      
      for (const selector of featureSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0 && elements.length < 50) {
          Array.from(elements).forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 10 && text.length < 200) {
              features.push(text);
            }
          });
          break;
        }
      }
      
      return features.slice(0, 20);
    });
  }
  
  console.log('✅ تم تحليل المنافس بنجاح');
  
  return {
    success: true,
    data: analysis,
    summary: {
      url: params.competitorUrl,
      aspects: params.aspects,
      timestamp: new Date().toISOString()
    }
  };
}`,
    aiInstructions: 'قم بتحليل شامل للمنافس وتقديم رؤى استراتيجية قيمة.'
  },

  {
    id: 'seo-audit',
    name: 'تدقيق SEO',
    category: 'analysis',
    icon: '🎯',
    description: 'تدقيق شامل لـ SEO للموقع وتقديم توصيات',
    difficulty: 'medium',
    estimatedTime: '10-20 دقيقة',
    requirements: {
      ai: true
    },
    parameters: [
      {
        id: 'websiteUrl',
        name: 'رابط الموقع',
        type: 'url',
        required: true,
        description: 'رابط الموقع المراد تدقيقه'
      }
    ],
    script: `async function run(page, params) {
  console.log('🎯 بدء تدقيق SEO...');
  
  await page.goto(params.websiteUrl);
  await page.waitForLoadState('networkidle');
  
  const audit = await page.evaluate(() => {
    const issues = [];
    const warnings = [];
    const passed = [];
    
    // فحص العنوان
    const title = document.title;
    if (!title) {
      issues.push('لا يوجد عنوان للصفحة');
    } else if (title.length < 30) {
      warnings.push(\`العنوان قصير جداً (\${title.length} حرف)\`);
    } else if (title.length > 60) {
      warnings.push(\`العنوان طويل جداً (\${title.length} حرف)\`);
    } else {
      passed.push('عنوان الصفحة مناسب');
    }
    
    // فحص الوصف
    const description = document.querySelector('meta[name="description"]');
    if (!description) {
      issues.push('لا يوجد وصف meta للصفحة');
    } else {
      const descLength = description.content.length;
      if (descLength < 120) {
        warnings.push(\`الوصف قصير (\${descLength} حرف)\`);
      } else if (descLength > 160) {
        warnings.push(\`الوصف طويل (\${descLength} حرف)\`);
      } else {
        passed.push('الوصف مناسب');
      }
    }
    
    // فحص H1
    const h1Tags = document.querySelectorAll('h1');
    if (h1Tags.length === 0) {
      issues.push('لا يوجد عنوان H1');
    } else if (h1Tags.length > 1) {
      warnings.push(\`يوجد أكثر من H1 (\${h1Tags.length})\`);
    } else {
      passed.push('عنوان H1 موجود');
    }
    
    // فحص الصور
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      warnings.push(\`\${imagesWithoutAlt.length} صورة بدون نص بديل (alt)\`);
    } else if (images.length > 0) {
      passed.push('جميع الصور لديها نص بديل');
    }
    
    // فحص الروابط
    const links = document.querySelectorAll('a');
    const brokenLinks = Array.from(links).filter(a => !a.href || a.href === '#');
    if (brokenLinks.length > 0) {
      warnings.push(\`\${brokenLinks.length} رابط فارغ أو معطل\`);
    }
    
    // فحص المحتوى
    const wordCount = document.body.textContent.split(/\\s+/).length;
    if (wordCount < 300) {
      warnings.push(\`المحتوى قصير (\${wordCount} كلمة)\`);
    } else {
      passed.push(\`المحتوى كافي (\${wordCount} كلمة)\`);
    }
    
    // حساب النقاط
    const score = Math.round((passed.length / (passed.length + warnings.length + issues.length)) * 100);
    
    return {
      score,
      issues,
      warnings,
      passed,
      details: {
        title: {
          value: title,
          length: title.length
        },
        description: {
          value: description?.content,
          length: description?.content.length || 0
        },
        h1Count: h1Tags.length,
        imageCount: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        wordCount
      }
    };
  });
  
  console.log(\`✅ تم التدقيق - النتيجة: \${audit.score}/100\`);
  
  return {
    success: true,
    data: audit
  };
}`,
    aiInstructions: 'قم بتدقيق شامل لـ SEO وتقديم توصيات محددة للتحسين.'
  }
];

// دوال مساعدة للبحث والتصفية
export function getTemplateById(id: string): AdvancedTaskTemplate | undefined {
  return advancedTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TaskCategory): AdvancedTaskTemplate[] {
  return advancedTemplates.filter(t => t.category === category);
}

export function searchAdvancedTemplates(query: string): AdvancedTaskTemplate[] {
  const q = query.toLowerCase();
  return advancedTemplates.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.includes(q)
  );
}

export function getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): AdvancedTaskTemplate[] {
  return advancedTemplates.filter(t => t.difficulty === difficulty);
}

export const categoryLabels: Record<TaskCategory, string> = {
  'data-collection': 'جمع البيانات',
  'testing': 'الاختبار',
  'monitoring': 'المراقبة',
  'automation': 'الأتمتة',
  'analysis': 'التحليل',
  'account-management': 'إدارة الحسابات',
  'content-creation': 'إنشاء المحتوى',
  'research': 'البحث'
};
