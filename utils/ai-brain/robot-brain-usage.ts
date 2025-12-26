/**
 * دليل استخدام نظام الروبوت الذكي
 * Robot Brain Usage Guide - Practical Examples
 */

import {
  createRobotBrain,
  RobotTools,
  RobotHelpers,
  RobotExamples,
  QuickStart,
} from './robot-brain-exports';
import type { RobotTask } from './unified-robot-brain-core';

/**
 * ============================================
 * الاستخدام الأساسي
 * ============================================
 */

/**
 * 1. البحث السريع عن عنصر
 */
export async function example_quickFind(page: any) {
  // البحث بسيط
  const result = await RobotTools.finder.findElementLightning(page, {
    id: 'submit-button',
  });

  if (result.found) {
    console.log(`✅ وجدت العنصر: ${result.selector}`);
    console.log(`⏱️ الوقت: ${result.timeMs}ms`);
    console.log(`🎯 الثقة: ${(result.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * 2. النقر الذكي
 */
export async function example_smartClick(page: any) {
  const element = page.locator('#submit-button').first();

  const result = await RobotTools.handler.smartClick(element, page, {
    humanLike: true,
    scrollIntoView: true,
    retry: true,
  });

  console.log(`النقر: ${result.success ? '✅ نجح' : '❌ فشل'}`);
}

/**
 * 3. الملء الذكي
 */
export async function example_smartFill(page: any) {
  const element = page.locator('input[type="email"]').first();

  const result = await RobotTools.handler.smartFill(
    element,
    page,
    'user@example.com',
    {
      humanLike: true,
      retry: true,
    }
  );

  console.log(`الملء: ${result.success ? '✅ نجح' : '❌ فشل'}`);
}

/**
 * 4. الاستخراج الذكي
 */
export async function example_smartExtract(page: any) {
  const element = page.locator('.product-name').first();

  const result = await RobotTools.handler.smartExtract(element, 'text');

  if (result.success) {
    console.log(`البيانات: ${result.result}`);
  }
}

/**
 * ============================================
 * الاستخدام المتقدم
 * ============================================
 */

/**
 * 5. فهم الصفحة تلقائياً
 */
export async function example_understandPage(page: any) {
  const understanding = await RobotTools.logic.understand(
    'أريد تسجيل الدخول',
    page
  );

  console.log(`النية: ${understanding.userIntent}`);
  console.log(`الثقة: ${(understanding.confidence * 100).toFixed(1)}%`);
  console.log(`الخطوات المقترحة: ${understanding.executionPath.length}`);
}

/**
 * 6. البحث المتقدم مع بدائل
 */
export async function example_advancedSearch(page: any) {
  const results = await RobotTools.finder.findElementsLightning(page, [
    { id: 'email' },
    { dataTestId: 'email-input' },
    { type: 'email' },
  ]);

  console.log(`وجدت ${results.filter(r => r.found).length} عنصر(عناصر)`);
}

/**
 * ============================================
 * المهام الكاملة
 * ============================================
 */

/**
 * 7. تنفيذ مهمة تسجيل دخول
 */
export async function example_executeLogin(page: any) {
  const brain = createRobotBrain();

  const task: RobotTask = {
    id: 'login_example',
    type: 'login',
    url: 'https://example.com/login',
    steps: [
      {
        id: 'find_email',
        action: 'fill',
        selector: 'input[type="email"]',
        value: 'user@example.com',
      },
      {
        id: 'find_password',
        action: 'fill',
        selector: 'input[type="password"]',
        value: 'password123',
      },
      {
        id: 'submit',
        action: 'click',
        selector: 'button[type="submit"]',
      },
    ],
  };

  const result = await brain.run(task, page);

  console.log(`✅ النجاح: ${result.success}`);
  console.log(`⏱️ المدة: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`📈 الذكاء: ${result.intelligence.execution.toFixed(1)}%`);
}

/**
 * 8. تنفيذ مهمة بحث
 */
export async function example_executeSearch(page: any) {
  const brain = createRobotBrain();

  const task = RobotExamples.search('javascript tutorial');

  const result = await brain.quick(task, page);

  console.log(result.success ? '✅ البحث نجح' : '❌ البحث فشل');
}

/**
 * 9. تنفيذ مهمة استخراج
 */
export async function example_executeScrape(page: any) {
  const brain = createRobotBrain();

  const task = RobotExamples.scrape('.article-title');

  const result = await brain.run(task, page);

  console.log(`استخرجت: ${JSON.stringify(result.results)}`);
}

/**
 * ============================================
 * الاستخدام السريع جداً
 * ============================================
 */

/**
 * 10. الطريقة الأسرع
 */
export async function example_ultraFast(page: any) {
  // طريقة 1: البحث فقط
  const findResult = await QuickStart.find(page, { type: 'button' });

  // طريقة 2: النقر فقط
  if (findResult.found) {
    await QuickStart.click(findResult.element, page);
  }

  // طريقة 3: الملء فقط
  const emailElement = page.locator('input[type="email"]').first();
  await QuickStart.type(emailElement, page, 'user@example.com');

  // طريقة 4: الاستخراج فقط
  const titleElement = page.locator('h1').first();
  const title = await QuickStart.get(titleElement);

  console.log(`العنوان: ${title.result}`);
}

/**
 * ============================================
 * معالجة الحالات الخاصة
 * ============================================
 */

/**
 * 11. معالجة الأخطاء
 */
export async function example_errorHandling(page: any) {
  try {
    const element = page.locator('.non-existent').first();

    const result = await RobotTools.handler.smartClick(element, page, {
      retry: true,
      maxRetries: 3,
    });

    if (!result.success) {
      console.log(`❌ خطأ: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ استثناء: ${error}`);
  }
}

/**
 * 12. البحث مع انتظار
 */
export async function example_searchWithWait(page: any) {
  const result = await RobotTools.handler.smartWait(page, '.dynamic-element', {
    timeout: 10000,
  });

  if (result.success) {
    console.log('✅ العنصر ظهر');
  } else {
    console.log('❌ انتظار انتهى بدون ظهور العنصر');
  }
}

/**
 * ============================================
 * التحليل والإحصائيات
 * ============================================
 */

/**
 * 13. الحصول على التقارير
 */
export async function example_getReports(page: any) {
  const brain = createRobotBrain();

  // تنفيذ بعض المهام أولاً
  // ...

  // الإحصائيات
  const stats = brain.stats();
  console.log(`📊 إجمالي المهام: ${stats.totalTasks}`);
  console.log(`✅ معدل النجاح: ${stats.successRate.toFixed(1)}%`);
  console.log(`⏱️ متوسط المدة: ${(stats.averageDuration / 1000).toFixed(2)}s`);

  // التقرير الكامل
  const report = brain.report();
  console.log(report);
}

/**
 * ============================================
 * الدوال المساعدة المفيدة
 * ============================================
 */

/**
 * 14. فهم الصفحة بسرعة
 */
export async function example_fastPageAnalysis(page: any) {
  const understanding = await RobotHelpers.understand(
    'أين زر تسجيل الدخول؟',
    page
  );

  console.log(`🧠 فهم الصفحة:`);
  console.log(`  • النية: ${understanding.userIntent}`);
  console.log(`  • عدد النماذج: ${understanding.pageContext.forms.length}`);
  console.log(`  • عدد الروابط: ${understanding.pageContext.interactiveElements.length}`);
}

/**
 * 15. سلسلة عمليات متقدمة
 */
export async function example_advancedChain(page: any) {
  // البحث → النقر → الملء → الاستخراج
  const step1 = await RobotHelpers.findElement(page, { id: 'search-box' });

  if (step1.found) {
    const step2 = await RobotHelpers.click(step1.element, page);

    if (step2.success) {
      const step3 = await RobotHelpers.fill(
        step1.element,
        page,
        'البحث عن شيء'
      );

      if (step3.success) {
        const results = await page.locator('.result').all();
        console.log(`🎉 وجدت ${results.length} نتيجة`);
      }
    }
  }
}

/**
 * ============================================
 * أمثلة واقعية
 * ============================================
 */

/**
 * 16. مثال واقعي: تسجيل حساب على GitHub
 */
export async function example_realWorld_githubSignup(page: any) {
  const brain = createRobotBrain();

  const task: RobotTask = {
    id: 'github_signup',
    type: 'custom',
    url: 'https://github.com/signup',
    steps: [
      {
        id: 'step1',
        action: 'fill',
        selector: 'input[name="user[login]"]',
        value: 'newusername',
      },
      {
        id: 'step2',
        action: 'fill',
        selector: 'input[name="user[email]"]',
        value: 'user@example.com',
      },
      {
        id: 'step3',
        action: 'fill',
        selector: 'input[name="user[password]"]',
        value: 'SecurePassword123!',
      },
      {
        id: 'step4',
        action: 'click',
        selector: 'button[type="submit"]',
      },
    ],
  };

  const result = await brain.run(task, page);
  return result;
}

/**
 * 17. مثال واقعي: استخراج أسعار المنتجات
 */
export async function example_realWorld_priceExtraction(page: any) {
  const results: any[] = [];

  // البحث عن جميع المنتجات
  const products = await page.locator('.product-item').all();

  for (const product of products) {
    const name = await RobotHelpers.extract(
      product.locator('.product-name').first()
    );
    const price = await RobotHelpers.extract(
      product.locator('.product-price').first()
    );

    if (name.success && price.success) {
      results.push({
        name: name.result,
        price: price.result,
      });
    }
  }

  return results;
}

/**
 * ============================================
 * نصائح وحيل
 * ============================================
 */

/**
 * نصيحة 1: استخدم humanLike للتفادي من الكشف
 */
export async function tip_humanLike(page: any, element: any) {
  // خيار 1: بدون محاكاة بشرية (أسرع)
  await element.click();

  // خيار 2: مع محاكاة بشرية (أكثر أماناً)
  await RobotTools.handler.smartClick(element, page, {
    humanLike: true,
  });
}

/**
 * نصيحة 2: استخدم timeout مناسب
 */
export async function tip_timeouts(page: any) {
  // انتظار سريع
  const quick = await RobotTools.handler.smartWait(page, '.fast-element', {
    timeout: 2000,
  });

  // انتظار طويل
  const slow = await RobotTools.handler.smartWait(page, '.slow-element', {
    timeout: 30000,
  });
}

/**
 * نصيحة 3: استخدم البدائل
 */
export async function tip_alternatives(page: any) {
  const result = await RobotTools.finder.findElementWithFallbacks(
    page,
    { id: 'submit' }, // الخيار الأساسي
    [
      { dataTestId: 'submit-button' }, // الخيار 1
      { type: 'submit' }, // الخيار 2
    ]
  );
}

/**
 * نصيحة 4: قاس الأداء
 */
export async function tip_measurePerformance(page: any) {
  const startTime = Date.now();

  // قم بعملية ما
  await RobotTools.finder.findElementLightning(page, { id: 'button' });

  const duration = Date.now() - startTime;
  console.log(`⏱️ استغرقت العملية ${duration}ms`);
}
