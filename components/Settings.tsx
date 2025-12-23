import { Github, Server, Key, Bell, Zap, Globe } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [settings, setSettings] = useState({
    githubEnabled: true,
    githubRepo: 'username/automation-scripts',
    githubToken: '••••••••••••••••',
    executionMode: 'cloud',
    apiKey: '••••••••••••••••',
    notifications: true,
    notificationEmail: 'user@example.com',
    maxConcurrentTasks: 5,
    defaultTimeout: 30,
    browserHeadless: true,
    screenshotQuality: 'high'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* GitHub Integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg">تكامل GitHub</h3>
            <p className="text-sm text-slate-600">ربط المهام والسكريبتات مع GitHub</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p>تفعيل التكامل مع GitHub</p>
              <p className="text-sm text-slate-600">مزامنة السكريبتات تلقائياً</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.githubEnabled}
                onChange={(e) => setSettings({ ...settings, githubEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.githubEnabled && (
            <>
              <div>
                <label className="block text-sm mb-2">المستودع (Repository)</label>
                <input
                  type="text"
                  value={settings.githubRepo}
                  onChange={(e) => setSettings({ ...settings, githubRepo: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username/repository"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">رمز الوصول (Personal Access Token)</label>
                <input
                  type="password"
                  value={settings.githubToken}
                  onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ghp_xxxxxxxxxxxxx"
                />
                <p className="text-xs text-slate-500 mt-1">
                  احصل على رمز الوصول من: GitHub {'>'} Settings {'>'} Developer settings {'>'} Personal access tokens
                </p>
              </div>

              <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                اختبار الاتصال
              </button>
            </>
          )}
        </div>
      </div>

      {/* Execution Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg">إعدادات التنفيذ</h3>
            <p className="text-sm text-slate-600">تخصيص بيئة التشغيل</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">وضع التنفيذ</label>
            <select
              value={settings.executionMode}
              onChange={(e) => setSettings({ ...settings, executionMode: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cloud">السحابة (Cloud) - موصى به</option>
              <option value="local">محلي (Local)</option>
              <option value="hybrid">هجين (Hybrid)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">الحد الأقصى للمهام المتزامنة</label>
              <input
                type="number"
                value={settings.maxConcurrentTasks}
                onChange={(e) => setSettings({ ...settings, maxConcurrentTasks: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">المهلة الافتراضية (ثانية)</label>
              <input
                type="number"
                value={settings.defaultTimeout}
                onChange={(e) => setSettings({ ...settings, defaultTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="300"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p>وضع المتصفح بدون واجهة (Headless)</p>
              <p className="text-sm text-slate-600">أسرع لكن بدون واجهة مرئية</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.browserHeadless}
                onChange={(e) => setSettings({ ...settings, browserHeadless: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg">إعدادات API</h3>
            <p className="text-sm text-slate-600">مفاتيح الوصول للـ API</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">مفتاح API</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={settings.apiKey}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              />
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                نسخ
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                إعادة إنشاء
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="mb-2">استخدم هذا المفتاح للوصول إلى API:</p>
            <code className="block bg-white p-2 rounded text-xs overflow-x-auto" dir="ltr">
              curl -H "Authorization: Bearer YOUR_API_KEY" https://api.automation.com/tasks
            </code>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg">الإشعارات</h3>
            <p className="text-sm text-slate-600">إدارة التنبيهات والإشعارات</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p>تفعيل الإشعارات</p>
              <p className="text-sm text-slate-600">إشعارات عند اكتمال أو فشل المهام</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.notifications && (
            <div>
              <label className="block text-sm mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
          )}
        </div>
      </div>

      {/* Alternative Platforms */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg">منصات بديلة</h3>
            <p className="text-sm text-slate-600">بدائل GitHub لحفظ السكريبتات</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h4>GitLab</h4>
                <p className="text-sm text-slate-600">بديل قوي لـ GitHub مع CI/CD مدمج</p>
              </div>
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                ربط
              </button>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h4>Bitbucket</h4>
                <p className="text-sm text-slate-600">من Atlassian مع تكامل Jira</p>
              </div>
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                ربط
              </button>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h4>Self-Hosted Git</h4>
                <p className="text-sm text-slate-600">استضافة خاصة على خادمك</p>
              </div>
              <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                إعداد
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          إعادة تعيين
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
