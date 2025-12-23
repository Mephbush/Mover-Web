import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Dashboard } from './Dashboard';
import { TaskEditor } from './TaskEditor';
import { ScriptLibrary } from './ScriptLibrary';
import { ExecutionLogs } from './ExecutionLogs';
import { Settings } from './Settings';
import { QuickActions } from './QuickActions';
import { VisualBuilder } from './VisualBuilder';
import { AdvancedVisualBuilder } from './AdvancedVisualBuilder';
import { DeploymentAndExecution } from './DeploymentAndExecution';
import { StealthSettings } from './StealthSettings';
import { ErrorAnalyzer } from './ErrorAnalyzer';
import { BotDetectionTester } from './BotDetectionTester';
import { SmartTaskBuilder } from './SmartTaskBuilder';
import { AIBrainControl } from './AIBrainControl';
import { LiveLearningMonitor } from './LiveLearningMonitor';
import { TaskScheduler } from './TaskScheduler';
import { StepExecutionMonitor } from './StepExecutionMonitor';
import { Bot, Code, Library, History, Settings as SettingsIcon, Zap, Blocks, Server, Github, Shield, Loader, AlertTriangle, Target, Sparkles, LogOut, User, Brain, Activity, Clock, Eye } from 'lucide-react';
import { Button } from './ui/button';
import type { Task } from '../types';

export function MainApp() {
  const { tasks, logs, settings, loading, addTask, updateTask } = useApp();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quick' | 'visual' | 'smart-builder' | 'editor' | 'library' | 'logs' | 'deployment' | 'stealth' | 'bot-test' | 'error-analyzer' | 'ai-brain' | 'learning-monitor' | 'scheduler' | 'step-monitor' | 'file-preview' | 'settings'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Bot },
    { id: 'quick', label: 'إجراءات سريعة', icon: Zap },
    { id: 'smart-builder', label: 'منشئ ذكي', icon: Sparkles },
    { id: 'visual', label: 'منشئ مرئي', icon: Blocks },
    { id: 'editor', label: 'محرر متقدم', icon: Code },
    { id: 'library', label: 'المكتبة', icon: Library },
    { id: 'logs', label: 'السجل', icon: History },
    { id: 'scheduler', label: 'جدولة المهام', icon: Clock },
    { id: 'step-monitor', label: 'مراقبة الخطوات', icon: Eye },
    { id: 'deployment', label: 'البيئة والنشر', icon: Server },
    { id: 'stealth', label: 'التخفي', icon: Shield },
    { id: 'bot-test', label: 'اختبار الروبوت', icon: Target },
    { id: 'error-analyzer', label: 'محلل الأخطاء', icon: AlertTriangle },
    { id: 'ai-brain', label: 'عقل AI', icon: Brain },
    { id: 'learning-monitor', label: 'مراقبة التعلم', icon: Activity },
    { id: 'settings', label: 'الإعدادات', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg">جاري التنفيذ...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">روبوت الأتمتة الذكي</h1>
                <p className="text-sm text-slate-500">نظام أتمتة شامل للويب</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Stealth Level Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                <span>
                  {settings.stealth.level === 'basic' && 'أساسي'}
                  {settings.stealth.level === 'advanced' && 'متقدم'}
                  {settings.stealth.level === 'maximum' && 'أقصى حماية'}
                </span>
              </div>
              
              {/* GitHub Status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                settings.github.connected 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <Github className="w-4 h-4" />
                <span>{settings.github.connected ? 'متصل' : 'غير متصل'}</span>
              </div>
              
              {/* Tasks Count */}
              <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {tasks.length} مهمة
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            logs={logs}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setActiveTab('editor');
            }}
            onQuickAction={() => setActiveTab('quick')}
          />
        )}
        {activeTab === 'quick' && (
          <QuickActions
            onTaskCreated={(task) => {
              addTask(task);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'visual' && (
          <AdvancedVisualBuilder
            onTaskCreated={(task) => {
              addTask(task);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'smart-builder' && (
          <SmartTaskBuilder
            onTaskCreated={(task) => {
              addTask(task);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'editor' && (
          <TaskEditor
            task={selectedTask}
            onSave={(task) => {
              if (selectedTask) {
                updateTask(task);
              } else {
                addTask(task);
              }
              setSelectedTask(null);
              setActiveTab('dashboard');
            }}
            onCancel={() => {
              setSelectedTask(null);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'library' && (
          <ScriptLibrary
            onSelectTemplate={(template) => {
              setSelectedTask(template);
              setActiveTab('editor');
            }}
          />
        )}
        {activeTab === 'logs' && <ExecutionLogs logs={logs} />}
        {activeTab === 'deployment' && <DeploymentAndExecution />}
        {activeTab === 'stealth' && <StealthSettings />}
        {activeTab === 'bot-test' && <BotDetectionTester />}
        {activeTab === 'error-analyzer' && <ErrorAnalyzer />}
        {activeTab === 'ai-brain' && <AIBrainControl />}
        {activeTab === 'learning-monitor' && <LiveLearningMonitor />}
        {activeTab === 'scheduler' && <TaskScheduler tasks={tasks} />}
        {activeTab === 'step-monitor' && <StepExecutionMonitor />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* User Profile and Sign Out */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 border border-slate-200">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm">{user?.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
