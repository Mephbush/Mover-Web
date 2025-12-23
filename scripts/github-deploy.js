/**
 * سكريبت نشر المهام إلى GitHub Actions
 */

const fs = require('fs').promises;
const path = require('path');

// ========== إعدادات GitHub ==========

const GITHUB_CONFIG = {
  owner: process.env.GITHUB_OWNER || 'your-username',
  repo: process.env.GITHUB_REPO || 'automation-bot',
  token: process.env.GITHUB_TOKEN || '',
  branch: process.env.GITHUB_BRANCH || 'main'
};

// ========== قوالب GitHub Actions ==========

function generateWorkflowYAML(tasks) {
  const cronJobs = tasks
    .filter(t => t.schedule)
    .map(t => `    - cron: '${convertScheduleToCron(t.schedule)}'  # ${t.name}`)
    .join('\n');

  return `name: Web Automation Bot

on:
  schedule:
${cronJobs || '    - cron: \'0 */6 * * *\'  # كل 6 ساعات'}
  
  workflow_dispatch:
    inputs:
      task_id:
        description: 'معرف المهمة للتشغيل'
        required: false
        type: string

jobs:
  automation:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        task_id: ${JSON.stringify(tasks.map(t => t.id))}
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: |
          npm install playwright playwright-extra puppeteer-extra-plugin-stealth
          npx playwright install chromium
      
      - name: Run Automation Task
        run: node scripts/run-task.js \${{ matrix.task_id }}
        env:
          TASK_CONFIG: \${{ secrets.TASK_CONFIG }}
          CREDENTIALS: \${{ secrets.CREDENTIALS }}
          STEALTH_MODE: 'true'
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-\${{ matrix.task_id }}
          path: |
            results/
            screenshots/
            logs/
          retention-days: 7
      
      - name: Send Notification
        if: failure()
        run: |
          echo "❌ فشلت المهمة: \${{ matrix.task_id }}"
          # يمكن إضافة إشعارات Telegram/Discord/Email هنا
`;
}

function generateTaskRunner(tasks) {
  return `/**
 * سكريبت تشغيل المهام في GitHub Actions
 */

const { runStealthAutomation } = require('./stealth-automation');
const fs = require('fs').promises;
const path = require('path');

// قائمة المهام
const TASKS = ${JSON.stringify(tasks, null, 2)};

async function runTask(taskId) {
  console.log('🔍 البحث عن المهمة:', taskId);
  
  const task = TASKS.find(t => t.id === taskId);
  if (!task) {
    console.error('❌ المهمة غير موجودة');
    process.exit(1);
  }
  
  console.log('🚀 تشغيل المهمة:', task.name);
  console.log('📝 الوصف:', task.description);
  console.log('🎯 الهدف:', task.targetUrl);
  
  const startTime = Date.now();
  
  try {
    // إعداد المهمة
    const taskConfig = {
      type: task.type,
      url: task.targetUrl,
      script: task.script,
      screenshot: true
    };
    
    // تشغيل بوضع Stealth
    const result = await runStealthAutomation(task.targetUrl, taskConfig);
    
    const duration = (Date.now() - startTime) / 1000;
    
    // حفظ النتائج
    await saveResults(task, result, duration);
    
    console.log(\`✅ اكتملت المهمة في \${duration.toFixed(2)} ثانية\`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ فشلت المهمة:', error.message);
    console.error(error.stack);
    
    await saveError(task, error);
    process.exit(1);
  }
}

async function saveResults(task, result, duration) {
  const resultsDir = path.join(__dirname, '..', 'results');
  await fs.mkdir(resultsDir, { recursive: true });
  
  const resultFile = path.join(resultsDir, \`\${task.id}-\${Date.now()}.json\`);
  
  await fs.writeFile(resultFile, JSON.stringify({
    taskId: task.id,
    taskName: task.name,
    status: 'success',
    duration,
    result,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log('💾 تم حفظ النتائج:', resultFile);
}

async function saveError(task, error) {
  const logsDir = path.join(__dirname, '..', 'logs');
  await fs.mkdir(logsDir, { recursive: true });
  
  const errorFile = path.join(logsDir, \`error-\${task.id}-\${Date.now()}.json\`);
  
  await fs.writeFile(errorFile, JSON.stringify({
    taskId: task.id,
    taskName: task.name,
    status: 'failed',
    error: {
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  }, null, 2));
}

// تشغيل المهمة
const taskId = process.argv[2];
if (!taskId) {
  console.error('❌ الرجاء تحديد معرف المهمة');
  console.log('الاستخدام: node run-task.js <task-id>');
  process.exit(1);
}

runTask(taskId);
`;
}

function generatePackageJSON() {
  return {
    name: 'web-automation-bot',
    version: '1.0.0',
    description: 'روبوت أتمتة ويب ذكي مع حماية من كاشفات الروبوتات',
    main: 'scripts/run-task.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
      stealth: 'node scripts/stealth-automation.js'
    },
    keywords: ['automation', 'web-scraping', 'playwright', 'stealth'],
    author: '',
    license: 'MIT',
    dependencies: {
      playwright: '^1.40.0',
      'playwright-extra': '^4.3.6',
      'puppeteer-extra-plugin-stealth': '^2.11.2'
    }
  };
}

function generateREADME(tasks) {
  return `# 🤖 روبوت الأتمتة الذكي

نظام أتمتة ويب شامل مع حماية متقدمة من كاشفات الروبوتات.

## ✨ المميزات

- 🛡️ تقنيات Stealth متقدمة لتجاوز أنظمة الكشف
- 🤖 محاكاة سلوك بشري واقعي
- 🔄 تشغيل تلقائي عبر GitHub Actions
- 📊 جمع بيانات ذكي
- 🔐 تسجيل دخول آلي
- 📸 التقاط لقطات شاشة

## 📋 المهام المُعدّة

${tasks.map((t, i) => `${i + 1}. **${t.name}**: ${t.description}`).join('\n')}

## 🚀 التشغيل

### محلياً
\`\`\`bash
npm install
node scripts/run-task.js <task-id>
\`\`\`

### عبر GitHub Actions
يتم تشغيل المهام تلقائياً حسب الجدول المحدد في \`.github/workflows/automation.yml\`

## 🛡️ تقنيات التخفي

- ✅ إخفاء navigator.webdriver
- ✅ User Agent عشوائي
- ✅ Viewport متغير
- ✅ إخفاء WebGL/Canvas Fingerprint
- ✅ تأخيرات عشوائية
- ✅ حركة ماوس طبيعية
- ✅ سرعة كتابة بشرية
- ✅ تمرير سلس للصفحات

## 📦 المتطلبات

- Node.js 18+
- Playwright

## 🔧 الإعداد

1. استنسخ المستودع
2. قم بتثبيت الحزم: \`npm install\`
3. أضف Secrets في GitHub:
   - \`TASK_CONFIG\`: إعدادات المهام
   - \`CREDENTIALS\`: بيانات الدخول (مشفرة)

## 📝 ملاحظات

- جميع المهام تعمل بوضع Stealth تلقائياً
- النتائج تُحفظ في مجلد \`results/\`
- السجلات في مجلد \`logs/\`

## 📄 الترخيص

MIT License
`;
}

function convertScheduleToCron(schedule) {
  // تحويل جدول بسيط إلى Cron
  const schedules = {
    'hourly': '0 * * * *',
    'daily': '0 0 * * *',
    'weekly': '0 0 * * 0',
    'every-6-hours': '0 */6 * * *',
    'every-12-hours': '0 */12 * * *'
  };
  
  return schedules[schedule] || '0 */6 * * *';
}

// ========== نشر إلى GitHub ==========

async function deployToGitHub(tasks) {
  console.log('🚀 بدء عملية النشر إلى GitHub...');
  
  try {
    // إنشاء هيكل المجلدات
    const dirs = [
      '.github/workflows',
      'scripts',
      'results',
      'logs',
      'screenshots'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // إنشاء الملفات
    console.log('📝 إنشاء ملفات GitHub Actions...');
    
    // Workflow YAML
    await fs.writeFile(
      '.github/workflows/automation.yml',
      generateWorkflowYAML(tasks)
    );
    
    // Task Runner
    await fs.writeFile(
      'scripts/run-task.js',
      generateTaskRunner(tasks)
    );
    
    // Package.json
    await fs.writeFile(
      'package.json',
      JSON.stringify(generatePackageJSON(), null, 2)
    );
    
    // README
    await fs.writeFile(
      'README.md',
      generateREADME(tasks)
    );
    
    // .gitignore
    await fs.writeFile(
      '.gitignore',
      `node_modules/
results/
logs/
screenshots/
.env
*.log
`
    );
    
    console.log('✅ تم إنشاء جميع الملفات بنجاح!');
    console.log('');
    console.log('📋 الخطوات التالية:');
    console.log('1. ارفع الملفات إلى GitHub:');
    console.log('   git add .');
    console.log('   git commit -m "Add automation workflows"');
    console.log('   git push origin main');
    console.log('');
    console.log('2. أضف Secrets في GitHub Repository:');
    console.log('   Settings > Secrets and variables > Actions');
    console.log('   - TASK_CONFIG');
    console.log('   - CREDENTIALS');
    console.log('');
    console.log('3. شغّل Workflow من:');
    console.log('   Actions > Web Automation Bot > Run workflow');
    
  } catch (error) {
    console.error('❌ خطأ في النشر:', error.message);
    throw error;
  }
}

// ========== استخدام عبر API ==========

async function createGitHubRepo(tasks) {
  const { Octokit } = require('@octokit/rest');
  
  const octokit = new Octokit({
    auth: GITHUB_CONFIG.token
  });
  
  try {
    // إنشاء المستودع
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: GITHUB_CONFIG.repo,
      description: 'Web Automation Bot with Stealth Features',
      private: false,
      auto_init: true
    });
    
    console.log('✅ تم إنشاء المستودع:', repo.html_url);
    
    // رفع الملفات
    const files = {
      '.github/workflows/automation.yml': generateWorkflowYAML(tasks),
      'scripts/run-task.js': generateTaskRunner(tasks),
      'scripts/stealth-automation.js': await fs.readFile('./scripts/stealth-automation.js', 'utf-8'),
      'package.json': JSON.stringify(generatePackageJSON(), null, 2),
      'README.md': generateREADME(tasks)
    };
    
    for (const [filePath, content] of Object.entries(files)) {
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_CONFIG.owner,
        repo: GITHUB_CONFIG.repo,
        path: filePath,
        message: \`Add \${filePath}\`,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_CONFIG.branch
      });
      
      console.log('✅ تم رفع:', filePath);
    }
    
    console.log('🎉 اكتمل النشر بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستودع:', error.message);
    throw error;
  }
}

// ========== التصدير ==========

module.exports = {
  deployToGitHub,
  createGitHubRepo,
  generateWorkflowYAML,
  generateTaskRunner
};

// ========== التشغيل المباشر ==========

if (require.main === module) {
  // مثال على المهام
  const sampleTasks = [
    {
      id: 'task-1',
      name: 'جمع أسعار المنتجات',
      description: 'استخراج الأسعار من متجر إلكتروني',
      type: 'scraping',
      targetUrl: 'https://example-store.com',
      schedule: 'daily',
      script: '// scraping script'
    }
  ];
  
  deployToGitHub(sampleTasks)
    .then(() => console.log('✨ تم!'))
    .catch(error => {
      console.error('💥 فشل:', error);
      process.exit(1);
    });
}
