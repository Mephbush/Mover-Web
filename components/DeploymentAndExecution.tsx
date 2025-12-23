import { useState } from 'react';
import { Server, Github, Upload, Play, Settings, FolderGit2, GitBranch, GitPullRequest, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { GitHubIntegration } from './GitHubIntegration';
import { ExecutionSetup } from './ExecutionSetup';

export function DeploymentAndExecution() {
  const { settings } = useApp();
  const [activeSection, setActiveSection] = useState<'overview' | 'github' | 'execution'>('github'); // جعل GitHub الافتراضي دائماً

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              <Server className="w-7 h-7 text-blue-600" />
              <span>البيئة والنشر</span>
            </h2>
            <p className="text-slate-600 mt-1">
              إدارة بيئة التنفيذ والنشر على GitHub Actions
            </p>
          </div>

          {/* Quick Status */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              settings.github.connected 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <Github className="w-5 h-5" />
              <span className="font-medium">
                {settings.github.connected ? 'متصل بـ GitHub' : 'غير متصل'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                activeSection === 'overview'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Server className="w-5 h-5" />
              <span className="font-medium">نظرة عامة</span>
            </button>

            <button
              onClick={() => setActiveSection('github')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                activeSection === 'github'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Github className="w-5 h-5" />
              <span className="font-medium">ربط GitHub</span>
            </button>

            <button
              onClick={() => setActiveSection('execution')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                activeSection === 'execution'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Play className="w-5 h-5" />
              <span className="font-medium">بيئة التنفيذ</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub Status Card */}
                <div className={`p-6 rounded-xl border-2 ${
                  settings.github.connected
                    ? 'border-green-200 bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      settings.github.connected ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      <Github className={`w-6 h-6 ${
                        settings.github.connected ? 'text-green-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">GitHub</h3>
                      <p className="text-sm text-slate-600">التخزين السحابي</p>
                    </div>
                  </div>

                  {settings.github.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">متصل</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>المستودع: {settings.github.owner}/{settings.github.repo}</p>
                        <p className="mt-1">الفرع: {settings.github.branch || 'main'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">غير متصل</span>
                      </div>
                      <button
                        onClick={() => setActiveSection('github')}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        ربط الآن
                      </button>
                    </div>
                  )}
                </div>

                {/* Execution Environment Card */}
                <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Server className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">بيئة التنفيذ</h3>
                      <p className="text-sm text-slate-600">Playwright & Puppeteer</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">جاهزة</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>الإصدار: v1.40.0</p>
                      <p className="mt-1">المتصفحات: Chromium, Firefox, WebKit</p>
                    </div>
                    <button
                      onClick={() => setActiveSection('execution')}
                      className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      تكوين البيئة
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>إجراءات سريعة</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveSection('github')}
                    disabled={!settings.github.connected}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FolderGit2 className="w-5 h-5 text-blue-600" />
                    <div className="text-right">
                      <p className="font-medium text-sm">رفع المهام</p>
                      <p className="text-xs text-slate-600">نشر على GitHub</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSection('github')}
                    disabled={!settings.github.connected}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitBranch className="w-5 h-5 text-green-600" />
                    <div className="text-right">
                      <p className="font-medium text-sm">إنشاء فرع</p>
                      <p className="text-xs text-slate-600">فرع جديد</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSection('github')}
                    disabled={!settings.github.connected}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitPullRequest className="w-5 h-5 text-purple-600" />
                    <div className="text-right">
                      <p className="font-medium text-sm">Pull Request</p>
                      <p className="text-xs text-slate-600">طلب دمج</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Documentation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold mb-3">📚 كيفية الاستخدام</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex gap-3">
                    <span className="font-semibold text-blue-600">1.</span>
                    <p>
                      <strong>ربط GitHub:</strong> قم بالاتصال بمستودع GitHub الخاص بك من تبويب "ربط GitHub"
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-blue-600">2.</span>
                    <p>
                      <strong>إعداد البيئة:</strong> قم بتكوين بيئة التنفيذ (Playwright/Puppeteer) من تبويب "بيئة التنفيذ"
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-blue-600">3.</span>
                    <p>
                      <strong>نشر المهام:</strong> رفع المهام إلى GitHub وتشغيلها على GitHub Actions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'github' && <GitHubIntegration />}
          {activeSection === 'execution' && <ExecutionSetup />}
        </div>
      </div>
    </div>
  );
}