import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { Save, X, Play, FileCode, Eye, Code2, Sparkles, Layers } from 'lucide-react';
import { VisualBuilder } from './VisualBuilder';
import { AdvancedVisualBuilder } from './AdvancedVisualBuilder';
import { SmartTaskBuilder } from './SmartTaskBuilder';

type TaskEditorProps = {
  task: Task | null;
  onSave: (task: Task) => void;
  onCancel: () => void;
};

type EditorMode = 'auto' | 'code' | 'visual' | 'advanced' | 'smart';

export function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>('auto');
  const [showEditorMenu, setShowEditorMenu] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    description: '',
    type: 'scraping',
    status: 'idle',
    script: '',
    targetUrl: '',
    createdAt: new Date()
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
      // تحديد المحرر بناءً على مصدر المهمة
      const source = task.metadata?.source;
      if (source === 'visual-builder') {
        setEditorMode('visual');
      } else if (source === 'advanced-builder') {
        setEditorMode('advanced');
      } else if (source === 'smart-builder') {
        setEditorMode('smart');
      } else {
        setEditorMode('code');
      }
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTask = {
      ...formData,
      id: task?.id || Date.now().toString(),
      metadata: {
        ...formData.metadata,
        source: editorMode === 'code' ? 'task-editor' : formData.metadata?.source
      }
    } as Task;
    onSave(updatedTask);
  };

  const handleTaskCreated = (createdTask: Task) => {
    onSave(createdTask);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    onSave(updatedTask);
  };

  // إذا كانت المهمة من منشئ مرئي وفي وضع تلقائي، اعرض المنشئ المناسب
  if (task && editorMode !== 'code') {
    const source = task.metadata?.source;
    
    if (editorMode === 'visual' || source === 'visual-builder') {
      return (
        <div>
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl">تعديل المهمة - المنشئ المرئي</h2>
              <p className="text-sm text-slate-600 mt-1">تم إنشاء هذه المهمة من المنشئ المرئي</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorMode('advanced')}
                className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>المنشئ المتقدم</span>
              </button>
              <button
                onClick={() => setEditorMode('code')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Code2 className="w-4 h-4" />
                <span>تحرير الكود</span>
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <VisualBuilder 
            onTaskCreated={handleTaskCreated}
            taskToEdit={task}
            onTaskUpdated={handleTaskUpdated}
          />
        </div>
      );
    }

    if (editorMode === 'advanced' || source === 'advanced-builder') {
      return (
        <div>
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl">تعديل المهمة - المنشئ المرئي المتقدم</h2>
              <p className="text-sm text-slate-600 mt-1">تم إنشاء هذه المهمة من المنشئ المرئي المتقدم</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorMode('visual')}
                className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>المنشئ البسيط</span>
              </button>
              <button
                onClick={() => setEditorMode('code')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Code2 className="w-4 h-4" />
                <span>تحرير الكود</span>
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <AdvancedVisualBuilder 
            onTaskCreated={handleTaskCreated}
            taskToEdit={task}
            onTaskUpdated={handleTaskUpdated}
          />
        </div>
      );
    }

    if (editorMode === 'smart' || source === 'smart-builder') {
      return (
        <div>
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl">تعديل المهمة - المنشئ الذكي</h2>
              <p className="text-sm text-slate-600 mt-1">تم إنشاء هذه المهمة من المنشئ الذكي</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorMode('visual')}
                className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>المنشئ المرئي</span>
              </button>
              <button
                onClick={() => setEditorMode('code')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Code2 className="w-4 h-4" />
                <span>تحرير الكود</span>
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <SmartTaskBuilder 
            onTaskCreated={handleTaskCreated}
            taskToEdit={task}
            onTaskUpdated={handleTaskUpdated}
          />
        </div>
      );
    }
  }

  // المحرر النصي الافتراضي
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl">{task ? 'تعديل المهمة' : 'مهمة جديدة'}</h2>
            {task?.metadata?.source && (
              <p className="text-sm text-slate-600 mt-1">
                المصدر: {getSourceLabel(task.metadata.source)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task?.metadata?.source && task.metadata.source !== 'task-editor' && (
              <button
                onClick={() => setEditorMode('auto')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>فتح بالمحرر الأصلي</span>
              </button>
            )}
            {/* خيارات التعديل المتعددة */}
            {task && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEditorMenu(!showEditorMenu)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>تبديل المحرر ({getEditorLabel(editorMode)})</span>
                </button>
                {showEditorMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEditorMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white border-2 border-blue-200 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditorMode('code');
                            setShowEditorMenu(false);
                          }}
                          className={`w-full text-right px-3 py-3 rounded hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                            editorMode === 'code' ? 'bg-slate-100' : ''
                          }`}
                        >
                          <FileCode className="w-5 h-5 text-slate-600" />
                          <div className="flex-1 text-right">
                            <p className="font-medium">محرر الكود</p>
                            <p className="text-xs text-muted-foreground">للمبرمجين</p>
                          </div>
                          {editorMode === 'code' && <Eye className="w-4 h-4 text-blue-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorMode('visual');
                            setShowEditorMenu(false);
                          }}
                          className={`w-full text-right px-3 py-3 rounded hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                            editorMode === 'visual' ? 'bg-blue-100' : ''
                          }`}
                        >
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div className="flex-1 text-right">
                            <p className="font-medium">المنشئ المرئي</p>
                            <p className="text-xs text-muted-foreground">للمبتدئين</p>
                          </div>
                          {editorMode === 'visual' && <Eye className="w-4 h-4 text-blue-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorMode('advanced');
                            setShowEditorMenu(false);
                          }}
                          className={`w-full text-right px-3 py-3 rounded hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                            editorMode === 'advanced' ? 'bg-purple-100' : ''
                          }`}
                        >
                          <Layers className="w-5 h-5 text-purple-600" />
                          <div className="flex-1 text-right">
                            <p className="font-medium">المنشئ المتقدم</p>
                            <p className="text-xs text-muted-foreground">للمحترفين</p>
                          </div>
                          {editorMode === 'advanced' && <Eye className="w-4 h-4 text-blue-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorMode('smart');
                            setShowEditorMenu(false);
                          }}
                          className={`w-full text-right px-3 py-3 rounded hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                            editorMode === 'smart' ? 'bg-green-100' : ''
                          }`}
                        >
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <div className="flex-1 text-right">
                            <p className="font-medium">المنشئ الذكي</p>
                            <p className="text-xs text-muted-foreground">بالذكاء الاصطناعي</p>
                          </div>
                          {editorMode === 'smart' && <Eye className="w-4 h-4 text-blue-600" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">اسم المهمة</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: جمع أسعار المنتجات"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">نوع المهمة</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scraping">جمع بيانات (Web Scraping)</option>
                <option value="login">تسجيل دخول تلقائي</option>
                <option value="registration">إنشاء حساب</option>
                <option value="testing">اختبار موقع</option>
                <option value="screenshot">التقاط صورة</option>
                <option value="custom">مخصص</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="وصف مختصر للمهمة"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">رابط الموقع المستهدف</label>
            <input
              type="url"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Script Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm">السكريبت (JavaScript/Puppeteer)</label>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">يتم تنفيذه على GitHub Actions</span>
              </div>
            </div>
            <textarea
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={16}
              placeholder={`async function runTask(page) {
  // افتح الصفحة
  await page.goto('https://example.com');
  
  // انتظر تحميل المحتوى
  await page.waitForSelector('.content');
  
  // استخرج البيانات
  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(item => ({
      title: item.querySelector('h2')?.textContent,
      price: item.querySelector('.price')?.textContent
    }));
  });
  
  console.log('Data:', data);
}`}
              required
              dir="ltr"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{task ? 'حفظ التعديلات' : 'إنشاء المهمة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'visual-builder': 'المنشئ المرئي',
    'advanced-builder': 'المنشئ المرئي المتقدم',
    'smart-builder': 'المنشئ الذكي',
    'task-editor': 'محرر المهام',
    'template': 'قالب جاهز',
    'github-import': 'مستورد من GitHub'
  };
  return labels[source] || source;
}

function getEditorLabel(mode: EditorMode): string {
  const labels: Record<EditorMode, string> = {
    'auto': 'التلقائي',
    'code': 'الكود',
    'visual': 'المرئي',
    'advanced': 'المتقدم',
    'smart': 'الذكي'
  };
  return labels[mode] || mode;
}
