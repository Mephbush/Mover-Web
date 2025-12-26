/**
 * عرض توضيحي للعقل المحسّن
 * Enhanced Brain System Demo
 * 
 * يوضح كيفية استخدام جميع الأنظمة المحسّنة:
 * 1. محرك المحددات فائق السرعة
 * 2. محرك الفهم العصبي
 * 3. نظام استرجاع الأخطاء الذكي
 * 4. التكامل الموحد
 */

import { turboSelectorEngine, TurboFindResult } from './turbo-selector-engine';
import { neuralUnderstandingEngine, ContextSignature, PredictionResult } from './neural-understanding-engine';
import { intelligentErrorRecovery, ErrorContext } from './intelligent-error-recovery';
import { brainStrengthenerCore, EnhancedSearchResult, BrainEnhancementMetrics } from './brain-strengthener-core';

/**
 * أمثلة على استخدام محرك المحددات الفائق السرعة
 */
export async function demoTurboSelector(page: any, domain: string = 'example.com') {
  console.log('\n🚀 ====== عرض توضيحي: محرك المحددات فائق السرعة ======\n');

  // المثال 1: بحث سريع عن عنصر واحد
  console.log('📌 المثال 1: بحث سريع عن عنصر بسيط');
  const result1 = await turboSelectorEngine.turboFind(
    page,
    ['button[type="submit"]', '.btn-primary', '[role="button"]'],
    domain,
    500
  );

  console.log(`✅ النتيجة:
  - وجدت: ${result1.found}
  - المحدد: ${result1.selector}
  - الثقة: ${(result1.confidence * 100).toFixed(0)}%
  - الوقت: ${result1.timeMs}ms
  - الطريقة: ${result1.method}
  - السبب: ${result1.reasoning}\n`);

  // المثال 2: بحث عن عناصر متعددة
  console.log('📌 المثال 2: بحث سريع عن عناصر متعددة');
  const result2 = await turboSelectorEngine.turboFind(
    page,
    [
      'input[type="email"]',
      '[data-testid="email-input"]',
      '[aria-label*="email"]',
      'input[placeholder*="email"]',
    ],
    domain,
    800
  );

  console.log(`✅ النتيجة:
  - وجدت: ${result2.found}
  - من الذاكرة: ${result2.fromCache}
  - الوقت: ${result2.timeMs}ms\n`);

  // الإحصائيات
  const stats = turboSelectorEngine.getPerformanceStats();
  console.log(`📊 إحصائيات الأداء:
  - عدد الطلبات: ${stats.totalSearches}
  - معدل الكاش: ${stats.cacheHitRate}
  - حجم الكاش: ${stats.cacheSize}
  - عدد مجالات الكاش: ${stats.domainCaches}\n`);
}

/**
 * أمثلة على استخدام محرك الفهم العصبي
 */
export async function demoNeuralEngine(pageContent: string, domain: string = 'example.com') {
  console.log('\n🧠 ====== عرض توضيحي: محرك الفهم العصبي ======\n');

  // المثال 1: فهم السياق
  console.log('📌 المثال 1: فهم السياق تلقائياً');
  const context = await neuralUnderstandingEngine.understandContext(
    pageContent,
    domain,
    null // لا يوجد عنصر فعلي في هذا المثال
  );

  console.log(`✅ السياق المفهوم:
  - نوع الصفحة: ${context.pageType}
  - نوع العنصر: ${context.elementType}
  - الدور: ${context.elementRole}
  - نوع المجال: ${context.domainType}
  - قابلية الوصول: ${(context.estimatedReachability * 100).toFixed(0)}%\n`);

  // المثال 2: اتخاذ قرار ذكي
  console.log('📌 المثال 2: اتخاذ قرار ذكي بناءً على السياق');
  const decision = await neuralUnderstandingEngine.makeDecision(
    context,
    null,
    'login user with credentials'
  );

  console.log(`✅ القرار:
  - الإجراء: ${decision.action}
  - الثقة: ${(decision.confidence * 100).toFixed(0)}%
  - مسار سريع: ${decision.fastPath}\n`);

  // المثال 3: التنبؤ بالنجاح
  console.log('📌 المثال 3: التنبؤ بنجاح الإجراء');
  const prediction = await neuralUnderstandingEngine.predictSuccess(
    decision.action,
    context,
    null,
    domain
  );

  console.log(`✅ التنبؤ:
  - سينجح: ${prediction.willSucceed}
  - احتمالية النجاح: ${(prediction.successProbability * 100).toFixed(0)}%
  - الوقت المتوقع: ${prediction.estimatedTime}ms
  - عوامل الخطر: ${prediction.riskFactors.join(', ') || 'لا توجد'}
  - التفسير: ${prediction.reasoning}\n`);

  // الإحصائيات
  const stats = neuralUnderstandingEngine.getStatistics();
  console.log(`📊 إحصائيات الفهم:
  - معدل النجاح: ${stats.successRate}
  - عدد الأنماط: ${stats.patternCount}
  - حجم الذاكرة السياقية: ${stats.contextMemorySize}\n`);
}

/**
 * أمثلة على استخدام نظام استرجاع الأخطاء الذكي
 */
export async function demoErrorRecovery(page: any, domain: string = 'example.com') {
  console.log('\n🔧 ====== عرض توضيحي: نظام استرجاع الأخطاء الذكي ======\n');

  // إنشاء سياق خطأ
  const errorContext: ErrorContext = {
    errorType: 'not_found',
    selector: '#non-existent-element',
    domain,
    elementType: 'button',
    elementText: 'Click me',
    pageUrl: domain,
    attemptCount: 1,
    timeElapsed: 500,
    previousAttempts: [],
  };

  // المثال 1: اتخاذ قرار استرجاع ذكي
  console.log('📌 المثال 1: اتخاذ قرار استرجاع ذكي');
  const decision = await intelligentErrorRecovery.decideRecovery(errorContext);

  console.log(`✅ قرار الاسترجاع:
  - الاستراتيجية الأساسية: ${decision.primaryStrategy.name}
  - معدل النجاح المتوقع: ${(decision.estimatedSuccessRate * 100).toFixed(0)}%
  - التفسير: ${decision.reasoning}
  - البدائل: ${decision.alternativeStrategies.map((s) => s.name).join(', ')}\n`);

  // المثال 2: تنفيذ الاسترجاع
  console.log('📌 المثال 2: تنفيذ الاسترجاع');
  const recoveryResult = await intelligentErrorRecovery.executeRecovery(
    decision,
    errorContext,
    page
  );

  console.log(`✅ نتيجة الاسترجاع:
  - نجح: ${recoveryResult.success}
  - الاستراتيجية: ${recoveryResult.strategy}
  - المحدد: ${recoveryResult.selector}
  - الرسالة: ${recoveryResult.message}\n`);

  // الإحصائيات
  const stats = intelligentErrorRecovery.getStatistics();
  console.log(`📊 إحصائيات الاسترجاع:
  - إجمالي المحاولات: ${stats.totalAttempts}
  - عدد الأنماط المكتشفة: ${stats.patternCount}\n`);

  // تفاصيل استراتيجيات الاسترجاع
  console.log('📋 تفاصيل كل استراتيجية:');
  Object.entries(stats.strategies).forEach(([name, data]: any) => {
    console.log(`  • ${name}:
    - معدل النجاح: ${data.successRate}
    - عدد المحاولات: ${data.totalAttempts}
    - الوقت المتوسط: ${data.averageTime}`);
  });
  console.log();
}

/**
 * أمثلة على استخدام التكامل الموحد
 */
export async function demoIntegratedBrain(
  page: any,
  domain: string = 'example.com',
  selectors: string[] = []
) {
  console.log('\n⚡ ====== عرض توضيحي: التكامل الموحد للدماغ المحسّن ======\n');

  // المثال 1: بحث محسّن شامل
  console.log('📌 المثال 1: بحث محسّن شامل');
  const searchResult = await brainStrengthenerCore.enhancedFind(
    page,
    selectors.length > 0 ? selectors : ['button', 'input[type="text"]', '[role="button"]'],
    domain,
    '<html>...</html>',
    null,
    {
      timeout: 3000,
      enableCache: true,
      enableRecovery: true,
      enablePrediction: true,
    }
  );

  console.log(`✅ نتيجة البحث المحسّن:
  - وجدت: ${searchResult.found}
  - المحدد: ${searchResult.selector}
  - الثقة: ${(searchResult.confidence * 100).toFixed(0)}%
  - الوقت: ${searchResult.timeMs}ms
  - المصدر: ${searchResult.source}
  ${searchResult.context ? `- السياق: ${searchResult.context.pageType}` : ''}
  ${searchResult.prediction ? `- احتمالية النجاح: ${(searchResult.prediction.successProbability * 100).toFixed(0)}%` : ''}\n`);

  // المثال 2: إجراء محسّن
  console.log('📌 المثال 2: تنفيذ إجراء محسّن');
  if (searchResult.found) {
    const actionResult = await brainStrengthenerCore.enhancedAction(
      page,
      'click',
      searchResult.selector,
      undefined,
      searchResult.context || undefined
    );

    console.log(`✅ نتيجة الإجراء:
  - نجح: ${actionResult.success}
  - الوقت: ${actionResult.timeMs}ms
  - الرسالة: ${actionResult.message}\n`);
  }

  // المثال 3: مقاييس التحسين
  console.log('📌 المثال 3: مقاييس التحسين');
  const metrics = brainStrengthenerCore.getEnhancementMetrics();

  console.log(`✅ مقاييس التحسين:
  
🚀 سرعة المحددات:
  - متوسط الوقت: ${metrics.selectorSpeed.averageTimeMs.toFixed(0)}ms
  - معدل الكاش: ${metrics.selectorSpeed.cacheHitRate}
  - التحسين: ${metrics.selectorSpeed.improvement}

🧠 الفهم والذكاء:
  - دقة السياق: ${metrics.understanding.contextAccuracy}
  - سرعة القرار: ${metrics.understanding.decisionSpeed}
  - دقة التنبؤ: ${metrics.understanding.predictionAccuracy}

🔧 استرجاع الأخطاء:
  - معدل الاسترجاع: ${metrics.errorRecovery.recoveryRate}
  - متوسط المحاولات: ${metrics.errorRecovery.averageAttempts}
  - الأنماط المكتشفة: ${metrics.errorRecovery.patternDetection}

⭐ النتائج الإجمالية:
  - درجة الكفاءة: ${metrics.overall.efficiencyScore}/100
  - درجة الموثوقية: ${metrics.overall.reliabilityScore}/100
  - درجة السرعة: ${metrics.overall.speedScore}/100\n`);

  // المثال 4: تقرير صحة الدماغ
  console.log('📌 المثال 4: تقرير صحة الدماغ');
  const healthReport = brainStrengthenerCore.generateBrainHealthReport();

  console.log(`✅ تقرير الصحة:
  - الحالة: ${healthReport.status}
  - الدرجة الكلية: ${healthReport.overallScore}/100
  ${healthReport.recommendations.length > 0 ? `- التوصيات:\n    ${healthReport.recommendations.join('\n    ')}` : '- لا توجد توصيات ضرورية'}\n`);
}

/**
 * اختبار صحي شامل
 */
export async function comprehensiveHealthCheck(page: any) {
  console.log('\n✅ ====== الاختبار الصحي الشامل ======\n');

  console.log('🔍 اختبار جميع الأنظمة...\n');

  // اختبار سريع
  const quickCheck = await brainStrengthenerCore.quickHealthCheck(page);

  console.log(`نتائج الاختبار:
  ✅ محرك المحددات: ${quickCheck.turboSelectorOK ? 'يعمل' : 'خطأ'}
  ✅ محرك الفهم العصبي: ${quickCheck.neuralEngineOK ? 'يعمل' : 'خطأ'}
  ✅ نظام الاسترجاع: ${quickCheck.errorRecoveryOK ? 'يعمل' : 'خطأ'}
  ✅ جميع الأنظمة: ${quickCheck.allOK ? '✅ تعمل بشكل طبيعي' : '❌ هناك مشاكل'}\n`);

  if (quickCheck.allOK) {
    console.log('🎉 عقل الروبوت جاهز وفي حالة ممتازة!\n');
  } else {
    console.log('⚠️ يرجى التحقق من الأنظمة الخاطئة.\n');
  }
}

/**
 * مثال عملي كامل: عملية تسجيل دخول
 */
export async function practicalExample_Login(page: any) {
  console.log('\n🔐 ====== مثال عملي: عملية تسجيل الدخول ======\n');

  const domain = 'example.com/login';
  const email = 'user@example.com';
  const password = 'password123';

  console.log('الخطوة 1️⃣: البحث عن حقل البريد الإلكتروني');
  const emailResult = await brainStrengthenerCore.enhancedFind(
    page,
    ['input[type="email"]', '[name="email"]', '[data-testid="email-input"]'],
    domain,
    '<html></html>'
  );

  if (!emailResult.found) {
    console.log('❌ فشل البحث عن حقل البريد');
    return;
  }

  console.log('✅ وجدت حقل البريد\n');

  console.log('الخطوة 2️⃣: ملء حقل البريد الإلكتروني');
  const fillEmailResult = await brainStrengthenerCore.enhancedAction(
    page,
    'fill',
    emailResult.selector,
    email
  );

  console.log(`${fillEmailResult.success ? '✅' : '❌'} ${fillEmailResult.message}\n`);

  console.log('الخطوة 3️⃣: البحث عن حقل كلمة المرور');
  const passwordResult = await brainStrengthenerCore.enhancedFind(
    page,
    ['input[type="password"]', '[name="password"]', '[data-testid="password-input"]'],
    domain,
    '<html></html>'
  );

  if (!passwordResult.found) {
    console.log('❌ فشل البحث عن حقل كلمة المرور');
    return;
  }

  console.log('✅ وجدت حقل كلمة المرور\n');

  console.log('الخطوة 4️⃣: ملء حقل كلمة المرور');
  const fillPasswordResult = await brainStrengthenerCore.enhancedAction(
    page,
    'fill',
    passwordResult.selector,
    password
  );

  console.log(`${fillPasswordResult.success ? '✅' : '❌'} ${fillPasswordResult.message}\n`);

  console.log('الخطوة 5️⃣: البحث عن زر تسجيل الدخول');
  const submitResult = await brainStrengthenerCore.enhancedFind(
    page,
    ['button[type="submit"]', 'button:contains("Login")', '[role="button"]'],
    domain,
    '<html></html>'
  );

  if (!submitResult.found) {
    console.log('❌ فشل البحث عن زر التسجيل');
    return;
  }

  console.log('✅ وجدت زر التسجيل\n');

  console.log('الخطوة 6️⃣: النقر على زر التسجيل');
  const clickResult = await brainStrengthenerCore.enhancedAction(
    page,
    'click',
    submitResult.selector
  );

  console.log(`${clickResult.success ? '✅' : '❌'} ${clickResult.message}\n`);

  console.log('🎉 اكتملت عملية التسجيل!');
  console.log(`⏱️ إجمالي الوقت: ${fillEmailResult.timeMs + fillPasswordResult.timeMs + clickResult.timeMs}ms\n`);
}

/**
 * تشغيل جميع العروض التوضيحية
 */
export async function runAllDemos(page: any, pageContent: string = '<html></html>') {
  console.log('\n\n╔════════════════════════════════════════════════════╗');
  console.log('║        🤖 عروض توضيحية العقل المحسّن          ║');
  console.log('║      Enhanced Robot Brain System Demonstrations     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // تشغيل العروض
    await demoTurboSelector(page);
    await demoNeuralEngine(pageContent);
    await demoErrorRecovery(page);
    await demoIntegratedBrain(page);
    await comprehensiveHealthCheck(page);
    // await practicalExample_Login(page); // اختياري - يتطلب صفحة فعلية

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║           ✅ اكتملت جميع العروض بنجاح           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ حدث خطأ أثناء العروض التوضيحية:', error);
  }
}

export default {
  demoTurboSelector,
  demoNeuralEngine,
  demoErrorRecovery,
  demoIntegratedBrain,
  comprehensiveHealthCheck,
  practicalExample_Login,
  runAllDemos,
};
