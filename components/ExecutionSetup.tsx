import { useState } from 'react';
import { Github, Cloud, Server, Zap, CheckCircle, Copy, ExternalLink, Code } from 'lucide-react';

export function ExecutionSetup() {
  const [selectedMode, setSelectedMode] = useState<'github' | 'cloud' | 'hybrid'>('github'); // تغيير الافتراضي إلى 'github'
  const [githubSetup, setGithubSetup] = useState({
    repo: '',
    token: '',
    branch: 'main'
  });

  const modes = [
    {
      id: 'github',
      name: 'GitHub Actions',
      icon: Github,
      color: 'slate',
      pros: [
        'مجاني حتى 2000 دقيقة شهرياً',
        'موثوق ومستقر',
        'سهولة الإدارة عبر Git',
        'سجل تنفيذ كامل'
      ],
      cons: [
        'بطء في البدء (Cold Start)',
        'محدود بوقت التنفيذ',
        'يحتاج إعداد أولي'
      ],
      recommended: 'للمهام المجدولة والدورية'
    },
    {
      id: 'cloud',
      name: 'تنفيذ سحابي مباشر',
      icon: Cloud,
      color: 'blue',
      pros: [
        'سرعة فورية',
        'لا يحتاج GitHub',
        'واجهة مباشرة',
        'مناسب للتجارب السريعة'
      ],
      cons: [
        'يحتاج اشتراك مدفوع بعد الحد المجاني',
        'أقل مرونة في التخصيص'
      ],
      recommended: 'للتنفيذ الفوري والتجارب'
    },
    {
      id: 'hybrid',
      name: 'هجين (موصى به)',
      icon: Zap,
      color: 'purple',
      pros: [
        'الأفضل من الطريقتين',
        'تنفيذ فوري للمهام العاجلة',
        'جدولة عبر GitHub للمهام الدورية',
        'مرونة كاملة'
      ],
      cons: [
        'يحتاج إعداد الطريقتين'
      ],
      recommended: 'الخيار الأمثل لجميع الاستخدامات'
    }
  ];

  const selectedModeData = modes.find(m => m.id === selectedMode);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Server className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl">بيئة التنفيذ</h1>
            <p className="text-slate-600">اختر كيفية تشغيل مهامك</p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id as any)}
            className={`p-6 border-2 rounded-xl transition-all text-right ${
              selectedMode === mode.id
                ? `border-${mode.color}-500 bg-${mode.color}-50`
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`w-12 h-12 bg-${mode.color}-100 rounded-lg flex items-center justify-center mb-4`}>
              <mode.icon className={`w-6 h-6 text-${mode.color}-600`} />
            </div>
            <h3 className="text-lg mb-2">{mode.name}</h3>
            <p className="text-sm text-slate-600">{mode.recommended}</p>
            {selectedMode === mode.id && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>محدد</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mode Details */}
      {selectedModeData && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl mb-4">{selectedModeData.name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm text-green-600 mb-3">ا��مميزات</h4>
              <ul className="space-y-2">
                {selectedModeData.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-orange-600 mb-3">الملاحظات</h4>
              <ul className="space-y-2">
                {selectedModeData.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 mt-0.5">⚠️</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Actions Setup */}
      {(selectedMode === 'github' || selectedMode === 'hybrid') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Github className="w-8 h-8" />
            <div>
              <h3 className="text-xl">إعداد GitHub Actions</h3>
              <p className="text-sm text-slate-600">ربط المهام مع GitHub لتنفيذ تلقائي</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-2">رابط المستودع (Repository URL)</label>
              <input
                type="text"
                value={githubSetup.repo}
                onChange={(e) => setGithubSetup({ ...githubSetup, repo: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div>
              <label className="block mb-2">Personal Access Token</label>
              <input
                type="password"
                value={githubSetup.token}
                onChange={(e) => setGithubSetup({ ...githubSetup, token: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
              >
                <span>إنشاء Token جديد</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block mb-2">الفرع (Branch)</label>
              <input
                type="text"
                value={githubSetup.branch}
                onChange={(e) => setGithubSetup({ ...githubSetup, branch: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="main"
              />
            </div>
          </div>

          <button className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors mb-6">
            اختبار الاتصال
          </button>

          {/* Workflow Template */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm">نموذج GitHub Actions Workflow</h4>
              <button className="flex items-center gap-2 px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm">
                <Copy className="w-4 h-4" />
                <span>نسخ</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">
{`name: Web Automation Task

on:
  schedule:
    - cron: '0 */6 * * *'  # كل 6 ساعات
  workflow_dispatch:  # تشغيل يدوي

jobs:
  automation:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        run: |
          npm install playwright
          npx playwright install chromium
      
      - name: Run automation script
        run: node automation-script.js
        env:
          TARGET_URL: \${{ secrets.TARGET_URL }}
          CREDENTIALS: \${{ secrets.CREDENTIALS }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: automation-results
          path: results/`}
            </pre>
          </div>
        </div>
      )}

      {/* Cloud Execution Setup */}
      {(selectedMode === 'cloud' || selectedMode === 'hybrid') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-xl">التنفيذ السحابي</h3>
              <p className="text-sm text-slate-600">تشغيل المهام فوراً عبر خدمات سحابية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="mb-3">خدمات موصى بها:</h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5>Browserless.io</h5>
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">موصى به</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">خدمة متخصصة في Browser Automation</p>
                  <div className="flex gap-2">
                    <a
                      href="https://browserless.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <span>زيارة الموقع</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <h5 className="mb-2">Apify</h5>
                  <p className="text-sm text-slate-600 mb-2">منصة شاملة للـ Web Scraping والأتمتة</p>
                  <a
                    href="https://apify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <span>زيارة الموقع</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <h5 className="mb-2">Bright Data</h5>
                  <p className="text-sm text-slate-600 mb-2">حلول احترافية للشركات</p>
                  <a
                    href="https://brightdata.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <span>زيارة الموقع</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>مثال على الاتصال</span>
              </h4>
              <pre className="bg-white p-3 rounded text-xs overflow-x-auto border border-slate-200" dir="ltr">
{`// باستخدام Browserless
const browser = await chromium.connectOverCDP(
  'wss://chrome.browserless.io?token=YOUR_TOKEN'
);

const page = await browser.newPage();
await page.goto('https://example.com');
// تنفيذ المهمة...
await browser.close();`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Quick Deployment */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-xl mb-3">نشر سريع</h3>
        <p className="mb-4 opacity-90">قم بنشر جميع مهامك بضغطة واحدة</p>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            نشر إلى GitHub
          </button>
          <button className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-colors">
            إعداد البيئة السحابية
          </button>
        </div>
      </div>
    </div>
  );
}