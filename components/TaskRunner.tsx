import { useState } from 'react';
import { Play, Calendar, Repeat, Settings, Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Task } from '../App';
import { toast } from 'sonner';
import { ErrorLogger } from '../utils/error-tracker';

interface TaskRunnerProps {
  task: Task;
  onClose: () => void;
}

type ScheduleType = 'once' | 'daily' | 'weekly' | 'hourly' | 'custom';

export function TaskRunner({ task, onClose }: TaskRunnerProps) {
  const { runTaskOnGitHub, deployAndRunTask, settings } = useApp();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [runMode, setRunMode] = useState<'github' | 'deploy-and-run'>('github'); // تغيير الافتراضي إلى 'github'
  const [runCount, setRunCount] = useState(1);
  const [schedule, setSchedule] = useState<ScheduleType>('once');
  const [cronExpression, setCronExpression] = useState('0 */6 * * *');
  const [delay, setDelay] = useState(60); // ثواني بين التشغيلات

  const handleRunOnce = async () => {
    setRunning(true);
    setStatus('running');
    setMessage('');
    
    try {
      if (runMode === 'github') {
        await runTaskOnGitHub(task.id);
        setStatus('success');
        setMessage('تم بدء المهمة على GitHub Actions - راجع صفحة النتائج للمتابعة');
      } else if (runMode === 'deploy-and-run') {
        await deployAndRunTask(task.id);
        setStatus('success');
        setMessage('تم نشر وتشغيل المهمة بنجاح - راجع صفحة النتائج للمتابعة');
      }
      
      toast.success('✅ تم تشغيل المهمة بنجاح!', {
        description: 'تحقق من صفحة النتائج لمتابعة التنفيذ'
      });
      
      // إغلاق تلقائي بعد النجاح
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      
      // تسجيل الخطأ في نظام التتبع
      ErrorLogger.taskError(
        error.message || 'فشل تشغيل المهمة',
        task.id,
        task.name,
        { runMode, error }
      );
      
      // تحسين رسالة الخطأ
      let errorMessage = error.message || 'فشل تشغيل المهمة';
      
      // معالجة أخطاء شائعة
      if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        setMessage('⚠️ المهمة غير منشورة على GitHub. جرب وضع "نشر وتشغيل تلقائياً"');
      } else if (errorMessage.includes('غير متصل')) {
        setMessage('❌ غير متصل بـ GitHub. اذهب إلى صفحة "ربط GitHub" للاتصال أولاً');
      } else if (errorMessage.includes('Permission') || errorMessage.includes('token')) {
        setMessage('❌ مشكلة في صلاحيات GitHub Token. تحقق من إعدادات الربط');
      } else {
        setMessage(errorMessage);
      }
      
      toast.error('فشل تشغيل المهمة', {
        description: errorMessage
      });
    } finally {
      setRunning(false);
    }
  };

  const handleRunMultiple = async () => {
    setRunning(true);
    setStatus('running');
    setMessage('');
    
    try {
      for (let i = 0; i < runCount; i++) {
        console.log(`Running iteration ${i + 1}/${runCount}`);
        if (runMode === 'github') {
          await runTaskOnGitHub(task.id);
        } else if (runMode === 'deploy-and-run') {
          await deployAndRunTask(task.id);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setStatus('success');
      toast.success('✅ تم تشغيل المهمة بنجاح!', {
        description: 'تحقق من صفحة النتائج لمتابعة التنفيذ'
      });
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      // تسجيل الخطأ في نظام التتبع
      ErrorLogger.taskError(
        error.message || 'حدث خطأ أثناء تشغيل المهمة',
        task.id,
        task.name,
        { runMode, runCount, iteration: 'multiple', error }
      );
      
      setStatus('error');
      setMessage(error.message || 'حدث خطأ غير معروف');
    } finally {
      setRunning(false);
    }
  };

  const getCronDescription = () => {
    switch (schedule) {
      case 'hourly':
        return 'كل ساعة';
      case 'daily':
        return 'يومياً';
      case 'weekly':
        return 'أسبوعياً';
      case 'custom':
        return `مخصص: ${cronExpression}`;
      default:
        return 'مرة واحدة';
    }
  };

  const getCronExpression = () => {
    switch (schedule) {
      case 'hourly':
        return '0 * * * *';
      case 'daily':
        return '0 0 * * *';
      case 'weekly':
        return '0 0 * * 0';
      case 'custom':
        return cronExpression;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl mb-2">تشغيل المهمة</h3>
          <p className="text-sm text-slate-600">{task.name}</p>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status === 'running' ? 'bg-blue-50 text-blue-700' :
            status === 'success' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {status === 'running' && <Loader className="size-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="size-5" />}
            {status === 'error' && <XCircle className="size-5" />}
            <span>
              {status === 'running' && 'جاري التشغيل...'}
              {status === 'success' && 'تم التشغيل بنجاح!'}
              {status === 'error' && 'فشل التشغيل'}
            </span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 mb-6">
          {/* Run Mode */}
          <div>
            <label className="block text-sm mb-2">طريقة التشغيل</label>
            <select
              value={runMode}
              onChange={(e) => setRunMode(e.target.value as 'github' | 'deploy-and-run')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              disabled={running}
            >
              <option value="github" disabled={!settings.github.connected}>GitHub Actions</option>
              <option value="deploy-and-run" disabled={!settings.github.connected}>نشر وتشغيل تلقائياً</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {runMode === 'github' && '☁️ تشغيل على GitHub Actions (يجب نشر المهمة أولاً)'}
              {runMode === 'deploy-and-run' && '🚀 ينشر المهمة تلقائياً ثم يشغلها على GitHub'}
            </p>
          </div>

          {/* Run Count */}
          <div>
            <label className="block text-sm mb-2">عدد مرات التشغيل</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={runCount}
                onChange={(e) => setRunCount(parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                disabled={running}
              />
              <Repeat className="size-5 text-slate-400" />
            </div>
            {runCount > 1 && (
              <p className="text-xs text-slate-500 mt-1">
                سيتم التشغيل {runCount} مر مع فاصل {delay} ثانية
              </p>
            )}
          </div>

          {/* Delay between runs */}
          {runCount > 1 && (
            <div>
              <label className="block text-sm mb-2">الفاصل الزمني (بالثواني)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 60)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                  disabled={running}
                />
                <Clock className="size-5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="block text-sm mb-2">جدولة التشغيل</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as ScheduleType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              disabled={running}
            >
              <option value="once">مرة واحدة الآن</option>
              <option value="hourly">كل ساعة</option>
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="custom">مخصص (Cron)</option>
            </select>
          </div>

          {/* Custom Cron */}
          {schedule === 'custom' && (
            <div>
              <label className="block text-sm mb-2">تعبير Cron</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 */6 * * *"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                disabled={running}
              />
              <p className="text-xs text-slate-500 mt-1">
                مثال: 0 */6 * * * (كل 6 ساعات)
              </p>
            </div>
          )}

          {/* Schedule Info */}
          {schedule !== 'once' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Calendar className="size-4" />
                <span>سيتم تشغيل المهمة: {getCronDescription()}</span>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-mono">
                Cron: {getCronExpression()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={runCount > 1 ? handleRunMultiple : handleRunOnce}
            disabled={running || !settings.github.connected}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <Loader className="size-5 animate-spin" />
                <span>جاري التشغيل...</span>
              </>
            ) : (
              <>
                <Play className="size-5" />
                <span>{runCount > 1 ? `تشغيل ${runCount}×` : 'تشغيل الآن'}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={running}
            className="px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {status === 'success' ? 'إغلاق' : 'إلغاء'}
          </button>
        </div>

        {/* GitHub Connection Warning */}
        {runMode !== 'local' && !settings.github.connected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              ⚠️ يجب الاتصال بـ GitHub أولاً من صفحة "ربط GitHub"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}