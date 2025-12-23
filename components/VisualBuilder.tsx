import { Task } from '../App';
import { useState, useEffect } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Play, Save } from 'lucide-react';

type VisualBuilderProps = {
  onTaskCreated: (task: Task) => void;
  taskToEdit?: Task;
  onTaskUpdated?: (task: Task) => void;
};

type Step = {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'wait' | 'extract' | 'screenshot';
  params: any;
};

const stepTypes = [
  { value: 'navigate', label: 'فتح صفحة', icon: '🌐' },
  { value: 'click', label: 'نقر على عنصر', icon: '👆' },
  { value: 'type', label: 'كتابة نص', icon: '⌨️' },
  { value: 'wait', label: 'انتظار', icon: '⏱️' },
  { value: 'extract', label: 'استخراج بيانات', icon: '📊' },
  { value: 'screenshot', label: 'التقاط صورة', icon: '📸' }
];

export function VisualBuilder({ onTaskCreated, taskToEdit, onTaskUpdated }: VisualBuilderProps) {
  const [taskName, setTaskName] = useState(taskToEdit?.name || '');
  const [taskDescription, setTaskDescription] = useState(taskToEdit?.description || '');
  const [targetUrl, setTargetUrl] = useState(taskToEdit?.targetUrl || '');
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (taskToEdit?.script) {
      // محاولة تحليل السكريبت إلى خطوات
      try {
        const parsed = JSON.parse(taskToEdit.script);
        if (Array.isArray(parsed.steps)) {
          setSteps(parsed.steps);
        }
      } catch {
        // إذا فشل التحليل، ابدأ بخطوات فارغة
        setSteps([]);
      }
    }
  }, [taskToEdit]);

  const addStep = (type: Step['type']) => {
    const newStep: Step = {
      id: Date.now().toString(),
      type,
      params: getDefaultParams(type)
    };
    setSteps([...steps, newStep]);
  };

  const getDefaultParams = (type: Step['type']) => {
    switch (type) {
      case 'navigate':
        return { url: '' };
      case 'click':
        return { selector: '' };
      case 'type':
        return { selector: '', text: '' };
      case 'wait':
        return { duration: 1000 };
      case 'extract':
        return { selector: '', attribute: 'textContent' };
      case 'screenshot':
        return { fullPage: true };
      default:
        return {};
    }
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  const updateStepParams = (id: string, params: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, params } : step
    ));
  };

  const generateScript = () => {
    return JSON.stringify({ steps }, null, 2);
  };

  const handleSave = () => {
    const task: Task = {
      id: taskToEdit?.id || Date.now().toString(),
      name: taskName,
      description: taskDescription,
      type: 'custom',
      status: 'idle',
      script: generateScript(),
      targetUrl,
      createdAt: taskToEdit?.createdAt || new Date(),
      metadata: {
        source: 'visual-builder',
        lastModified: new Date()
      }
    };

    if (taskToEdit && onTaskUpdated) {
      onTaskUpdated(task);
    } else {
      onTaskCreated(task);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">اسم المهمة</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: جمع بيانات المنتجات"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">الوصف</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="وصف مختصر للمهمة"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">رابط الموقع</label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg">الخطوات</h3>
          <div className="flex gap-2 flex-wrap">
            {stepTypes.map(type => (
              <button
                key={type.value}
                onClick={() => addStep(type.value as Step['type'])}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
                <Plus className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {steps.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <p className="text-slate-500">لا توجد خطوات بعد. اضغط على أحد الأزرار أعلاه لإضافة خطوة</p>
            </div>
          ) : (
            steps.map((step, index) => (
              <div key={step.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {stepTypes.find(t => t.value === step.type)?.icon}
                    </span>
                    <div>
                      <h4 className="font-medium">
                        {stepTypes.find(t => t.value === step.type)?.label}
                      </h4>
                      <p className="text-xs text-slate-500">الخطوة {index + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveStepUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveStepDown(index)}
                      disabled={index === steps.length - 1}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step Parameters */}
                <div className="space-y-2">
                  {step.type === 'navigate' && (
                    <input
                      type="url"
                      value={step.params.url}
                      onChange={(e) => updateStepParams(step.id, { url: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      placeholder="https://example.com"
                    />
                  )}

                  {step.type === 'click' && (
                    <input
                      type="text"
                      value={step.params.selector}
                      onChange={(e) => updateStepParams(step.id, { selector: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      placeholder="CSS Selector (مثال: .button, #submit)"
                    />
                  )}

                  {step.type === 'type' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={step.params.selector}
                        onChange={(e) => updateStepParams(step.id, { ...step.params, selector: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="CSS Selector"
                      />
                      <input
                        type="text"
                        value={step.params.text}
                        onChange={(e) => updateStepParams(step.id, { ...step.params, text: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="النص المراد كتابته"
                      />
                    </div>
                  )}

                  {step.type === 'wait' && (
                    <input
                      type="number"
                      value={step.params.duration}
                      onChange={(e) => updateStepParams(step.id, { duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      placeholder="المدة بالميلي ثانية"
                    />
                  )}

                  {step.type === 'extract' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={step.params.selector}
                        onChange={(e) => updateStepParams(step.id, { ...step.params, selector: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="CSS Selector"
                      />
                      <select
                        value={step.params.attribute}
                        onChange={(e) => updateStepParams(step.id, { ...step.params, attribute: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      >
                        <option value="textContent">النص</option>
                        <option value="href">الرابط (href)</option>
                        <option value="src">المصدر (src)</option>
                        <option value="value">القيمة (value)</option>
                      </select>
                    </div>
                  )}

                  {step.type === 'screenshot' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={step.params.fullPage}
                        onChange={(e) => updateStepParams(step.id, { fullPage: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">التقاط الصفحة كاملة</span>
                    </label>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={!taskName || steps.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{taskToEdit ? 'حفظ التعديلات' : 'إنشاء المهمة'}</span>
        </button>
      </div>
    </div>
  );
}
