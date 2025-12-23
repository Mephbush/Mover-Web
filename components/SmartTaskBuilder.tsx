import { useState } from 'react';
import { Sparkles, Search, Filter, Grid, List, ChevronRight, Check, X, Settings, Zap } from 'lucide-react';
import { platformTemplates, getPlatformTemplate, getTemplatesByCategory, searchTemplates, PlatformTemplate } from '../utils/platform-templates';
import { advancedTemplates, getTemplatesByCategory as getAdvancedByCategory, searchAdvancedTemplates, AdvancedTaskTemplate, categoryLabels } from '../utils/advanced-task-templates';
import { tempMailService } from '../utils/temp-mail-service';
import { aiDecisionEngine } from '../utils/ai-decision-engine';
import { toast } from 'sonner';

interface SmartTaskBuilderProps {
  onTaskCreated: (task: any) => void;
  taskToEdit?: any; // إضافة دعم تحديث المهمة
  onTaskUpdated?: (task: any) => void; // callback لتحديث المهمة
}

export function SmartTaskBuilder({ onTaskCreated, taskToEdit, onTaskUpdated }: SmartTaskBuilderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PlatformTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [generatingTask, setGeneratingTask] = useState(false);

  const categories = [
    { id: 'all', name: 'الكل', icon: '🌐', color: 'bg-gray-100 text-gray-700' },
    { id: 'social', name: 'تواصل اجتماعي', icon: '👥', color: 'bg-blue-100 text-blue-700' },
    { id: 'email', name: 'بريد إلكتروني', icon: '📧', color: 'bg-green-100 text-green-700' },
    { id: 'commerce', name: 'تجارة إلكترونية', icon: '🛒', color: 'bg-purple-100 text-purple-700' },
    { id: 'cloud', name: 'خدمات سحابية', icon: '☁️', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'dev', name: 'تطوير', icon: '💻', color: 'bg-orange-100 text-orange-700' },
    { id: 'other', name: 'أخرى', icon: '📦', color: 'bg-slate-100 text-slate-700' }
  ];

  const filteredTemplates = () => {
    let templates = platformTemplates;

    // تصفية حسب الفئة
    if (selectedCategory && selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory);
    }

    // تصفية حسب البحث
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  };

  const handleTemplateSelect = (template: PlatformTemplate) => {
    setSelectedTemplate(template);
  };

  const generateSmartTask = async () => {
    if (!selectedTemplate) return;

    setGeneratingTask(true);
    try {
      // إنشاء المهمة الذكية
      const task = {
        id: `task-${Date.now()}`,
        name: `إنشاء حساب ${selectedTemplate.name}`,
        description: selectedTemplate.description,
        type: 'signup',
        targetUrl: `https://${selectedTemplate.platform}`,
        platform: selectedTemplate.id,
        template: selectedTemplate,
        needsEmail: selectedTemplate.requirements.email,
        needsPhone: selectedTemplate.requirements.phone,
        needsVerification: selectedTemplate.requirements.verification,
        aiEnabled: true,
        stealthMode: true,
        status: 'idle',
        createdAt: new Date(),
        script: generateTaskScript(selectedTemplate)
      };

      onTaskCreated(task);
      toast.success(`تم إنشاء مهمة ${selectedTemplate.name} بنجاح!`);
    } catch (error: any) {
      toast.error('فشل إنشاء المهمة: ' + error.message);
    } finally {
      setGeneratingTask(false);
    }
  };

  const generateTaskScript = (template: PlatformTemplate): string => {
    return `
/**
 * مهمة ذكية: ${template.name}
 * المنصة: ${template.platform}
 * تم الإنشاء: ${new Date().toISOString()}
 */

async function runTask(page) {
  const context = {
    tempEmail: null,
    verificationCode: null,
    password: null,
    userData: {}
  };

  try {
    ${template.requirements.email ? `
    // إنشاء بريد إلكتروني مؤقت
    console.log('📧 إنشاء بريد إلكتروني مؤقت...');
    const { tempMailService } = await import('./utils/temp-mail-service');
    const emailData = await tempMailService.createTempEmail();
    context.tempEmail = emailData.address;
    console.log('✓ تم إنشاء البريد:', context.tempEmail);
    ` : ''}

    // وظائف توليد البيانات
    const generateRandomName = (type) => {
      const firstNames = ['أحمد', 'محمد', 'علي', 'فاطمة', 'سارة'];
      const lastNames = ['العلي', 'الأحمد', 'السعيد', 'الكريم'];
      return type === 'first' ? firstNames[Math.floor(Math.random() * firstNames.length)] : lastNames[Math.floor(Math.random() * lastNames.length)];
    };
    
    const generateRandomUsername = () => {
      return 'user' + Math.random().toString(36).substring(2, 10);
    };
    
    const generateStrongPassword = () => {
      return 'Pass' + Math.random().toString(36).substring(2, 10) + '123!';
    };
    
    const generateRandomBirthday = (minAge = 18, maxAge = 65) => {
      const year = new Date().getFullYear() - Math.floor(Math.random() * (maxAge - minAge) + minAge);
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      return { year, month, day };
    };

    context.generateName = () => ({
      first: generateRandomName('first'),
      last: generateRandomName('last')
    });
    context.generateFullName = () => {
      const name = context.generateName();
      return \`\${name.first} \${name.last}\`;
    };
    context.generateUsername = generateRandomUsername;
    context.generatePassword = () => {
      context.password = generateStrongPassword();
      return context.password;
    };
    context.generateBirthday = generateRandomBirthday;

    // تنفيذ الخطوات
    ${template.steps.map((step, index) => `
    // الخطوة ${index + 1}: ${step.name}
    console.log('⏳ ${step.name}...');
    await executeStep_${step.id}(page, context);
    console.log('✓ ${step.name} - تم');
    `).join('\n')}

    console.log('✅ اكتملت المهمة بنجاح!');
    return { success: true, context };
    
  } catch (error) {
    console.error('❌ خطأ في المهمة:', error);
    
    // محاولة تحليل الخطأ واتخاذ قرار
    try {
      const pageContent = await page.content();
      const { aiDecisionEngine } = await import('./utils/ai-decision-engine');
      const decision = await aiDecisionEngine.handleError(error.message, {
        url: page.url(),
        title: await page.title(),
        content: pageContent
      });
      
      console.log('🤔 قرار AI:', decision);
    } catch (aiError) {
      console.warn('ت��ذر الحصول على قرار AI:', aiError);
    }
    
    throw error;
  } finally {
    // تنظيف
    ${template.requirements.email ? `
    if (context.tempEmail) {
      try {
        const { tempMailService } = await import('./utils/temp-mail-service');
        await tempMailService.deleteTempEmail();
      } catch (e) {
        console.warn('تعذر حذف البريد المؤقت:', e);
      }
    }
    ` : ''}
  }
}

${generateStepFunctions(template)}

export default runTask;
`;
  };

  const generateStepFunctions = (template: PlatformTemplate): string => {
    return template.steps.map(step => {
      let code = '';
      
      switch (step.type) {
        case 'navigate':
          code = `
async function executeStep_${step.id}(page, context) {
  const url = ${typeof step.value === 'string' ? `'${step.value}'` : 'context.generateValue()'};
  await page.goto(url, { waitUntil: 'networkidle0' });
  ${step.waitFor ? `await page.waitForSelector('${step.waitFor}', { timeout: 10000 });` : ''}
}`;
          break;

        case 'fill':
          code = `
async function executeStep_${step.id}(page, context) {
  const selector = '${step.selector}';
  const value = ${typeof step.value === 'string' ? `'${step.value}'` : `context.${step.value.name}()`};
  
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.type(selector, value, { delay: 100 });
  await page.waitForTimeout(500);
}`;
          break;

        case 'click':
          code = `
async function executeStep_${step.id}(page, context) {
  const selector = '${step.selector}';
  
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.click(selector);
  ${step.waitFor ? `await page.waitForSelector('${step.waitFor}', { timeout: 10000 });` : 'await page.waitForTimeout(1000);'}
}`;
          break;

        case 'verify':
          code = `
async function executeStep_${step.id}(page, context) {
  console.log('⏳ انتظار كود التحقق من البريد الإلكتروني...');
  
  try {
    const code = await tempMailService.waitForVerificationCode(60);
    context.verificationCode = code;
    console.log('✓ تم استلام الكود:', code);
  } catch (error) {
    console.error('❌ فشل استلام كود التحقق');
    throw error;
  }
}`;
          break;

        case 'custom':
          code = `
async function executeStep_${step.id}(page, context) {
  // منطق مخصص للخطوة: ${step.name}
  console.log('تنفيذ خطوة مخصصة: ${step.name}');
  
  ${step.value === 'solve_github_puzzle' ? `
  // حل لغز GitHub
  await page.waitForSelector('.js-octocaptcha-frame', { timeout: 5000 }).catch(() => {});
  // يمكن إضافة منطق حل اللغز هنا
  ` : ''}
  
  await page.waitForTimeout(1000);
}`;
          break;

        case 'wait':
          code = `
async function executeStep_${step.id}(page, context) {
  await page.waitForTimeout(${step.value || 1000});
}`;
          break;

        default:
          code = `
async function executeStep_${step.id}(page, context) {
  console.log('تنفيذ: ${step.name}');
}`;
      }

      return code;
    }).join('\n\n');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">منشئ المهام الذكي</h2>
              <p className="text-sm text-slate-600">اختر قالب جاهز لإنشاء حساب على أي منصة</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن منصة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  (selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                    ? category.color
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTemplate ? (
            // Template Details
            <div className="space-y-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>العودة للقوالب</span>
              </button>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-6xl">{selectedTemplate.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h3>
                    <p className="text-slate-600 mb-4">{selectedTemplate.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white rounded-full text-sm">
                        🌐 {selectedTemplate.platform}
                      </span>
                      {selectedTemplate.requirements.email && (
                        <span className="px-3 py-1 bg-white rounded-full text-sm">
                          📧 يتطلب بريد إلكتروني
                        </span>
                      )}
                      {selectedTemplate.requirements.phone && (
                        <span className="px-3 py-1 bg-white rounded-full text-sm">
                          📱 يتطلب رقم هاتف
                        </span>
                      )}
                      {selectedTemplate.requirements.verification && (
                        <span className="px-3 py-1 bg-white rounded-full text-sm">
                          ✅ يتطلب تحقق {selectedTemplate.requirements.verification}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                    {selectedTemplate.steps.length}
                  </span>
                  خطوات المهمة
                </h4>

                <div className="space-y-3">
                  {selectedTemplate.steps.map((step, index) => (
                    <div key={step.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="px-2 py-1 bg-white rounded text-xs">
                          {step.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={generateSmartTask}
                  disabled={generatingTask}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {generatingTask ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>إنشاء المهمة الذكية</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            // Templates Grid/List View
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {filteredTemplates().map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`${
                    viewMode === 'grid'
                      ? 'p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left'
                      : 'w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4'
                  }`}
                >
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded">{template.category}</span>
                      <span>•</span>
                      <span>{template.steps.length} خطوات</span>
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredTemplates().length === 0 && !selectedTemplate && (
            <div className="text-center py-12 text-slate-500">
              <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا توجد قوالب مطابقة</p>
              <p className="text-sm">جرب تغيير معايير البحث أو الفئة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}