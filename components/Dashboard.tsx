import { Play, Pause, Settings, Trash2, Clock, CheckCircle, XCircle, Circle, Eye, ExternalLink, Loader, Plus, Edit2, Activity, FileText, Download, Upload, Github } from 'lucide-react';
import { Task } from '../App';
import { useApp } from '../contexts/AppContext';
import { useState } from 'react';
import { ResultsViewer } from './ResultsViewer';
import { TaskRunner } from './TaskRunner';
import { FilePreviewModal } from './FilePreviewModal';
import { GitHubTasksImporter } from './GitHubTasksImporter';

interface DashboardProps {
  tasks: Task[];
  logs?: any[];
  onTaskClick?: (task: Task) => void;
  onQuickAction?: () => void;
}

export function Dashboard({ tasks, logs, onTaskClick, onQuickAction }: DashboardProps) {
  const { deleteTask, executeTask, settings, runTaskOnGitHub, loading, deployToGitHub } = useApp();
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [viewingResults, setViewingResults] = useState<{ taskId: string; taskName: string } | null>(null);
  const [taskToRun, setTaskToRun] = useState<Task | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url?: string; blob?: Blob; fileName?: string } | null>(null);
  const [showPreviewInput, setShowPreviewInput] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [deployingTask, setDeployingTask] = useState<string | null>(null);

  const handleRun = async (taskId: string) => {
    if (!settings.github.connected) {
      // تشغيل محلي (محاكاة)
      setRunningTasks(prev => new Set(prev).add(taskId));
      try {
        await executeTask(taskId);
      } finally {
        setRunningTasks(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    } else {
      // تشغيل على GitHub Actions
      setRunningTasks(prev => new Set(prev).add(taskId));
      try {
        await runTaskOnGitHub(taskId);
        alert(`✅ تم تشغيل المهمة على GitHub Actions\nافتح:\nhttps://github.com/${settings.github.owner}/${settings.github.repo}/actions`);
      } catch (error: any) {
        alert(`❌ خطأ: ${error.message}`);
      } finally {
        setRunningTasks(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }
  };

  const handleViewResults = (task: Task) => {
    setViewingResults({ taskId: task.id, taskName: task.name });
  };

  const handleQuickDeploy = async (taskId: string) => {
    if (!settings.github.connected) {
      alert('⚠️ يجب الاتصال بـ GitHub أولاً من تبويب "البيئة والنشر"');
      return;
    }

    const confirmed = confirm('هل تريد نشر هذه المهمة إلى GitHub?\n\nسيتم إنشاء workflow file ورفعها إلى المستودع.');
    if (!confirmed) return;

    setDeployingTask(taskId);
    try {
      // deployToGitHub تأخذ array من task IDs
      await deployToGitHub([taskId]);
      alert('✅ تم نشر المهمة بنجاح!\n\nيمكنك الآن تشغيلها من GitHub Actions');
    } catch (error: any) {
      alert(`❌ فشل النشر: ${error.message}`);
    } finally {
      setDeployingTask(null);
    }
  };

  if (viewingResults) {
    return (
      <div>
        <button
          onClick={() => setViewingResults(null)}
          className="mb-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          ← العودة إلى لوحة التحكم
        </button>
        <ResultsViewer taskId={viewingResults.taskId} taskName={viewingResults.taskName} />
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي المهام</p>
              <p className="text-3xl mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">قيد التنفيذ</p>
              <p className="text-3xl mt-2">{stats.running}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">مكتملة</p>
              <p className="text-3xl mt-2">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">فاشلة</p>
              <p className="text-3xl mt-2">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg">المهام النشطة</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreviewInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="معاينة ملف من رابط"
            >
              <FileText className="w-4 h-4" />
              <span>معاينة ملف</span>
            </button>
            {onQuickAction && (
              <button
                onClick={onQuickAction}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مهمة</span>
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="mb-2">لا توجد مهام بعد</p>
              <p className="text-sm">ابدأ بإنشاء مهمة جديدة من الإجراءات السريعة أو المنشئ المرئي</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg">{task.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'completed' ? 'bg-green-50 text-green-700' :
                        task.status === 'running' ? 'bg-yellow-50 text-yellow-700' :
                        task.status === 'failed' ? 'bg-red-50 text-red-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {task.status === 'completed' ? 'مكتملة' :
                         task.status === 'running' ? 'قيد التنفيذ' :
                         task.status === 'failed' ? 'فاشلة' : 'جاهزة'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span>النوع: {getTaskTypeLabel(task.type)}</span>
                      <span>الموقع: {task.targetUrl}</span>
                      {task.lastRun && (
                        <span>آخر تنفيذ: {task.lastRun.toLocaleString('ar-SA')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="تشغيل متقدم"
                      onClick={() => setTaskToRun(task)}
                    >
                      <Play className="w-4 h-4 text-green-600" />
                    </button>
                    {settings.github.connected && (
                      <button
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="عرض النتائج"
                        onClick={() => handleViewResults(task)}
                      >
                        <Eye className="w-4 h-4 text-purple-600" />
                      </button>
                    )}
                    {onTaskClick && (
                      <button
                        onClick={() => onTaskClick(task)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="حذف"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                    {settings.github.connected && (
                      <button
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        title="نشر المهمة على GitHub"
                        onClick={() => handleQuickDeploy(task.id)}
                        disabled={deployingTask === task.id}
                      >
                        {deployingTask === task.id ? (
                          <Loader className="w-4 h-4 text-green-600 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Runner Modal */}
      {taskToRun && (
        <TaskRunner 
          task={taskToRun} 
          onClose={() => setTaskToRun(null)} 
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onRetry={() => {
            // إعادة فتح نافذة إدخال رابط جديد
            setPreviewFile(null);
            setShowPreviewInput(true);
          }}
        />
      )}

      {/* Preview Input */}
      {showPreviewInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">عرض ملف</h3>
            <input
              type="text"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mb-4"
              placeholder="أدخل رابط الملف"
            />
            <div className="flex items-center justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  setPreviewFile({ url: previewUrl });
                  setShowPreviewInput(false);
                }}
              >
                عرض
              </button>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-2"
                onClick={() => setShowPreviewInput(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTaskTypeLabel(type: string): string {
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