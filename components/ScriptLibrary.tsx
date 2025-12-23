import type { Task } from '../types';
import { Search, Copy, Download, Star } from 'lucide-react';
import { useState } from 'react';

type ScriptLibraryProps = {
  onSelectTemplate: (template: Task) => void;
};

const templates: Task[] = [
  {
    id: 'tpl-1',
    name: 'جمع بيانات المنتجات من موقع تجارة إلكترونية',
    description: 'استخراج أسماء، أسعار، وصور المنتجات من أي متجر إلكتروني',
    type: 'scraping',
    status: 'idle',
    targetUrl: 'https://example-store.com/products',
    script: `// جمع بيانات المنتجات
await page.goto(targetUrl);
await page.waitForSelector('.product-item');

const products = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.product-item')).map(product => ({
    name: product.querySelector('.product-name')?.textContent?.trim(),
    price: product.querySelector('.product-price')?.textContent?.trim(),
    image: product.querySelector('img')?.src,
    url: product.querySelector('a')?.href,
    rating: product.querySelector('.rating')?.textContent?.trim()
  }));
});

console.log(\`تم العثور على \${products.length} منتج\`);
return products;`,
    createdAt: new Date()
  },
  {
    id: 'tpl-2',
    name: 'تسجيل دخول تلقائي متعدد المنصات',
    description: 'سكريبت مرن لتسجيل الدخول في مختلف المنصات',
    type: 'login',
    status: 'idle',
    targetUrl: 'https://platform.com/login',
    script: `// تسجيل دخول ذكي
await page.goto(targetUrl);

// محاولة اكتشاف حقول الدخول تلقائياً
const emailSelectors = ['#email', '#username', 'input[type="email"]', 'input[name="email"]'];
const passwordSelectors = ['#password', 'input[type="password"]', 'input[name="password"]'];

for (const selector of emailSelectors) {
  if (await page.isVisible(selector)) {
    await page.fill(selector, credentials.email);
    break;
  }
}

for (const selector of passwordSelectors) {
  if (await page.isVisible(selector)) {
    await page.fill(selector, credentials.password);
    break;
  }
}

// البحث عن زر الدخول
const submitSelectors = ['button[type="submit"]', '.login-button', '#login-btn'];
for (const selector of submitSelectors) {
  if (await page.isVisible(selector)) {
    await page.click(selector);
    break;
  }
}

await page.waitForNavigation({ timeout: 10000 });
return { success: true, url: page.url() };`,
    createdAt: new Date()
  },
  {
    id: 'tpl-3',
    name: 'إنشاء حساب جديد',
    description: 'أتمتة عملية التسجيل وإنشاء حسابات جديدة',
    type: 'registration',
    status: 'idle',
    targetUrl: 'https://platform.com/signup',
    script: `// إنشاء حساب جديد
await page.goto(targetUrl);

// ملء بيانات التسجيل
await page.fill('#name', credentials.name);
await page.fill('#email', credentials.email);
await page.fill('#password', credentials.password);
await page.fill('#confirmPassword', credentials.password);

// قبول الشروط
const termsCheckbox = await page.locator('input[type="checkbox"]');
if (await termsCheckbox.isVisible()) {
  await termsCheckbox.check();
}

// الضغط على زر التسجيل
await page.click('button[type="submit"]');

// انتظار رسالة النجاح أو إعادة التوجيه
try {
  await page.waitForSelector('.success-message', { timeout: 5000 });
  return { success: true, message: 'تم إنشاء الحساب بنجاح' };
} catch {
  await page.waitForNavigation({ timeout: 5000 });
  return { success: true, url: page.url() };
}`,
    createdAt: new Date()
  },
  {
    id: 'tpl-4',
    name: 'اختبار أداء وسرعة الموقع',
    description: 'قياس سرعة تحميل الصفحات واختبار الأداء',
    type: 'testing',
    status: 'idle',
    targetUrl: 'https://website-to-test.com',
    script: `// اختبار الأداء
const startTime = Date.now();

await page.goto(targetUrl);
const loadTime = Date.now() - startTime;

// جمع معلومات الأداء
const metrics = await page.evaluate(() => {
  const perf = performance.getEntriesByType('navigation')[0];
  return {
    dns: perf.domainLookupEnd - perf.domainLookupStart,
    connection: perf.connectEnd - perf.connectStart,
    response: perf.responseEnd - perf.responseStart,
    dom: perf.domComplete - perf.domLoading,
    load: perf.loadEventEnd - perf.loadEventStart
  };
});

// حساب حجم الموارد
const resources = await page.evaluate(() => {
  return performance.getEntriesByType('resource').map(r => ({
    name: r.name,
    size: r.transferSize,
    duration: r.duration
  }));
});

const totalSize = resources.reduce((sum, r) => sum + r.size, 0);

return {
  loadTime,
  metrics,
  totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
  resourceCount: resources.length
};`,
    createdAt: new Date()
  },
  {
    id: 'tpl-5',
    name: 'التقاط لقطات شاشة متعددة',
    description: 'التقاط صور للصفحة الكاملة وعناصر محددة',
    type: 'screenshot',
    status: 'idle',
    targetUrl: 'https://website.com',
    script: `// التقاط لقطات متعددة
await page.goto(targetUrl);
await page.waitForLoadState('networkidle');

// لقطة للصفحة الكاملة
const fullPage = await page.screenshot({
  fullPage: true,
  type: 'png'
});

// لقطة للشاشة المرئية فقط
const viewport = await page.screenshot({
  type: 'png'
});

// لقطة لعنصر محدد
let elementShot = null;
const selector = '.main-content';
if (await page.isVisible(selector)) {
  const element = await page.locator(selector);
  elementShot = await element.screenshot();
}

return {
  fullPage,
  viewport,
  elementShot,
  timestamp: new Date().toISOString()
};`,
    createdAt: new Date()
  },
  {
    id: 'tpl-6',
    name: 'جمع بيانات وسائل التواصل الاجتماعي',
    description: 'استخراج المنشورات والتعليقات والإعجابات',
    type: 'scraping',
    status: 'idle',
    targetUrl: 'https://social-platform.com/profile',
    script: `// جمع بيانات السوشيال ميديا
await page.goto(targetUrl);
await page.waitForSelector('.post');

// التمرير لتحميل المزيد من المنشورات
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
}

const posts = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.post')).map(post => ({
    text: post.querySelector('.post-text')?.textContent?.trim(),
    author: post.querySelector('.author-name')?.textContent?.trim(),
    date: post.querySelector('.post-date')?.textContent?.trim(),
    likes: post.querySelector('.likes-count')?.textContent?.trim(),
    comments: post.querySelector('.comments-count')?.textContent?.trim(),
    shares: post.querySelector('.shares-count')?.textContent?.trim()
  }));
});

return {
  postsCount: posts.length,
  posts
};`,
    createdAt: new Date()
  },
  {
    id: 'tpl-7',
    name: 'مراقبة التغييرات في الموقع',
    description: 'مراقبة محتوى الصفحة والإشعار عند التغيير',
    type: 'custom',
    status: 'idle',
    targetUrl: 'https://website-to-monitor.com',
    script: `// مراقبة التغييرات
await page.goto(targetUrl);

// استخراج المحتوى الحالي
const currentContent = await page.evaluate(() => {
  const mainContent = document.querySelector('main') || document.body;
  return {
    html: mainContent.innerHTML.trim(),
    text: mainContent.textContent?.trim(),
    hash: btoa(mainContent.textContent?.trim() || '')
  };
});

// مقارنة مع المحتوى السابق (يتم تخزينه في قاعدة البيانات)
const previousHash = config.previousHash || null;
const hasChanged = previousHash && previousHash !== currentContent.hash;

return {
  hasChanged,
  currentHash: currentContent.hash,
  timestamp: new Date().toISOString(),
  content: hasChanged ? currentContent.text : null
};`,
    createdAt: new Date()
  },
  {
    id: 'tpl-8',
    name: 'ملء نماذج تلقائية',
    description: 'ملء نماذج معقدة بشكل آلي',
    type: 'custom',
    status: 'idle',
    targetUrl: 'https://form-website.com',
    script: `// ملء النموذج التلقائي
await page.goto(targetUrl);
await page.waitForSelector('form');

// بيانات النموذج
const formData = {
  firstName: 'أحمد',
  lastName: 'محمد',
  email: 'ahmad@example.com',
  phone: '0501234567',
  country: 'السعودية',
  message: 'رسالة تجريبية'
};

// ملء الحقول
for (const [field, value] of Object.entries(formData)) {
  const selectors = [
    \`#\${field}\`,
    \`[name="\${field}"]\`,
    \`[id*="\${field}"]\`,
    \`[name*="\${field}"]\`
  ];
  
  for (const selector of selectors) {
    try {
      if (await page.isVisible(selector)) {
        await page.fill(selector, value);
        break;
      }
    } catch {}
  }
}

// إرسال النموذج
await page.click('button[type="submit"]');
await page.waitForTimeout(2000);

return { success: true, submitted: true };`,
    createdAt: new Date()
  }
];

export function ScriptLibrary({ onSelectTemplate }: ScriptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.includes(searchQuery) || 
                         template.description.includes(searchQuery);
    const matchesType = selectedType === 'all' || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl mb-6">مكتبة القوالب الجاهزة</h2>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="البحث في القوالب..."
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="scraping">جمع بيانات</option>
            <option value="login">تسجيل دخول</option>
            <option value="registration">إنشاء حساب</option>
            <option value="testing">اختبار</option>
            <option value="screenshot">لقطة شاشة</option>
            <option value="custom">مخصص</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="flex-1">{template.name}</h3>
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-sm text-slate-600 mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {getTypeLabel(template.type)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(template.script);
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="نسخ الكود"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            لم يتم العثور على قوالب مطابقة
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    scraping: 'جمع بيانات',
    login: 'تسجيل دخول',
    registration: 'إنشاء حساب',
    testing: 'اختبار',
    screenshot: 'لقطة شاشة',
    custom: 'مخصص'
  };
  return labels[type] || type;
}
