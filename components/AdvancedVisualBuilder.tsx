import { Task } from '../App';
import { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Save, Play, Copy, AlertTriangle, CheckCircle, Zap, GitBranch } from 'lucide-react';
import { SmartAction, SmartTaskTemplates } from '../utils/smart-task-executor';

type AdvancedVisualBuilderProps = {
  onTaskCreated: (task: Task) => void;
  taskToEdit?: Task; // إضافة دعم تحديث المهمة
  onTaskUpdated?: (task: Task) => void; // callback لتحديث المهمة
};

type ActionStep = {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'wait' | 'extract' | 'screenshot' | 'scroll' | 'video' | 'fillForm' | 'aiStep';
  params: any;
  fallbacks: any[];
  conditions: any[];
  errorHandling: {
    ignoreErrors: boolean;
    retryCount: number;
  };
};

const actionTypes = [
  { value: 'navigate', label: 'فتح صفحة', icon: '🌐', color: 'bg-blue-100 text-blue-700' },
  { value: 'click', label: 'نقر على عنصر', icon: '👆', color: 'bg-green-100 text-green-700' },
  { value: 'type', label: 'كتابة نص', icon: '⌨️', color: 'bg-purple-100 text-purple-700' },
  { value: 'wait', label: 'انتظار', icon: '⏱️', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'extract', label: 'استخراج بيانات', icon: '📊', color: 'bg-pink-100 text-pink-700' },
  { value: 'screenshot', label: 'التقاط صورة', icon: '📸', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'scroll', label: 'تمرير الصفحة', icon: '⬇️', color: 'bg-orange-100 text-orange-700' },
  { value: 'video', label: 'تسجيل فيديو', icon: '🎥', color: 'bg-red-100 text-red-700' },
  { value: 'fillForm', label: 'ملء نموذج', icon: '📝', color: 'bg-teal-100 text-teal-700' },
  { value: 'aiStep', label: 'خطوة ذكية AI', icon: '🤖', color: 'bg-violet-100 text-violet-700' }
];

const templates = [
  { id: 'login', name: 'تسجيل دخول', icon: '🔐', description: 'قالب جاهز لتسجيل الدخول' },
  { id: 'scraping', name: 'جمع بيانات', icon: '📊', description: 'قالب لجمع البيانات من صفحة' },
  { id: 'testing', name: 'اختبار صفحة', icon: '🧪', description: 'قالب لاختبار عناصر الصفحة' }
];

export function AdvancedVisualBuilder({ onTaskCreated, taskToEdit, onTaskUpdated }: AdvancedVisualBuilderProps) {
  const [taskName, setTaskName] = useState(taskToEdit?.name || '');
  const [taskDescription, setTaskDescription] = useState(taskToEdit?.description || '');
  const [steps, setSteps] = useState<ActionStep[]>(taskToEdit?.script ? parseScript(taskToEdit.script) : []);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const addStep = (type: ActionStep['type']) => {
    const newStep: ActionStep = {
      id: Date.now().toString(),
      type,
      params: getDefaultParams(type),
      fallbacks: [],
      conditions: [],
      errorHandling: {
        ignoreErrors: false,
        retryCount: 3
      }
    };
    setSteps([...steps, newStep]);
    setSelectedStep(newStep.id);
  };

  const updateStep = (id: string, updates: Partial<ActionStep>) => {
    setSteps(steps.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
    if (selectedStep === id) {
      setSelectedStep(null);
    }
  };

  const duplicateStep = (id: string) => {
    const step = steps.find(s => s.id === id);
    if (step) {
      const newStep = {
        ...step,
        id: Date.now().toString()
      };
      setSteps([...steps, newStep]);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const addFallback = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      const newFallback = { ...getDefaultParams(step.type) };
      updateStep(stepId, {
        fallbacks: [...step.fallbacks, newFallback]
      });
    }
  };

  const updateFallback = (stepId: string, fallbackIndex: number, params: any) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      const newFallbacks = [...step.fallbacks];
      newFallbacks[fallbackIndex] = params;
      updateStep(stepId, { fallbacks: newFallbacks });
    }
  };

  const removeFallback = (stepId: string, fallbackIndex: number) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      updateStep(stepId, {
        fallbacks: step.fallbacks.filter((_, i) => i !== fallbackIndex)
      });
    }
  };

  const applyTemplate = (templateId: string) => {
    // تطبيق القوالب الجاهزة
    let newSteps: ActionStep[] = [];

    switch (templateId) {
      case 'login':
        newSteps = [
          {
            id: '1',
            type: 'navigate',
            params: { url: 'https://example.com/login' },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 3 }
          },
          {
            id: '2',
            type: 'type',
            params: { selector: '#username', text: '' },
            fallbacks: [
              { selector: '#email' },
              { selector: 'input[type="email"]' }
            ],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 2 }
          },
          {
            id: '3',
            type: 'type',
            params: { selector: '#password', text: '' },
            fallbacks: [
              { selector: 'input[type="password"]' }
            ],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 2 }
          },
          {
            id: '4',
            type: 'click',
            params: { selector: 'button[type="submit"]' },
            fallbacks: [
              { selector: 'button:has-text("Login")' },
              { selector: 'button:has-text("Sign In")' }
            ],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 2 }
          }
        ];
        setTaskName('تسجيل دخول');
        setTaskDescription('مهمة تسجيل دخول مع selectors بديلة');
        break;

      case 'scraping':
        newSteps = [
          {
            id: '1',
            type: 'navigate',
            params: { url: 'https://example.com' },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 3 }
          },
          {
            id: '2',
            type: 'wait',
            params: { type: 'selector', selector: '.content' },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 2 }
          },
          {
            id: '3',
            type: 'extract',
            params: { selector: '.item' },
            fallbacks: [
              { selector: '[data-item]' },
              { selector: 'article' }
            ],
            conditions: [],
            errorHandling: { ignoreErrors: true, retryCount: 1 }
          },
          {
            id: '4',
            type: 'screenshot',
            params: { fullPage: true },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: true, retryCount: 1 }
          }
        ];
        setTaskName('جمع بيانات');
        setTaskDescription('مهمة لجمع البيانات من صفحة ويب');
        break;

      case 'testing':
        newSteps = [
          {
            id: '1',
            type: 'navigate',
            params: { url: 'https://example.com' },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 3 }
          },
          {
            id: '2',
            type: 'wait',
            params: { type: 'selector', selector: 'header' },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 2 }
          },
          {
            id: '3',
            type: 'screenshot',
            params: { fullPage: true },
            fallbacks: [],
            conditions: [],
            errorHandling: { ignoreErrors: false, retryCount: 1 }
          }
        ];
        setTaskName('اختبار صفحة');
        setTaskDescription('مهمة لاختبار تحميل عناصر الصفحة');
        break;
    }

    setSteps(newSteps);
    setShowTemplates(false);
  };

  const generateScript = () => {
    let script = 'async function runTask(page) {\n';
    script += '  try {\n';
    
    steps.forEach((step, index) => {
      script += `    // Step ${index + 1}: ${actionTypes.find(a => a.value === step.type)?.label}\n`;
      
      // إضافة retry logic إذا كان مفعل
      if (step.errorHandling.retryCount > 0) {
        // استخدام اسم متغير فريد لكل خطوة لتجنب خطأ "Identifier 'retries' has already been declared"
        script += `    let retries_step${index + 1} = ${step.errorHandling.retryCount};\n`;
        script += `    while (retries_step${index + 1} > 0) {\n`;
        script += `      try {\n`;
        script += `        ${generateStepCode(step).split('\n').join('\n        ')}`;
        script += `        break;\n`;
        script += `      } catch (stepError) {\n`;
        script += `        retries_step${index + 1}--;\n`;
        script += `        if (retries_step${index + 1} === 0) {\n`;
        if (step.errorHandling.ignoreErrors) {
          script += `          console.warn('⚠️ تخطي الخطأ:', stepError.message);\n`;
        } else {
          script += `          throw stepError;\n`;
        }
        script += `        }\n`;
        script += `        await page.waitForTimeout(1000);\n`;
        script += `      }\n`;
        script += `    }\n`;
      } else {
        const stepCode = generateStepCode(step);
        script += `    ${stepCode.split('\n').join('\n    ')}`;
      }
      
      script += '\n';
    });
    
    script += '    console.log("✅ اكتملت المهمة بنجاح");\n';
    script += '    return { success: true };\n';
    script += '  } catch (error) {\n';
    script += '    console.error("❌ خطأ:", error.message);\n';
    script += '    return { success: false, error: error.message };\n';
    script += '  }\n';
    script += '}\n';
    
    return script;
  };

  const generateStepCode = (step: ActionStep): string => {
    switch (step.type) {
      case 'navigate':
        return `await page.goto('${step.params.url}');\n`;
      case 'click':
        return `await page.click('${step.params.selector}');\n`;
      case 'type':
        return `await page.fill('${step.params.selector}', '${step.params.text}');\n`;
      case 'wait':
        if (step.params.type === 'time') {
          return `await page.waitForTimeout(${step.params.duration});\n`;
        } else {
          return `await page.waitForSelector('${step.params.selector}');\n`;
        }
      case 'extract':
        return `const data = await page.$$eval('${step.params.selector}', els => els.map(el => el.textContent));\n`;
      case 'screenshot':
        return `await page.screenshot({ ${step.params.fullPage ? 'fullPage: true' : ''} });\n`;
      case 'scroll':
        return `await page.evaluate(() => window.scrollTo(0, ${step.params.position || 'document.body.scrollHeight'}));\n`;
      case 'video':
        return `await page.evaluate(() => { /* كود تسجيل الفيديو هنا */ });\n`;
      case 'fillForm':
        return `await page.fill('${step.params.selector}', '${step.params.text}');\n`;
      case 'aiStep':
        return `await page.evaluate(() => { /* كود خطوة ذكية AI هنا */ });\n`;
      default:
        return '';
    }
  };

  const handleSave = () => {
    const task: Task = {
      id: Date.now().toString(),
      name: taskName || 'مهمة مرئية متقدمة',
      description: taskDescription || 'مهمة تم إنشاؤها بالمنشئ المرئي المتقدم',
      type: 'custom',
      status: 'idle',
      script: generateScript(),
      targetUrl: steps.find(s => s.type === 'navigate')?.params.url || '',
      createdAt: new Date()
    };
    onTaskCreated(task);
  };

  const handleUpdate = () => {
    if (!taskToEdit) return;
    const updatedTask: Task = {
      ...taskToEdit,
      name: taskName || 'مهمة مرئية متقدمة',
      description: taskDescription || 'مهمة تم إنشاؤها بالمنشئ المرئي المتقدم',
      type: 'custom',
      status: 'idle',
      script: generateScript(),
      targetUrl: steps.find(s => s.type === 'navigate')?.params.url || '',
      createdAt: new Date()
    };
    onTaskUpdated?.(updatedTask);
  };

  const selectedStepData = steps.find(s => s.id === selectedStep);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
            🎨
          </div>
          <div>
            <h1 className="text-2xl">المنشئ المرئي المتقدم</h1>
            <p className="text-slate-600">بناء مهام ذكية مع دعم fallbacks ومعالجة الأخطاء</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            <span>قوالب جاهزة</span>
          </button>
          
          <button
            onClick={taskToEdit ? handleUpdate : handleSave}
            disabled={steps.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{taskToEdit ? 'تحديث المهمة' : 'حفظ المهمة'}</span>
          </button>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl mb-4">اختر قالباً جاهزاً</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="p-4 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
                >
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <div className="font-medium mb-1">{template.name}</div>
                  <div className="text-sm text-slate-600">{template.description}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="w-full px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Task Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">اسم المهمة</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="مثال: جمع بيانات المنتجات"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">الوصف</label>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="وصف مختصر للمهمة"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Actions Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="mb-4 font-medium">أضف خطوة</h3>
          <div className="space-y-2">
            {actionTypes.map(action => (
              <button
                key={action.value}
                onClick={() => addStep(action.value as any)}
                className={`w-full text-right p-3 rounded-lg ${action.color} hover:shadow-md transition-all flex items-center gap-3`}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="flex-1">{action.label}</span>
                <Plus className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Steps List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">الخطوات ({steps.length})</h3>
            {steps.length > 0 && (
              <button
                onClick={() => setSteps([])}
                className="text-sm text-red-600 hover:underline"
              >
                مسح الكل
              </button>
            )}
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد خطوات بعد</p>
              <p className="text-sm mt-1">ابدأ بإضافة خطوات من اللوحة اليمنى</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {steps.map((step, index) => {
                const actionType = actionTypes.find(a => a.value === step.type);
                return (
                  <div
                    key={step.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedStep === step.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        onClick={() => setSelectedStep(step.id)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{actionType?.icon}</span>
                          <span className="font-medium">{actionType?.label}</span>
                          {step.fallbacks.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              {step.fallbacks.length} بديل
                            </span>
                          )}
                          {!step.errorHandling.ignoreErrors && (
                            <Zap className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {getStepSummary(step)}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => duplicateStep(step.id)}
                          className="p-2 hover:bg-slate-100 rounded"
                        >
                          <Copy className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="p-2 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Editor */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="mb-4 font-medium">تفاصيل الخطوة</h3>

          {selectedStepData ? (
            <div className="space-y-4">
              {/* Main Params */}
              <div>
                <label className="block mb-2 text-sm font-medium">الإعدادات الأساسية</label>
                {renderStepParams(selectedStepData, (params) => {
                  updateStep(selectedStepData.id, { params });
                })}
              </div>

              {/* Fallbacks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">بدائل (Fallbacks)</label>
                  <button
                    onClick={() => addFallback(selectedStepData.id)}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    + إضافة بديل
                  </button>
                </div>
                {selectedStepData.fallbacks.map((fallback, index) => (
                  <div key={index} className="mb-2 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600">بديل {index + 1}</span>
                      <button
                        onClick={() => removeFallback(selectedStepData.id, index)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {renderStepParams(
                      { ...selectedStepData, params: fallback },
                      (params) => updateFallback(selectedStepData.id, index, params)
                    )}
                  </div>
                ))}
              </div>

              {/* Error Handling */}
              <div>
                <label className="block mb-2 text-sm font-medium">معالجة الأخطاء</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStepData.errorHandling.ignoreErrors}
                      onChange={(e) => updateStep(selectedStepData.id, {
                        errorHandling: {
                          ...selectedStepData.errorHandling,
                          ignoreErrors: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">تجاهل الأخطاء</span>
                  </label>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">عدد المحاولات</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={selectedStepData.errorHandling.retryCount}
                      onChange={(e) => updateStep(selectedStepData.id, {
                        errorHandling: {
                          ...selectedStepData.errorHandling,
                          retryCount: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-1 text-sm border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>اختر خطوة لتعديلها</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Script Preview */}
      {steps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="mb-4 font-medium">الكود المُنتَج</h3>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {generateScript()}
          </pre>
        </div>
      )}
    </div>
  );
}

function getDefaultParams(type: string): any {
  switch (type) {
    case 'navigate':
      return { url: '' };
    case 'click':
      return { selector: '' };
    case 'type':
      return { selector: '', text: '' };
    case 'wait':
      return { type: 'time', duration: 1000 };
    case 'extract':
      return { selector: '' };
    case 'screenshot':
      return { fullPage: false };
    case 'scroll':
      return { position: 'end' };
    case 'video':
      return { duration: 30000 };
    case 'fillForm':
      return { selector: '', text: '' };
    case 'aiStep':
      return { prompt: '' };
    default:
      return {};
  }
}

function getStepSummary(step: ActionStep): string {
  switch (step.type) {
    case 'navigate':
      return step.params.url || 'لم يتم تحديد URL';
    case 'click':
      return step.params.selector || 'لم يتم تحديد selector';
    case 'type':
      return `${step.params.selector || '...'}: ${step.params.text || '...'}`;
    case 'wait':
      return step.params.type === 'time' 
        ? `${step.params.duration}ms`
        : step.params.selector || 'selector';
    case 'extract':
      return step.params.selector || 'لم يتم تحديد selector';
    case 'screenshot':
      return step.params.fullPage ? 'صفحة كاملة' : 'Viewport';
    case 'scroll':
      return step.params.position || 'نهاية الصفحة';
    case 'video':
      return `تسجيل فيديو لمدة ${step.params.duration} ملثانية`;
    case 'fillForm':
      return `${step.params.selector || '...'}: ${step.params.text || '...'}`;
    case 'aiStep':
      return step.params.prompt || 'لم يتم تحديد موجهة AI';
    default:
      return '';
  }
}

function renderStepParams(step: ActionStep, onChange: (params: any) => void) {
  const params = step.params;

  switch (step.type) {
    case 'navigate':
      return (
        <input
          type="url"
          value={params.url || ''}
          onChange={(e) => onChange({ ...params, url: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      );

    case 'click':
    case 'extract':
      return (
        <input
          type="text"
          value={params.selector || ''}
          onChange={(e) => onChange({ ...params, selector: e.target.value })}
          placeholder=".button, #id, [data-attr]"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono"
        />
      );

    case 'type':
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={params.selector || ''}
            onChange={(e) => onChange({ ...params, selector: e.target.value })}
            placeholder="selector"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono"
          />
          <input
            type="text"
            value={params.text || ''}
            onChange={(e) => onChange({ ...params, text: e.target.value })}
            placeholder="النص المراد كتابته"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
      );

    case 'wait':
      return (
        <div className="space-y-2">
          <select
            value={params.type || 'time'}
            onChange={(e) => onChange({ ...params, type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value="time">انتظار زمني</option>
            <option value="selector">انتظار عنصر</option>
          </select>
          {params.type === 'time' ? (
            <input
              type="number"
              value={params.duration || 1000}
              onChange={(e) => onChange({ ...params, duration: parseInt(e.target.value) })}
              placeholder="بالميلي ثانية"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          ) : (
            <input
              type="text"
              value={params.selector || ''}
              onChange={(e) => onChange({ ...params, selector: e.target.value })}
              placeholder="selector"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono"
            />
          )}
        </div>
      );

    case 'screenshot':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={params.fullPage || false}
            onChange={(e) => onChange({ ...params, fullPage: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">صفحة كاملة</span>
        </label>
      );

    case 'scroll':
      return (
        <select
          value={params.position || 'end'}
          onChange={(e) => onChange({ ...params, position: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        >
          <option value="end">نهاية الصفحة</option>
          <option value="0">بداية الصفحة</option>
          <option value="500">500px</option>
          <option value="1000">1000px</option>
        </select>
      );

    case 'video':
      return (
        <input
          type="number"
          value={params.duration || 30000}
          onChange={(e) => onChange({ ...params, duration: parseInt(e.target.value) })}
          placeholder="بالميلي ثانية"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      );

    case 'fillForm':
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={params.selector || ''}
            onChange={(e) => onChange({ ...params, selector: e.target.value })}
            placeholder="selector"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded font-mono"
          />
          <input
            type="text"
            value={params.text || ''}
            onChange={(e) => onChange({ ...params, text: e.target.value })}
            placeholder="النص المراد كتابته"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
      );

    case 'aiStep':
      return (
        <input
          type="text"
          value={params.prompt || ''}
          onChange={(e) => onChange({ ...params, prompt: e.target.value })}
          placeholder="موجهة AI"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      );

    default:
      return null;
  }
}

function parseScript(script: string): ActionStep[] {
  const steps: ActionStep[] = [];
  const lines = script.split('\n');
  let currentStep: ActionStep | null = null;
  let currentFallbackIndex = -1;

  for (const line of lines) {
    if (line.includes('Step')) {
      const stepNumber = parseInt(line.match(/Step (\d+)/)?.[1] || '0');
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        id: stepNumber.toString(),
        type: 'navigate',
        params: {},
        fallbacks: [],
        conditions: [],
        errorHandling: {
          ignoreErrors: false,
          retryCount: 3
        }
      };
    } else if (line.includes('await page.goto')) {
      const url = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.type = 'navigate';
        currentStep.params = { url };
      }
    } else if (line.includes('await page.click')) {
      const selector = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.type = 'click';
        currentStep.params = { selector };
      }
    } else if (line.includes('await page.fill')) {
      const selector = line.match(/'([^']+)'/)?.[1] || '';
      const text = line.match(/'([^']+)'/)?.[2] || '';
      if (currentStep) {
        currentStep.type = 'type';
        currentStep.params = { selector, text };
      }
    } else if (line.includes('await page.waitForTimeout')) {
      const duration = parseInt(line.match(/(\d+)/)?.[1] || '0');
      if (currentStep) {
        currentStep.type = 'wait';
        currentStep.params = { type: 'time', duration };
      }
    } else if (line.includes('await page.waitForSelector')) {
      const selector = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.type = 'wait';
        currentStep.params = { type: 'selector', selector };
      }
    } else if (line.includes('const data = await page.$$eval')) {
      const selector = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.type = 'extract';
        currentStep.params = { selector };
      }
    } else if (line.includes('await page.screenshot')) {
      const fullPage = line.includes('fullPage: true');
      if (currentStep) {
        currentStep.type = 'screenshot';
        currentStep.params = { fullPage };
      }
    } else if (line.includes('await page.evaluate(() => window.scrollTo')) {
      const position = line.match(/(\d+)/)?.[1] || 'end';
      if (currentStep) {
        currentStep.type = 'scroll';
        currentStep.params = { position };
      }
    } else if (line.includes('await page.evaluate(() => { /* كود تسجيل الفيديو هنا */ })')) {
      const duration = parseInt(line.match(/(\d+)/)?.[1] || '30000');
      if (currentStep) {
        currentStep.type = 'video';
        currentStep.params = { duration };
      }
    } else if (line.includes('await page.fill')) {
      const selector = line.match(/'([^']+)'/)?.[1] || '';
      const text = line.match(/'([^']+)'/)?.[2] || '';
      if (currentStep) {
        currentStep.type = 'fillForm';
        currentStep.params = { selector, text };
      }
    } else if (line.includes('await page.evaluate(() => { /* كود خطوة ذكية AI هنا */ })')) {
      const prompt = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.type = 'aiStep';
        currentStep.params = { prompt };
      }
    } else if (line.includes('let retries_step')) {
      const retryCount = parseInt(line.match(/(\d+)/)?.[1] || '0');
      if (currentStep) {
        currentStep.errorHandling.retryCount = retryCount;
      }
    } else if (line.includes('if (stepError)')) {
      if (currentStep) {
        currentStep.errorHandling.ignoreErrors = true;
      }
    } else if (line.includes('addFallback')) {
      currentFallbackIndex++;
      if (currentStep) {
        currentStep.fallbacks.push(getDefaultParams(currentStep.type));
      }
    } else if (line.includes('updateFallback')) {
      const fallbackIndex = parseInt(line.match(/(\d+)/)?.[1] || '0');
      const fallbackParams = line.match(/'([^']+)'/)?.[1] || '';
      if (currentStep) {
        currentStep.fallbacks[fallbackIndex] = JSON.parse(fallbackParams);
      }
    }
  }

  if (currentStep) {
    steps.push(currentStep);
  }

  return steps;
}