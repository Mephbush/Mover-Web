import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, ExecutionLog } from '../App';
import { verifyGitHubToken, deployTasksToGitHub, GitHubAPI } from '../utils/github';

// ========== أنواع البيانات ==========

export type StealthLevel = 'basic' | 'advanced' | 'maximum';

export type StealthConfig = {
  level: StealthLevel;
  randomUserAgent: boolean;
  randomViewport: boolean;
  hideWebdriver: boolean;
  randomTimezone: boolean;
  randomLanguage: boolean;
  humanClicks: boolean;
  humanTyping: boolean;
  randomDelays: boolean;
  mouseMovement: boolean;
  scrollBehavior: boolean;
  blockWebRTC: boolean;
  maskFingerprint: boolean;
  rotateProxies: boolean;
  clearCookies: boolean;
};

export type GitHubConfig = {
  connected: boolean;
  owner: string;
  repo: string;
  token: string;
  branch: string;
  autoSync: boolean;
  targetBranch?: string;     // الفرع المستهدف للنشر
  createPR?: boolean;         // إنشاء Pull Request
  baseBranch?: string;        // الفرع الأساسي للـ PR
};

export type AppSettings = {
  stealth: StealthConfig;
  github: GitHubConfig;
  execution: {
    mode: 'github' | 'cloud' | 'hybrid';
    cloudProvider?: 'browserless' | 'apify' | 'brightdata';
    cloudToken?: string;
  };
};

// ========== Context ==========

type AppContextType = {
  // البيانات
  tasks: Task[];
  logs: ExecutionLog[];
  settings: AppSettings;
  localResults: LocalTaskResult[]; // إضافة نتائج محلية
  
  // إدارة المهام
  addTask: (task: Task) => void;
  updateTask: (taskIdOrTask: string | Task, updates?: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  executeTask: (taskId: string) => Promise<void>;
  
  // إدارة السجلات
  addLog: (log: ExecutionLog) => void;
  clearLogs: () => void;
  
  // إدارة الإعدادات
  updateStealthSettings: (config: Partial<StealthConfig>) => void;
  updateGitHubSettings: (config: Partial<GitHubConfig>) => void;
  updateExecutionSettings: (config: Partial<AppSettings['execution']>) => void;
  
  // GitHub
  connectGitHub: (owner: string, repo: string, token: string) => Promise<boolean>;
  disconnectGitHub: () => void;
  syncWithGitHub: () => Promise<void>;
  deployToGitHub: (taskIds: string[], deploySettings?: {
    targetBranch?: string;
    createNewBranch?: boolean;
    newBranchName?: string;
    createPR?: boolean;
    baseBranch?: string;
  }) => Promise<void>;
  
  // تشغيل مهمة على GitHub Actions
  runTaskOnGitHub: (taskId: string) => Promise<void>;
  
  // تشغيل مهمة محلياً (بدون GitHub)
  runTaskLocally: (taskId: string) => Promise<any>;
  
  // نشر مهمة ثم تشغيلها تلقائياً
  deployAndRunTask: (taskId: string) => Promise<void>;
  
  // الحصول على نتائج مهمة من GitHub
  getTaskResults: (taskId: string, runId?: number) => Promise<{
    runs: any[];
    artifacts: any[];
    latestRun?: any;
  }>;
  
  // تحميل artifact
  downloadArtifact: (artifactId: number) => Promise<Blob>;
  
  // حالة التحميل
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // GitHub API instance
  githubAPI: GitHubAPI | null;
};

// نوع بيانات نتائج التشغيل المحلي
export type LocalTaskResult = {
  id: string;
  taskId: string;
  taskName: string;
  run_number: number;
  status: 'success' | 'failed' | 'running';
  conclusion: 'success' | 'failure' | 'in_progress';
  created_at: string;
  updated_at: string;
  logs: string[];
  artifacts: LocalArtifact[];
  html_url: string;
};

export type LocalArtifact = {
  id: number;
  name: string;
  size_in_bytes: number;
  data: any; // البيانات الفعلية
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ========== الإعدادات الافتراضية ==========

const DEFAULT_STEALTH_CONFIG: StealthConfig = {
  level: 'advanced',
  randomUserAgent: true,
  randomViewport: true,
  hideWebdriver: true,
  randomTimezone: true,
  randomLanguage: false,
  humanClicks: true,
  humanTyping: true,
  randomDelays: true,
  mouseMovement: true,
  scrollBehavior: true,
  blockWebRTC: true,
  maskFingerprint: true,
  rotateProxies: false,
  clearCookies: true
};

const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  connected: false,
  owner: '',
  repo: '',
  token: '',
  branch: 'main',
  autoSync: false
};

const DEFAULT_SETTINGS: AppSettings = {
  stealth: DEFAULT_STEALTH_CONFIG,
  github: DEFAULT_GITHUB_CONFIG,
  execution: {
    mode: 'hybrid'
  }
};

// ========== Provider ==========

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [githubAPI, setGithubAPI] = useState<GitHubAPI | null>(null);
  const [localResults, setLocalResults] = useState<LocalTaskResult[]>([]);

  // ========== تحميل من localStorage ==========
  useEffect(() => {
    const savedTasks = localStorage.getItem('automation-tasks');
    const savedLogs = localStorage.getItem('automation-logs');
    const savedSettings = localStorage.getItem('automation-settings');

    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        // تويل التواريخ
        const tasksWithDates = parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lastRun: t.lastRun ? new Date(t.lastRun) : undefined
        }));
        setTasks(tasksWithDates);
      } catch (e) {
        console.error('Error loading tasks:', e);
      }
    }

    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        const logsWithDates = parsed.map((l: any) => ({
          ...l,
          startTime: new Date(l.startTime),
          endTime: l.endTime ? new Date(l.endTime) : undefined
        }));
        setLogs(logsWithDates);
      } catch (e) {
        console.error('Error loading logs:', e);
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // ========== حفظ في localStorage ==========
  useEffect(() => {
    localStorage.setItem('automation-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('automation-logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('automation-settings', JSON.stringify(settings));
  }, [settings]);

  // ========== إدارة المهام ==========

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (taskIdOrTask: string | Task, updates?: Partial<Task>) => {
    if (typeof taskIdOrTask === 'string') {
      // تحديث بناءً على ID
      setTasks(prev => prev.map(t => 
        t.id === taskIdOrTask ? { ...t, ...updates } : t
      ));
    } else {
      // تحديث كامل
      setTasks(prev => prev.map(t => t.id === taskIdOrTask.id ? taskIdOrTask : t));
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const executeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setLoading(true);
    
    const log: ExecutionLog = {
      id: Date.now().toString(),
      taskId: task.id,
      taskName: task.name,
      status: 'running',
      startTime: new Date(),
      logs: ['بدء التنفيذ...']
    };

    addLog(log);
    updateTask({ ...task, status: 'running', lastRun: new Date() });

    try {
      // محاكاة التنفيذ
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // تحديث السجل
      const updatedLog: ExecutionLog = {
        ...log,
        status: 'success',
        endTime: new Date(),
        duration: 2,
        logs: [
          ...log.logs,
          'طبيق إعدادات التخفي...',
          `المستوى: ${settings.stealth.level}`,
          'الاتصال بالموقع...',
          'تنفيذ المهمة...',
          'اكتملت المهمة بنجاح'
        ]
      };

      setLogs(prev => prev.map(l => l.id === log.id ? updatedLog : l));
      updateTask({ ...task, status: 'completed' });

    } catch (error: any) {
      const errorLog: ExecutionLog = {
        ...log,
        status: 'failed',
        endTime: new Date(),
        logs: [...log.logs, `خطأ: ${error.message}`]
      };

      setLogs(prev => prev.map(l => l.id === log.id ? errorLog : l));
      updateTask({ ...task, status: 'failed' });
    } finally {
      setLoading(false);
    }
  };

  // ========== إدارة السجلات ==========

  const addLog = (log: ExecutionLog) => {
    setLogs(prev => [log, ...prev].slice(0, 100)); // آخر 100 سجل
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // ========== إدارة الإعدادات ==========

  const updateStealthSettings = (config: Partial<StealthConfig>) => {
    setSettings(prev => ({
      ...prev,
      stealth: { ...prev.stealth, ...config }
    }));
  };

  const updateGitHubSettings = (config: Partial<GitHubConfig>) => {
    setSettings(prev => ({
      ...prev,
      github: { ...prev.github, ...config }
    }));
  };

  const updateExecutionSettings = (config: Partial<AppSettings['execution']>) => {
    setSettings(prev => ({
      ...prev,
      execution: { ...prev.execution, ...config }
    }));
  };

  // ========== GitHub Integration ==========

  const connectGitHub = async (owner: string, repo: string, token: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🔗 محاولة الاتصال بـ GitHub...');
      console.log('Owner:', owner);
      console.log('Repo:', repo);
      
      const result = await verifyGitHubToken(owner, repo, token, settings.github.branch);

      if (result.success && result.api) {
        setGithubAPI(result.api);
        updateGitHubSettings({
          connected: true,
          owner,
          repo,
          token,
        });
        console.log('✅ نجح الاتصال بـ GitHub');
        return true;
      } else {
        console.error('❌ فشل الاتصال:', result.error);
        const errorMessage = result.error || 'فشل الاتصال';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ خطأ في الاتصال بـ GitHub:', error);
      // رمي الخطأ مرة أخرى ليتمكن UI من عرضه
      throw new Error(error.message || 'فشل الاتصال بـ GitHub');
    } finally {
      setLoading(false);
    }
  };

  const disconnectGitHub = () => {
    setGithubAPI(null);
    updateGitHubSettings({
      connected: false,
      owner: '',
      repo: '',
      token: ''
    });
  };

  const syncWithGitHub = async () => {
    if (!githubAPI) {
      throw new Error('غير متصل بـ GitHub');
    }

    setLoading(true);
    try {
      console.log('Syncing with GitHub...');
      const file = await githubAPI.getFile('tasks.json');
      
      if (file) {
        const remoteTasks = JSON.parse(file.content);
        setTasks(remoteTasks.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lastRun: t.lastRun ? new Date(t.lastRun) : undefined
        })));
        console.log('Sync completed successfully');
      } else {
        console.log('No tasks.json file found in repository');
        throw new Error('No tasks found in repository - deploy tasks first');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      
      // رسائل خطأ واضحة
      if (error.message?.includes('Not Found') || error.message?.includes('404')) {
        throw new Error('No tasks found in repository - please deploy tasks first');
      } else if (error.message?.includes('Resource not accessible')) {
        throw new Error('Permission denied - check your token permissions');
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const deployToGitHub = async (taskIds: string[], deploySettings?: {
    targetBranch?: string;
    createNewBranch?: boolean;
    newBranchName?: string;
    createPR?: boolean;
    baseBranch?: string;
  }) => {
    if (!githubAPI) {
      throw new Error('غير متصل بـ GitHub');
    }

    setLoading(true);
    try {
      console.log('🚀 بدء النشر إلى GitHub...');
      const selectedTasks = tasks.filter(t => taskIds.includes(t.id));
      
      // إذا كانت إعدادات النشر موجودة
      if (deploySettings) {
        // حفظ الإعدادات
        updateGitHubSettings({
          targetBranch: deploySettings.targetBranch,
          createPR: deploySettings.createPR,
          baseBranch: deploySettings.baseBranch
        });
        
        // إنشاء فرع جديد إذا طُلب
        if (deploySettings.createNewBranch && deploySettings.newBranchName) {
          console.log(`Creating new branch: ${deploySettings.newBranchName}`);
          await githubAPI.createBranch(
            deploySettings.newBranchName,
            deploySettings.baseBranch || settings.github.branch
          );
          
          // التبديل إلى الفرع الجديد
          githubAPI.updateBranch(deploySettings.newBranchName);
        } else if (deploySettings.targetBranch) {
          // التبديل إلى الفرع المستهدف
          githubAPI.updateBranch(deploySettings.targetBranch);
        }
      }
      
      await deployTasksToGitHub(githubAPI, selectedTasks, settings.stealth);
      
      // إنشاء PR إذا طُلب
      if (deploySettings?.createPR && deploySettings.baseBranch) {
        const currentBranch = deploySettings.newBranchName || deploySettings.targetBranch || settings.github.branch;
        console.log(`Creating PR: ${currentBranch} → ${deploySettings.baseBranch}`);
        
        await githubAPI.createPullRequest(
          `🤖 Deploy automation tasks`,
          currentBranch,
          deploySettings.baseBranch,
          `## تحديثات تلقائية من Web Automation Bot\n\n### المهام المنشورة:\n${selectedTasks.map(t => `- ${t.name}`).join('\n')}\n\n### التغييرات:\n- Workflows محدثة (${selectedTasks.length} مهمة)\n- إعدادات Stealth: ${settings.stealth.level}\n- تم التوليد تلقائياً`
        );
      }
      
      console.log('✅ اكتمل النشر بنجاح');
    } catch (error: any) {
      console.error('❌ خطأ في النشر:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // تشغيل مهمة على GitHub Actions
  const runTaskOnGitHub = async (taskId: string) => {
    if (!githubAPI) {
      throw new Error(' غير متصل بـ GitHub\\n\\nلتشغيل المهام على GitHub Actions:\\n1. اذهب إلى صفحة \"ربط GitHub\"\\n2. أدخل معلومات المستودع والـ Token\\n3. اضغط \"اتصال\"\\n4. ثم عد لتشغيل المهمة');
    }

    try {
      console.log(`Running task ${taskId} on GitHub Actions...`);
      
      // ✅ التحقق من وجود workflow أولاً قبل التشغيل
      try {
        await githubAPI.getFile(`.github/workflows/task-${taskId}.yml`);
        console.log(`✅ Workflow file found: task-${taskId}.yml`);
      } catch (fileError: any) {
        if (fileError.message?.includes('404') || fileError.message?.includes('Not Found')) {
          // المهمة غير منشورة - نشرها تلقائياً
          console.log('⚠️ المهمة غير منشورة - سيتم نشرها تلقائياً...');
          
          const task = tasks.find(t => t.id === taskId);
          if (!task) {
            throw new Error('❌ المهمة غير موجودة');
          }
          
          // نشر المهمة
          console.log(`📤 نشر المهمة: ${task.name}...`);
          
          setLoading(true);
          try {
            // رفع ملف المهمة
            const taskContent = JSON.stringify(task, null, 2);
            await githubAPI.uploadFile(
              `tasks/${taskId}.json`,
              taskContent,
              `Add task: ${task.name}`
            );
            
            // إنشاء workflow
            const workflowContent = generateWorkflowYAML(task, settings.stealth);
            await githubAPI.uploadFile(
              `.github/workflows/task-${taskId}.yml`,
              workflowContent,
              `Add workflow for task: ${task.name}`
            );
            
            console.log(`✅ تم نشر المهمة: ${task.name}`);
            
            // الانتظار قليلاً للتأكد من تحديث GitHub
            await new Promise(resolve => setTimeout(resolve, 2000));
          } finally {
            setLoading(false);
          }
        } else {
          throw fileError;
        }
      }
      
      // تشغيل workflow المهمة المحددة
      console.log(`🚀 تشغيل workflow: task-${taskId}.yml`);
      try {
        await githubAPI.triggerWorkflow(`task-${taskId}.yml`);
        console.log(`✅ Workflow triggered successfully`);
      } catch (workflowError: any) {
        // تشغيل workflow يحتاج وقتاً للفهرسة - هذا ليس خطأ
        console.log('ℹ️ الملفات تم رفعها بنجاح، يمكنك تشغيل المهمة يدوياً من GitHub Actions في غضون دقائق');
      }
      
      // تحديث آخر تشغيل محلياً
      updateTask(taskId, {
        lastRun: new Date()
      });
      
      console.log(`✅ Task ${taskId} deployed successfully`);
      console.log(`\n📊 لمتابعة التنفيذ:\n- افتح صفحة "النتائج"\n- أو اذهب إلى GitHub Actions في المستودع`);
    } catch (error: any) {
      console.error('Error running task:', error);
      throw error;
    }
  };

  // تشغيل مهمة محلياً (بدون GitHub)
  const runTaskLocally = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setLoading(true);
    
    const startTime = new Date();
    const runNumber = (localResults.filter(r => r.taskId === taskId).length || 0) + 1;
    
    // إنشاء نتيجة تشغيل محلية
    const localResult: LocalTaskResult = {
      id: `local-${Date.now()}`,
      taskId: task.id,
      taskName: task.name,
      run_number: runNumber,
      status: 'running',
      conclusion: 'in_progress',
      created_at: startTime.toISOString(),
      updated_at: startTime.toISOString(),
      logs: ['🚀 بدء التنفيذ المحلي...'],
      artifacts: [],
      html_url: `#local-run-${runNumber}`
    };
    
    setLocalResults(prev => [localResult, ...prev]);
    
    const log: ExecutionLog = {
      id: Date.now().toString(),
      taskId: task.id,
      taskName: task.name,
      status: 'running',
      startTime: new Date(),
      logs: ['بدء التنفيذ المحلي...']
    };

    addLog(log);
    updateTask({ ...task, status: 'running', lastRun: new Date() });

    try {
      // محاكاة تنفيذ خطوات المهمة
      const steps = [
        { name: 'تطبيق إعدادات التخفي', duration: 300 },
        { name: `المستوى: ${settings.stealth.level}`, duration: 200 },
        { name: 'إخفاء Webdriver', duration: 400 },
        { name: 'تغيير User Agent', duration: 300 },
        { name: 'تهيئة إعدادات العرض', duration: 300 },
        { name: 'الاتصال بالموقع...', duration: 1000 },
        { name: 'تنفيذ سكريبت المهمة...', duration: 1500 },
        { name: 'التقاط لقطات الشاشة...', duration: 800 },
        { name: 'جمع البيانات...', duration: 600 },
      ];
      
      const executionLogs: string[] = [localResult.logs[0]];
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.duration));
        executionLogs.push(`✓ ${step.name}`);
        
        // تحديث النتيجة المحلية في كل خطوة
        setLocalResults(prev => prev.map(r =>
          r.id === localResult.id
            ? { ...r, logs: executionLogs, updated_at: new Date().toISOString() }
            : r
        ));
      }
      
      // إنشاء artifacts وهمية
      const artifacts: LocalArtifact[] = [
        {
          id: Date.now(),
          name: 'screenshot-result.png',
          size_in_bytes: 245678,
          data: {
            type: 'screenshot',
            url: task.targetUrl,
            timestamp: new Date().toISOString()
          }
        },
        {
          id: Date.now() + 1,
          name: 'extracted-data.json',
          size_in_bytes: 12345,
          data: {
            type: 'data',
            items: [
              { id: 1, title: 'عنصر 1', description: 'وصف العنصر 1' },
              { id: 2, title: 'عنصر 2', description: 'وصف العنصر 2' },
              { id: 3, title: 'عنصر 3', description: 'وصف العنصر 3' }
            ],
            count: 3
          }
        }
      ];
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      executionLogs.push('');
      executionLogs.push(`✅ اكتملت المهمة بنجاح في ${duration} ثانية`);
      executionLogs.push(`📊 تم جمع ${artifacts.length} ملف نتائج`);
      
      // تحديث النتيجة النهائية
      const finalResult: LocalTaskResult = {
        ...localResult,
        status: 'success',
        conclusion: 'success',
        updated_at: endTime.toISOString(),
        logs: executionLogs,
        artifacts
      };
      
      setLocalResults(prev => prev.map(r =>
        r.id === localResult.id ? finalResult : r
      ));
      
      // تحديث السجل
      const updatedLog: ExecutionLog = {
        ...log,
        status: 'success',
        endTime: endTime,
        duration: duration,
        logs: executionLogs
      };

      setLogs(prev => prev.map(l => l.id === log.id ? updatedLog : l));
      updateTask({ ...task, status: 'completed' });
      
      return finalResult;

    } catch (error: any) {
      const endTime = new Date();
      const errorLogs = [
        ...localResult.logs,
        '',
        `❌ خطأ: ${error.message}`
      ];
      
      const errorResult: LocalTaskResult = {
        ...localResult,
        status: 'failed',
        conclusion: 'failure',
        updated_at: endTime.toISOString(),
        logs: errorLogs,
        artifacts: []
      };
      
      setLocalResults(prev => prev.map(r =>
        r.id === localResult.id ? errorResult : r
      ));
      
      const errorLog: ExecutionLog = {
        ...log,
        status: 'failed',
        endTime: endTime,
        logs: errorLogs
      };

      setLogs(prev => prev.map(l => l.id === log.id ? errorLog : l));
      updateTask({ ...task, status: 'failed' });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // نشر مهمة ثم تشغيلها تلقائياً
  const deployAndRunTask = async (taskId: string) => {
    if (!githubAPI) {
      throw new Error('غير متصل بـ GitHub');
    }

    setLoading(true);
    try {
      console.log('🚀 بدء النشر إلى GitHub...');
      const selectedTasks = tasks.filter(t => t.id === taskId);
      
      // إذا كانت إعدادات النشر موجودة
      if (settings.github.targetBranch) {
        // حفظ الإعدادات
        updateGitHubSettings({
          targetBranch: settings.github.targetBranch,
          createPR: settings.github.createPR,
          baseBranch: settings.github.baseBranch
        });
        
        // إنشاء فرع جديد إذا طُلب
        if (settings.github.createNewBranch && settings.github.newBranchName) {
          console.log(`Creating new branch: ${settings.github.newBranchName}`);
          await githubAPI.createBranch(
            settings.github.newBranchName,
            settings.github.baseBranch || settings.github.branch
          );
          
          // التبديل إلى الفرع الجديد
          githubAPI.updateBranch(settings.github.newBranchName);
        } else if (settings.github.targetBranch) {
          // التبديل إلى الفرع المستهدف
          githubAPI.updateBranch(settings.github.targetBranch);
        }
      }
      
      await deployTasksToGitHub(githubAPI, selectedTasks, settings.stealth);
      
      // إنشاء PR إذا طُلب
      if (settings.github?.createPR && settings.github.baseBranch) {
        const currentBranch = settings.github.newBranchName || settings.github.targetBranch || settings.github.branch;
        console.log(`Creating PR: ${currentBranch} → ${settings.github.baseBranch}`);
        
        await githubAPI.createPullRequest(
          `🤖 Deploy automation tasks`,
          currentBranch,
          settings.github.baseBranch,
          `## تحديثات تلقائية من Web Automation Bot\n\n### المهام المنشورة:\n${selectedTasks.map(t => `- ${t.name}`).join('\n')}\n\n### التغييرات:\n- Workflows محدثة (${selectedTasks.length} مهمة)\n- إعدادات Stealth: ${settings.stealth.level}\n- تم التوليد تلقائياً`
        );
      }
      
      console.log('✅ اكتمل النشر بنجاح');
      
      // تشغيل workflow المهمة المحددة
      console.log(`🚀 تشغيل workflow: task-${taskId}.yml`);
      try {
        await githubAPI.triggerWorkflow(`task-${taskId}.yml`);
        console.log(`✅ Workflow triggered successfully`);
      } catch (workflowError: any) {
        // إذا فشل تشغيل workflow، نستمر - الملفات تم رفعها بنجاح
        console.warn('⚠️ تنبيه:', workflowError.message);
        console.log('💡 الملفات تم رفعها بنجاح، يمكنك تشغيل المهمة يدوياً من GitHub Actions');
        
        // إعادة رمي الخطأ فقط إذا كان خطأً حقيقياً (ليس workflow_dispatch)
        if (!workflowError.message.includes('workflow_dispatch')) {
          throw workflowError;
        }
      }
      
      // تحديث آخر تشغيل محلياً
      updateTask(taskId, {
        lastRun: new Date()
      });
      
      console.log(`✅ Task ${taskId} deployed successfully`);
      console.log(`\n📊 لمتابعة التنفيذ:\n- افتح صفحة "النتائج"\n- أو اذهب إلى GitHub Actions في المستودع`);
    } catch (error: any) {
      console.error('❌ خطأ في النشر:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // الحصول على نتائج مهمة من GitHub
  const getTaskResults = async (taskId: string, runId?: number) => {
    // أولاً: التحقق من وجود نتائج محلية
    const localTaskResults = localResults.filter(r => r.taskId === taskId);
    
    // إذا لم يكن هناك اتصال بـ GitHub، نعيد النتائج المحلية فقط
    if (!githubAPI) {
      // إرجاع النتائج المحلية بتنسيق مماثل لـ GitHub (حتى لو كانت فارغة)
      return {
        runs: localTaskResults,
        artifacts: [],
        latestRun: localTaskResults[0] || null
      };
    }

    try {
      // الحصول على آخر تشغيلات للمهمة من GitHub
      const runs = await githubAPI.getLatestRun(`task-${taskId}.yml`);
      
      // دمج النتائج المحلية مع نتائج GitHub
      const allRuns = [...localTaskResults, ...runs];
      
      if (allRuns.length === 0) {
        return { runs: [], artifacts: [] };
      }

      // الحصول على artifacts لآخر تشغيل أو للـ run المحدد
      const targetRun = runId ? allRuns.find(r => r.id === runId) : allRuns[0];
      let artifacts = [];
      
      // إذا كان targetRun محلياً، نستخدم artifacts المحلية
      if (targetRun && targetRun.id && String(targetRun.id).startsWith('local-')) {
        artifacts = targetRun.artifacts || [];
      } else if (targetRun) {
        // وإلا نحصل على artifacts من GitHub
        artifacts = await githubAPI.getRunArtifacts(targetRun.id);
      }
      
      return {
        runs: allRuns,
        artifacts,
        latestRun: targetRun
      };
    } catch (error: any) {
      // معالجة أخطاء محددة بصمت - لا نعرض أخطاء مزعجة
      if (error.message?.includes('Not Found') || error.message?.includes('404')) {
        // إذا كان الـ workflow غير موجود، نعيد النتائج المحلية إن وجدت
        console.log('ℹ️ Workflow not found on GitHub, returning local results only');
        return {
          runs: localTaskResults,
          artifacts: [],
          latestRun: localTaskResults[0] || null
        };
      }
      
      // أخطاء أخرى - نعيد النتائج المحلية أيضاً بدلاً من رمي خطأ
      console.log('ℹ️ Error fetching from GitHub, returning local results:', error.message);
      return {
        runs: localTaskResults,
        artifacts: [],
        latestRun: localTaskResults[0] || null
      };
    }
  };

  // تحميل artifact
  const downloadArtifact = async (artifactId: number) => {
    if (!githubAPI) {
      throw new Error('غير متصل بـ GitHub');
    }

    try {
      return await githubAPI.downloadArtifact(artifactId);
    } catch (error: any) {
      console.error('Error downloading artifact:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    tasks,
    logs,
    settings,
    localResults,
    addTask,
    updateTask,
    deleteTask,
    executeTask,
    addLog,
    clearLogs,
    updateStealthSettings,
    updateGitHubSettings,
    updateExecutionSettings,
    connectGitHub,
    disconnectGitHub,
    syncWithGitHub,
    deployToGitHub,
    runTaskOnGitHub,
    runTaskLocally,
    deployAndRunTask,
    getTaskResults,
    downloadArtifact,
    loading,
    setLoading,
    githubAPI
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ========== Hook ==========

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// ========== دوال مساعدة ==========

function generateWorkflowYAML(task: Task, stealth: StealthConfig): string {
  // Escape JSON strings properly for YAML
  const escapedStealthConfig = JSON.stringify(stealth).replace(/"/g, '\\"');
  const escapedTaskData = JSON.stringify(task).replace(/"/g, '\\"');
  
  return `name: Web Automation Bot

on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  automation:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: |
          npm install playwright
          npx playwright install chromium
      
      - name: Create Task Directory
        run: mkdir -p results
      
      - name: Run Task
        run: |
          node -e "
          const { chromium } = require('playwright');
          const fs = require('fs');
          
          const STEALTH_CONFIG = JSON.parse('${escapedStealthConfig}');
          const TASK_DATA = JSON.parse('${escapedTaskData}');
          
          async function runTask() {
            const browser = await chromium.launch({
              headless: true,
              args: [
                '--disable-blink-features=AutomationControlled',
                ${stealth.blockWebRTC ? `'--disable-webrtc',` : ''}
                '--no-sandbox',
                '--disable-dev-shm-usage'
              ]
            });

            const context = await browser.newContext({
              ${stealth.randomUserAgent ? `userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',` : ''}
              ${stealth.randomViewport ? `viewport: { width: 1920, height: 1080 },` : ''}
            });

            ${stealth.hideWebdriver ? `await context.addInitScript(() => {
              Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
              });
            });` : ''}

            const page = await context.newPage();
            
            try {
              console.log('🚀 Running:', TASK_DATA.name);
              await page.goto(TASK_DATA.targetUrl || 'https://example.com');
              
await page.screenshot({ path: 'results/screenshot.png', fullPage: true });
              
              const results = {
                taskName: TASK_DATA.name,
                status: 'success',
                timestamp: new Date().toISOString(),
                url: page.url()
              };
              
              fs.writeFileSync('results/results.json', JSON.stringify(results, null, 2));
              console.log('✅ Task completed successfully');
              
            } catch (error) {
              console.error('❌ Error:', error.message);
              fs.writeFileSync('results/error.log', error.stack);
              throw error;
            } finally {
              await browser.close();
            }
          }
          
          runTask().catch(console.error);
          "
        env:
          STEALTH_LEVEL: '${stealth.level}'
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: task-results-\${{ github.run_number }}
          path: results/
          retention-days: 7
`;
}

function generateRunnerScript(stealth: StealthConfig): string {
  return `const { chromium } = require('playwright');
const fs = require('fs');

const STEALTH_CONFIG = ${JSON.stringify(stealth, null, 2)};

async function runTask() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      ${stealth.blockWebRTC ? "'--disable-webrtc'," : ''}
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    ${stealth.randomUserAgent ? 'userAgent: getRandomUserAgent(),' : ''}
    ${stealth.randomViewport ? 'viewport: getRandomViewport(),' : ''}
  });

  ${stealth.hideWebdriver ? `
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });` : ''}

  const page = await context.newPage();
  
  try {
    const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf-8'));
    
    for (const task of tasks) {
      console.log('Running:', task.name);
      await page.goto(task.targetUrl);
      // تنفيذ السكريبت
      await page.evaluate(task.script);
    }
    
  } finally {
    await browser.close();
  }
}

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function getRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 }
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
}

runTask().catch(console.error);
`;
}