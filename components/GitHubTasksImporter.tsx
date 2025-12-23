import { useState } from 'react';
import { Download, FileText, CheckCircle, XCircle, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

interface GitHubTask {
  id: string;
  name: string;
  description: string;
  type: string;
  script: string;
  targetUrl: string;
  schedule?: string;
}

export function GitHubTasksImporter() {
  const { githubAPI, settings, addTask } = useApp();
  const [loading, setLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<GitHubTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchTasksFromGitHub = async () => {
    if (!githubAPI) {
      toast.error('غير متصل بـ GitHub');
      return;
    }

    setLoading(true);
    try {
      const allTasks: GitHubTask[] = [];

      // فقط فحص ملفات المهام في مجلد scripts/
      // هذا يضمن استيراد المهام الحقيقية فقط وتجنب السكربتات الأخرى
      try {
        const scriptFiles = await scanScriptsDirectory();
        allTasks.push(...scriptFiles);
      } catch (error) {
        console.log('No scripts directory found');
      }

      // إزالة المها المكررة (بناءً على ID)
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      setAvailableTasks(uniqueTasks);
      
      if (uniqueTasks.length > 0) {
        toast.success(`تم العثور على ${uniqueTasks.length} مهمة في مجلد scripts`);
      } else {
        toast.warning('لم يتم العثور على مهام في مجلد scripts');
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error('فشل جلب المهام: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const scanScriptsDirectory = async (): Promise<GitHubTask[]> => {
    if (!githubAPI) return [];
    const tasks: GitHubTask[] = [];
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${settings.github.owner}/${settings.github.repo}/contents/scripts`,
        {
          headers: {
            'Authorization': `token ${settings.github.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to read scripts directory');
      }

      const files = await response.json();
      
      // تصفية ملفات JavaScript/TypeScript
      const scriptFiles = files.filter((file: any) => 
        file.name.endsWith('.js') || file.name.endsWith('.ts')
      );

      for (const file of scriptFiles) {
        try {
          const scriptContent = await githubAPI.getFile(`scripts/${file.name}`);
          if (scriptContent) {
            const taskId = file.name.replace(/\.(js|ts)$/, '');
            const task = parseScriptToTask(taskId, file.name, scriptContent.content);
            if (task) {
              tasks.push(task);
            }
          }
        } catch (error) {
          console.error(`Failed to read scripts/${file.name}:`, error);
        }
      }
    } catch (error) {
      console.log('No scripts directory found');
    }

    return tasks;
  };

  const parseScriptToTask = (taskId: string, fileName: string, scriptContent: string): GitHubTask | null => {
    try {
      // استخراج معلومات من تعليقات السكريبت
      const nameMatch = scriptContent.match(/\/\/\s*@name\s+(.+)/i) || 
                       scriptContent.match(/\/\*\*?\s*@name\s+(.+)\s*\*?\//i);
      const name = nameMatch ? nameMatch[1].trim() : fileName.replace(/\.(js|ts)$/, '');

      const descMatch = scriptContent.match(/\/\/\s*@description\s+(.+)/i) ||
                       scriptContent.match(/\/\*\*?\s*@description\s+(.+)\s*\*?\//i);
      const description = descMatch ? descMatch[1].trim() : 'مهم مستوردة من السكريبتات';

      const urlMatch = scriptContent.match(/\/\/\s*@url\s+(.+)/i) ||
                      scriptContent.match(/\/\*\*?\s*@url\s+(.+)\s*\*?\//i);
      const targetUrl = urlMatch ? urlMatch[1].trim() : 'https://example.com';

      const typeMatch = scriptContent.match(/\/\/\s*@type\s+(.+)/i) ||
                       scriptContent.match(/\/\*\*?\s*@type\s+(.+)\s*\*?\//i);
      let type = typeMatch ? typeMatch[1].trim() : 'custom';

      // تخمين نوع المهمة من المحتوى
      if (!typeMatch) {
        if (scriptContent.includes('login') || scriptContent.includes('signin')) type = 'login';
        else if (scriptContent.includes('scrape') || scriptContent.includes('extract')) type = 'scraping';
        else if (scriptContent.includes('screenshot')) type = 'screenshot';
        else if (scriptContent.includes('test')) type = 'testing';
      }

      return {
        id: taskId,
        name,
        description,
        type: type as any,
        script: scriptContent,
        targetUrl
      };
    } catch (error) {
      console.error('Error parsing script:', error);
      return null;
    }
  };

  const handleImport = async () => {
    if (selectedTasks.length === 0) {
      toast.error('الرجاء اختيار مهمة واحدة على الأقل');
      return;
    }

    setImporting(true);
    try {
      for (const taskId of selectedTasks) {
        const task = availableTasks.find(t => t.id === taskId);
        if (task) {
          // محاولة جلب سجل التنفيذات السابقة من GitHub
          let executionLogs = [];
          try {
            const logsPath = `logs/${task.id}.json`;
            const logsData = await githubAPI?.getFile(logsPath);
            if (logsData) {
              executionLogs = JSON.parse(logsData.content);
            }
          } catch (error) {
            console.log('No previous execution logs found for task:', task.id);
          }

          // تنظيم المهمة المستوردة بحيث تكون متوافقة مع البنية الحالية
          const organizedTask = {
            id: `imported-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: task.name,
            description: task.description,
            type: task.type || 'custom',
            status: 'idle',
            script: task.script,
            targetUrl: task.targetUrl || '',
            schedule: task.schedule,
            createdAt: new Date(),
            // إضافة معلومات إضافية للمهام المستوردة
            metadata: {
              source: 'github-import',
              imported: true,
              importedFrom: 'github',
              originalId: task.id,
              importedAt: new Date().toISOString(),
              executionHistory: executionLogs, // سجل التنفيذات السابقة
            }
          };
          
          addTask(organizedTask);
        }
      }

      toast.success(`تم استيراد ${selectedTasks.length} مهمة بنجاح`);
      setSelectedTasks([]);
      setAvailableTasks([]);
    } catch (error: any) {
      toast.error('فشل استيراد المهام: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => {
    setSelectedTasks(availableTasks.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTasks([]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <span>استيراد مهام من GitHub</span>
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            جلب المهام الموجودة مسبقاً في ال��ستودع
          </p>
        </div>
        <button
          onClick={fetchTasksFromGitHub}
          disabled={!githubAPI || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>جاري البحث...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>بحث عن مهام</span>
            </>
          )}
        </button>
      </div>

      {!githubAPI && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            يجب الاتصال بـ GitHub أولاً من صفحة "ربط GitHub"
          </p>
        </div>
      )}

      {availableTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              تم العثور على {availableTasks.length} مهمة • {selectedTasks.length} محددة
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                تحديد الكل
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-slate-600 hover:underline"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableTasks.map(task => (
              <label
                key={task.id}
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="font-medium">{task.name}</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {task.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>📁 {task.name}</span>
                    {task.targetUrl && (
                      <>
                        <span>•</span>
                        <span>🔗 {task.targetUrl}</span>
                      </>
                    )}
                    {task.schedule && (
                      <>
                        <span>•</span>
                        <span>⏰ {task.schedule}</span>
                      </>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleImport}
              disabled={selectedTasks.length === 0 || importing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>استيراد المهام المحددة ({selectedTasks.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!loading && availableTasks.length === 0 && githubAPI && (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لم يتم العثور على مهام</p>
          <p className="text-sm mt-1">انقر على "بحث عن مهام" للبحث في المستودع</p>
        </div>
      )}
    </div>
  );
}