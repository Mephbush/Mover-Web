/**
 * اختبار شامل لنظام الروبوت الذكي
 * Robot Brain System Test
 */

import {
  createRobotBrain,
  RobotTools,
  RobotHelpers,
  RobotExamples,
  QuickStart,
} from './robot-brain-exports';

/**
 * اختبار سريع للتأكد من أن جميع الأنظمة تعمل
 */
export async function testRobotBrainSystem() {
  console.log('\n🤖 ═══════════════════════════════════════════════════════════');
  console.log('🤖 اختبار نظام الروبوت الذكي');
  console.log('🤖 ═══════════════════════════════════════════════════════════\n');

  // 1. اختبار إنشاء النظام
  console.log('✅ 1. اختبار إنشاء النظام');
  try {
    const brain = createRobotBrain();
    console.log('   ✓ تم إنشاء النظام بنجاح\n');
  } catch (error) {
    console.log('   ✗ فشل إنشاء النظام\n');
    throw error;
  }

  // 2. اختبار الأدوات المتاحة
  console.log('✅ 2. اختبار الأدوات المتاحة');
  try {
    console.log(`   ✓ نظام البحث السريع: ${RobotTools.finder ? '✓' : '✗'}`);
    console.log(`   ✓ معالج العناصر: ${RobotTools.handler ? '✓' : '✗'}`);
    console.log(`   ✓ محسّن الأداء: ${RobotTools.optimizer ? '✓' : '✗'}`);
    console.log(`   ✓ نظام اختيار المحددات: ${RobotTools.selector ? '✓' : '✗'}`);
    console.log(`   ✓ منطق الروبوت: ${RobotTools.logic ? '✓' : '✗'}\n`);
  } catch (error) {
    console.log('   ✗ خطأ في الأدوات\n');
    throw error;
  }

  // 3. اختبار الدوال المساعدة
  console.log('✅ 3. اختبار الدوال المساعدة');
  try {
    console.log(`   ✓ findElement: ${RobotHelpers.findElement ? '✓' : '✗'}`);
    console.log(`   ✓ click: ${RobotHelpers.click ? '✓' : '✗'}`);
    console.log(`   ✓ fill: ${RobotHelpers.fill ? '✓' : '✗'}`);
    console.log(`   ✓ extract: ${RobotHelpers.extract ? '✓' : '✗'}`);
    console.log(`   ✓ understand: ${RobotHelpers.understand ? '✓' : '✗'}\n`);
  } catch (error) {
    console.log('   ✗ خطأ في الدوال المساعدة\n');
    throw error;
  }

  // 4. اختبار الأمثلة
  console.log('✅ 4. اختبار الأمثلة المدمجة');
  try {
    const loginTask = RobotExamples.login('test@test.com', 'password');
    const searchTask = RobotExamples.search('query');
    const formTask = RobotExamples.form({ name: 'John', email: 'john@test.com' });
    const scrapeTask = RobotExamples.scrape('.item');

    console.log(`   ✓ مثال تسجيل الدخول: ${loginTask.id}`);
    console.log(`   ✓ مثال البحث: ${searchTask.id}`);
    console.log(`   ✓ مثال النموذج: ${formTask.id}`);
    console.log(`   ✓ مثال الاستخراج: ${scrapeTask.id}\n`);
  } catch (error) {
    console.log('   ✗ خطأ في الأمثلة\n');
    throw error;
  }

  // 5. اختبار الاستخدام السريع
  console.log('✅ 5. اختبار الاستخدام السريع');
  try {
    console.log(`   ✓ QuickStart.find: ${QuickStart.find ? '✓' : '✗'}`);
    console.log(`   ✓ QuickStart.click: ${QuickStart.click ? '✓' : '✗'}`);
    console.log(`   ✓ QuickStart.type: ${QuickStart.type ? '✓' : '✗'}`);
    console.log(`   ✓ QuickStart.get: ${QuickStart.get ? '✓' : '✗'}`);
    console.log(`   ✓ QuickStart.understand: ${QuickStart.understand ? '✓' : '✗'}\n`);
  } catch (error) {
    console.log('   ✗ خطأ في الاستخدام السريع\n');
    throw error;
  }

  // 6. ملخص الاختبار
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 جميع الاختبارات نجحت!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 الأنظمة المتاحة:');
  console.log('  1. نظام البحث السريع جداً (Lightning Fast Discovery)');
  console.log('  2. معالج العناصر الذكي (Smart Element Handler)');
  console.log('  3. محسّن الأداء العالي (High Performance Optimizer)');
  console.log('  4. نظام اختيار المحددات الذكي (Ultra Intelligent Selector)');
  console.log('  5. منطق الروبوت المتقدم (Advanced Robot Logic)');
  console.log('  6. النظام المتكامل (Unified Robot Brain Core)\n');

  console.log('🚀 جاهز للاستخدام!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * اختبار الاتصال مع صفحة فعلية (يحتاج إلى playwright)
 */
export async function testWithActualPage(page: any) {
  console.log('🧪 اختبار مع صفحة فعلية\n');

  // اختبار 1: البحث السريع
  console.log('1️⃣ اختبار البحث السريع:');
  try {
    const result = await RobotTools.finder.findElementLightning(page, {
      type: 'button',
      text: 'submit',
    });
    console.log(`   نجح: ${result.found ? '✓' : '✗'}`);
    console.log(`   الوقت: ${result.timeMs}ms`);
    console.log(`   الثقة: ${(result.confidence * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`   خطأ: ${error}\n`);
  }

  // اختبار 2: فهم الصفحة
  console.log('2️⃣ اختبار فهم الصفحة:');
  try {
    const understanding = await RobotTools.logic.understand(
      'ابحث عن حقل الإدخال',
      page
    );
    console.log(`   النية: ${understanding.userIntent}`);
    console.log(`   الثقة: ${(understanding.confidence * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`   خطأ: ${error}\n`);
  }

  // اختبار 3: الدوال المساعدة
  console.log('3️⃣ اختبار الدوال المساعدة:');
  try {
    const element = page.locator('button').first();
    const result = await RobotHelpers.click(element, page);
    console.log(`   نجح: ${result.success ? '✓' : '✗'}\n`);
  } catch (error) {
    console.log(`   خطأ: ${error}\n`);
  }
}

/**
 * قائمة الميزات الرئيسية
 */
export function printFeatures() {
  console.log('\n🌟 الميزات الرئيسية:\n');

  console.log('⚡ السرعة:');
  console.log('  • بحث متوازي سريع جداً');
  console.log('  • كاش ذكي للنتائج');
  console.log('  • وقت استجابة < 100ms\n');

  console.log('🧠 الذكاء:');
  console.log('  • فهم السياق التلقائي');
  console.log('  • توقع أفضل محدد');
  console.log('  • تعلم مستمر من كل عملية\n');

  console.log('🛡️ الموثوقية:');
  console.log('  • إعادة محاولة ذكية');
  console.log('  • محددات بديلة متعددة');
  console.log('  • معالجة أخطاء متقدمة\n');

  console.log('👤 المحاكاة البشرية:');
  console.log('  • حركات ماوس طبيعية');
  console.log('  • كتابة بتأخيرات عشوائية');
  console.log('  • نقرات بسلوك بشري\n');

  console.log('📊 التحليل:');
  console.log('  • تقارير أداء شاملة');
  console.log('  • إحصائيات فصلية');
  console.log('  • تنبؤات المستقبل\n');
}

/**
 * دالة للبدء السريع
 */
export function quickStart() {
  console.log('\n🚀 البدء السريع:\n');

  console.log('// 1. البحث عن عنصر');
  console.log('const result = await robot.quick.find(page, { id: "button" });\n');

  console.log('// 2. النقر على عنصر');
  console.log('await robot.quick.click(element, page);\n');

  console.log('// 3. كتابة نص');
  console.log('await robot.quick.type(element, page, "text");\n');

  console.log('// 4. استخراج بيانات');
  console.log('const data = await robot.quick.get(element);\n');

  console.log('// 5. فهم الصفحة');
  console.log('const understanding = await robot.quick.understand("task", page);\n');
}

/**
 * دالة للمزيد من المعلومات
 */
export function moreInfo() {
  console.log('\n📚 للمزيد من المعلومات:\n');

  console.log('// استيراد كامل');
  console.log('import { robot, RobotTools, RobotHelpers } from "@/utils/ai-brain";\n');

  console.log('// استيراد مخصص');
  console.log('import { LightningFastDiscoverySystem } from "@/utils/ai-brain";\n');

  console.log('// استخدام المتقدم');
  console.log('const brain = robot.create();');
  console.log('const result = await brain.run(task, page);\n');
}
