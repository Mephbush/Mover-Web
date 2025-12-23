import type { Task } from '../types';
import { useState } from 'react';
import { 
  Globe, 
  LogIn, 
  UserPlus, 
  Camera, 
  Download, 
  Search,
  MessageSquare,
  Heart,
  Share2,
  ShoppingCart,
  FileText,
  Play,
  Sparkles,
  Zap
} from 'lucide-react';

type QuickActionsProps = {
  onTaskCreated: (task: Task) => void;
};

type QuickAction = {
  id: string;
  icon: any;
  title: string;
  description: string;
  color: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'url' | 'select' | 'textarea';
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }>;
  taskType: Task['type'];
  generateScript: (data: any) => string;
};

const quickActions: QuickAction[] = [
  {
    id: 'scrape-products',
    icon: ShoppingCart,
    title: 'جمع معلومات المنتجات',
    description: 'استخراج الأسعار والمنتجات من أي متجر',
    color: 'blue',
    taskType: 'scraping',
    fields: [
      { name: 'url', label: 'رابط المتجر', type: 'url', placeholder: 'https://store.com/products', required: true },
      { name: 'selector', label: 'محدد المنتج (اختياري)', type: 'text', placeholder: '.product-item' }
    ],
    generateScript: (data) => `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    await page.waitForSelector('${data.selector || '.product'}');
    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('${data.selector || '.product'}');
      return Array.from(items).map(item => ({
        title: item.querySelector('h2, h3, .title, .product-name')?.textContent?.trim(),
        price: item.querySelector('.price, .product-price')?.textContent?.trim(),
        image: item.querySelector('img')?.src
      }));
    });
    return products;
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`
  },
  {
    id: 'auto-login',
    icon: LogIn,
    title: 'تسجيل دخول تلقائي',
    description: 'دخول آلي لأي منصة بضغطة واحدة',
    color: 'green',
    taskType: 'login',
    fields: [
      { name: 'url', label: 'رابط صفحة الدخول', type: 'url', required: true },
      { name: 'emailSelector', label: 'محدد البريد', type: 'text', placeholder: '#email' },
      { name: 'passwordSelector', label: 'محدد كلمة المرور', type: 'text', placeholder: '#password' },
      { name: 'submitSelector', label: 'محدد زر الدخول', type: 'text', placeholder: 'button[type=\"submit\"]' }
    ],
    generateScript: (data) => `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    await page.fill('${data.emailSelector || '#email, input[type=\"email\"]'}', credentials.email);
    await page.fill('${data.passwordSelector || '#password, input[type=\"password\"]'}', credentials.password);
    await page.click('${data.submitSelector || 'button[type=\"submit\"]'}');
    await page.waitForNavigation();
    return { success: true };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`
  },
  {
    id: 'screenshot',
    icon: Camera,
    title: 'التقاط صورة للموقع',
    description: 'لقطة شاشة كاملة أو لعنصر معين',
    color: 'purple',
    taskType: 'screenshot',
    fields: [
      { name: 'url', label: 'رابط الموقع', type: 'url', required: true },
      { name: 'type', label: 'نوع اللقطة', type: 'select', options: ['صفحة كاملة', 'الشاشة المرئية', 'عنصر محدد'], required: true },
      { name: 'selector', label: 'محدد العنصر (إن وجد)', type: 'text', placeholder: '.main-content' }
    ],
    generateScript: (data) => {
      if (data.type === 'عنصر محدد' && data.selector) {
        return `await page.goto('${data.url}');
await page.waitForSelector('${data.selector}');
const element = await page.locator('${data.selector}');
return await element.screenshot();`;
      } else if (data.type === 'صفحة كاملة') {
        return `await page.goto('${data.url}');
await page.waitForLoadState('networkidle');
return await page.screenshot({ fullPage: true });`;
      } else {
        return `await page.goto('${data.url}');
await page.waitForLoadState('networkidle');
return await page.screenshot();`;
      }
    }
  },
  {
    id: 'signup',
    icon: UserPlus,
    title: 'إنشاء حساب',
    description: 'تسجيل تلقائي في أي منصة',
    color: 'orange',
    taskType: 'registration',
    fields: [
      { name: 'url', label: 'رابط صفحة التسجيل', type: 'url', required: true }
    ],
    generateScript: (data) => `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    const fields = {
      name: ['#name', '#fullname', 'input[name="name"]'],
      email: ['#email', 'input[type="email"]', 'input[name="email"]'],
      password: ['#password', 'input[type="password"]', 'input[name="password"]']
    };
    
    for (const [field, selectors] of Object.entries(fields)) {
      for (const selector of selectors) {
        if (await page.isVisible(selector)) {
          await page.fill(selector, credentials[field]);
          break;
        }
      }
    }
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    return { success: true };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`
  },
  {
    id: 'social-media',
    icon: Heart,
    title: 'تفاعل مع منشورات',
    description: 'إعجاب، متابعة، أو مشاركة تلقائية',
    color: 'pink',
    taskType: 'custom',
    fields: [
      { name: 'url', label: 'رابط الصفحة/البروفايل', type: 'url', required: true },
      { name: 'action', label: 'الإجراء', type: 'select', options: ['إعجاب', 'متابعة', 'مشاركة', 'تعليق'], required: true },
      { name: 'comment', label: 'نص التعليق (إن وجد)', type: 'textarea', placeholder: 'محتوى رائع!' }
    ],
    generateScript: (data) => {
      const actions: any = {
        'إعجاب': `    await page.click('button[aria-label*="like"], .like-button, [data-action="like"]');`,
        'متابعة': `    await page.click('button[aria-label*="follow"], .follow-button, [data-action="follow"]');`,
        'مشاركة': `    await page.click('button[aria-label*="share"], .share-button, [data-action="share"]');`,
        'تعليق': `    await page.click('.comment-button');\n    await page.fill('textarea, .comment-input', '${data.comment || 'رائع!'}');\n    await page.click('.submit-comment');`
      };
      return `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    await page.waitForLoadState('networkidle');
${actions[data.action] || ''}
    return { success: true };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`;
    }
  },
  {
    id: 'download-files',
    icon: Download,
    title: 'تحميل ملفات',
    description: 'تحميل المستندات والصور تلقائياً',
    color: 'cyan',
    taskType: 'custom',
    fields: [
      { name: 'url', label: 'رابط الصفحة', type: 'url', required: true },
      { name: 'fileType', label: 'نوع الملفات', type: 'select', options: ['صور', 'PDF', 'مستندات', 'الكل'], required: true }
    ],
    generateScript: (data) => {
      const extensions: any = {
        'صور': '.jpg, .png, .jpeg, .gif, .webp',
        'PDF': '.pdf',
        'مستندات': '.doc, .docx, .txt, .xlsx',
        'الكل': ''
      };
      return `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    const links = await page.evaluate(() => {
      const extensions = '${extensions[data.fileType] || ''}';
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => !extensions || extensions.split(',').some(ext => href.includes(ext.trim())));
    });
    return { files: links, count: links.length };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`;
    }
  },
  {
    id: 'search-extract',
    icon: Search,
    title: 'بحث واستخراج',
    description: 'البحث في موقع واستخراج النتائج',
    color: 'indigo',
    taskType: 'scraping',
    fields: [
      { name: 'url', label: 'رابط صفحة البحث', type: 'url', required: true },
      { name: 'searchQuery', label: 'كلمة البحث', type: 'text', required: true },
      { name: 'searchSelector', label: 'محدد خانة البحث', type: 'text', placeholder: '#search' }
    ],
    generateScript: (data) => `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    await page.fill('${data.searchSelector || 'input[type="search"], #search'}', '${data.searchQuery}');
    await page.press('${data.searchSelector || 'input[type="search"]'}', 'Enter');
    await page.waitForLoadState('networkidle');
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result, .search-result')).map(r => ({
        title: r.querySelector('h2, h3, .title')?.textContent?.trim(),
        link: r.querySelector('a')?.href,
        description: r.querySelector('p, .description')?.textContent?.trim()
      }));
    });
    return results;
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`
  },
  {
    id: 'form-fill',
    icon: FileText,
    title: 'ملء نموذج',
    description: 'ملء استمارات ونماذج تلقائياً',
    color: 'teal',
    taskType: 'custom',
    fields: [
      { name: 'url', label: 'رابط الصفحة', type: 'url', required: true },
      { name: 'formData', label: 'البيانات (JSON)', type: 'textarea', placeholder: '{"name": "أحمد", "email": "ahmad@example.com"}' }
    ],
    generateScript: (data) => `async function runTask(page) {
  try {
    await page.goto('${data.url}');
    const formData = ${data.formData || '{}'};
    for (const [field, value] of Object.entries(formData)) {
      const selectors = [\`#\${field}\`, \`[name="\${field}"]\`];
      for (const sel of selectors) {
        if (await page.isVisible(sel)) {
          await page.fill(sel, String(value));
          break;
        }
      }
    }
    await page.click('button[type="submit"]');
    return { success: true };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}`
  }
];

export function QuickActions({ onTaskCreated }: QuickActionsProps) {
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [step, setStep] = useState<'select' | 'configure' | 'confirm'>('select');

  const handleActionSelect = (action: QuickAction) => {
    setSelectedAction(action);
    setFormData({});
    setStep('configure');
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleNext = () => {
    setStep('confirm');
  };

  const handleExecute = (executeNow: boolean) => {
    if (!selectedAction) return;

    const task: Task = {
      id: Date.now().toString(),
      name: selectedAction.title,
      description: selectedAction.description,
      type: selectedAction.taskType,
      status: executeNow ? 'running' : 'idle',
      script: selectedAction.generateScript(formData),
      targetUrl: formData.url || '',
      createdAt: new Date()
    };

    onTaskCreated(task);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {step === 'select' && (
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl">إجراءات سريعة</h1>
                <p className="text-slate-600">إنشاء وتنفيذ مهمة بضغطات قليلة</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionSelect(action)}
                className="text-right p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <h3 className="text-lg mb-2">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'configure' && selectedAction && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 bg-${selectedAction.color}-100 rounded-lg flex items-center justify-center`}>
                <selectedAction.icon className={`w-6 h-6 text-${selectedAction.color}-600`} />
              </div>
              <div>
                <h2 className="text-xl">{selectedAction.title}</h2>
                <p className="text-sm text-slate-600">{selectedAction.description}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {selectedAction.fields.map((field) => (
                <div key={field.name}>
                  <label className="block mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    >
                      <option value="">اختر...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={() => setStep('select')}
                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                رجوع
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && selectedAction && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-xl">المهمة جاهزة للتنفيذ!</h2>
                <p className="text-sm text-slate-600">راجع التفاصيل واختر طريقة التنفيذ</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm mb-2">نوع المهمة</h3>
                <p>{selectedAction.title}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm mb-2">التفاصيل</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-slate-600">{key}:</span>
                      <span className="flex-1">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm mb-2">السكريبت المُنشأ</h3>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto" dir="ltr">
                  {selectedAction.generateScript(formData)}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleExecute(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
              >
                <Play className="w-5 h-5" />
                <span className="text-lg">تنفيذ الآن</span>
              </button>

              <button
                onClick={() => handleExecute(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                حف للتنفيذ لاحقاً
              </button>

              <button
                onClick={() => setStep('configure')}
                className="w-full px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                تعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
