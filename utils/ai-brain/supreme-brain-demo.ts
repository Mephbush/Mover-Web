/**
 * 🎬 تطبيق عملي لعقل الروبوت الفائق
 * Supreme Brain Demo Application
 * 
 * أمثلة حقيقية وسيناريوهات عملية
 */

import { 
  IntegratedSupremeBrain, 
  BrainAction 
} from './integrated-supreme-brain';
import { diagnoseSystem } from './supreme-brain-exports';

/**
 * سيناريو 1: تسجيل دخول ذكي
 */
export async function demoSmartLogin(page: any) {
  const brain = new IntegratedSupremeBrain({ verboseLogging: true });
  await brain.initialize(page);

  console.log('\n🔐 سيناريو: تسجيل الدخول الذكي\n');

  const steps = [
    { id: '1', type: 'fill', target: 'حقل اسم المستخدم', value: 'user@example.com', domain: 'login.example.com' },
    { id: '2', type: 'fill', target: 'حقل كلمة المرور', value: 'password123', domain: 'login.example.com' },
    { id: '3', type: 'click', target: 'زر تسجيل الدخول', domain: 'login.example.com' },
  ] as BrainAction[];

  for (const step of steps) {
    console.log(`\n⏳ الخطوة: ${step.target}`);
    const result = await brain.execute(step);
    
    if (result.success) {
      console.log(`✅ نجح في ${result.timeMs}ms بثقة ${(result.confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`❌ فشل - ${result.error}`);
    }
  }

  console.log('\n📊 التقرير النهائي:');
  const report = brain.getComprehensiveReport();
  console.log(JSON.stringify(report, null, 2));
}

/**
 * سيناريو 2: استخراج البيانات الذكي
 */
export async function demoSmartDataExtraction(page: any) {
  const brain = new IntegratedSupremeBrain({ verboseLogging: true });
  await brain.initialize(page);

  console.log('\n📊 سيناريو: استخراج البيانات الذكي\n');

  const dataPoints = [
    'عنوان المنتج',
    'السعر',
    'التقييم',
    'عدد التقييمات',
    'توفر المنتج',
  ];

  const extractedData: Record<string, any> = {};

  for (const point of dataPoints) {
    console.log(`\n🔍 استخراج: ${point}`);
    
    const result = await brain.findElement(point, 'ecommerce.example.com');
    
    if (result.found) {
      console.log(`✅ وجد العنصر: ${result.selector}`);
      console.log(`⚡ السرعة: ${result.timeMs}ms`);
      console.log(`💪 الثقة: ${(result.confidence * 100).toFixed(1)}%`);
      
      extractedData[point] = {
        selector: result.selector,
        confidence: result.confidence,
        timeMs: result.timeMs,
      };
    } else {
      console.log(`❌ لم يتم العثور على العنصر`);
    }
  }

  console.log('\n📦 البيانات المستخرجة:');
  console.log(JSON.stringify(extractedData, null, 2));

  console.log('\n📈 الإحصائيات:');
  const learning = brain.getLearningStats();
  console.log(`  - عدد المحاولات: ${dataPoints.length}`);
  console.log(`  - النجاحات: ${Object.keys(extractedData).length}`);
  console.log(`  - معدل النجاح: ${((Object.keys(extractedData).length / dataPoints.length) * 100).toFixed(1)}%`);
}

/**
 * سيناريو 3: التعامل مع العناصر الصعبة
 */
export async function demoHardElementHandling(page: any) {
  const brain = new IntegratedSupremeBrain({ 
    enableLearning: true,
    verboseLogging: true 
  });
  await brain.initialize(page);

  console.log('\n🚧 سيناريو: التعامل مع العناصر الصعبة\n');

  const hardElements = [
    { name: 'زر مخفي في Shadow DOM', domain: 'complex.example.com' },
    { name: 'عنصر في iframe', domain: 'complex.example.com' },
    { name: 'زر ديناميكي يظهر بعد التفاعل', domain: 'complex.example.com' },
    { name: 'عنصر بدون معرف واضح', domain: 'complex.example.com' },
  ];

  const results = {
    successful: 0,
    failed: 0,
    learned: 0,
  };

  for (const elem of hardElements) {
    console.log(`\n🎯 البحث عن: ${elem.name}`);
    
    // المحاولة الأولى
    let findResult = await brain.findElement(elem.name, elem.domain);
    
    if (findResult.found) {
      console.log(`✅ وجد بسهولة: ${findResult.selector}`);
      results.successful++;
      results.learned++;
      continue;
    }

    // إذا فشلت المحاولة الأولى، تجربة استراتيجيات بديلة
    console.log('⚠️ المحاولة الأولى فشلت، محاولة استراتيجيات بديلة...');
    
    const alternativeStrategies = [
      `${elem.name} (معدل)`,
      `عنصر يحتوي على "${elem.name.split(' ')[0]}"`,
      `أقرب عنصر ل ${elem.name}`,
    ];

    for (const strategy of alternativeStrategies) {
      findResult = await brain.findElement(strategy, elem.domain);
      if (findResult.found) {
        console.log(`✅ وجد باستراتيجية بديلة: ${strategy}`);
        console.log(`   المحدد: ${findResult.selector}`);
        results.successful++;
        break;
      }
    }

    if (!findResult.found) {
      console.log(`❌ فشل البحث حتى مع الاستراتيجيات البديلة`);
      results.failed++;
    }
  }

  console.log('\n📊 النتائج:');
  console.log(`  - النجاحات: ${results.successful}/${hardElements.length}`);
  console.log(`  - الفشل: ${results.failed}/${hardElements.length}`);
  console.log(`  - تم التعلم منها: ${results.learned}/${hardElements.length}`);

  console.log('\n💡 التوصيات:');
  const optimizations = brain.getOptimizations();
  optimizations.forEach(opt => console.log(`  - ${opt}`));
}

/**
 * سيناريو 4: التعلم المستمر
 */
export async function demoContinuousLearning(page: any) {
  const brain = new IntegratedSupremeBrain({ enableLearning: true });
  await brain.initialize(page);

  console.log('\n📚 سيناريو: التعلم المستمر\n');

  // المحاولة الأولى (قد تكون بطيئة)
  console.log('🔄 المحاولة الأولى (بدون معرفة سابقة)...');
  let start = Date.now();
  let result1 = await brain.findElement('زر الشراء', 'shop.example.com');
  const time1 = Date.now() - start;
  console.log(`⏱️  الوقت: ${time1}ms`);
  console.log(`💪 الثقة: ${(result1.confidence * 100).toFixed(1)}%`);

  // المحاولة الثانية (يجب أن تكون أسرع بسبب التعلم)
  console.log('\n🔄 المحاولة الثانية (بعد التعلم)...');
  start = Date.now();
  let result2 = await brain.findElement('زر الشراء', 'shop.example.com');
  const time2 = Date.now() - start;
  console.log(`⏱️  الوقت: ${time2}ms`);
  console.log(`💪 الثقة: ${(result2.confidence * 100).toFixed(1)}%`);

  // المحاولة الثالثة (أسرع وأكثر ثقة)
  console.log('\n🔄 المحاولة الثالثة (تعلم متقدم)...');
  start = Date.now();
  let result3 = await brain.findElement('زر الشراء', 'shop.example.com');
  const time3 = Date.now() - start;
  console.log(`⏱️  الوقت: ${time3}ms`);
  console.log(`💪 الثقة: ${(result3.confidence * 100).toFixed(1)}%`);

  console.log('\n📊 تحسن الأداء:');
  console.log(`  - التحسن من الأولى للثانية: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  console.log(`  - التحسن من الثانية للثالثة: ${((time2 - time3) / time2 * 100).toFixed(1)}%`);
  console.log(`  - تحسن الثقة: ${((result3.confidence - result1.confidence) * 100).toFixed(1)}%`);
}

/**
 * سيناريو 5: التشخيص والصيانة
 */
export async function demoDiagnosis(page: any) {
  const brain = new IntegratedSupremeBrain({ verboseLogging: false });
  await brain.initialize(page);

  console.log('\n🔧 سيناريو: التشخيص والصيانة\n');

  // تنفيذ عدة عمليات للحصول على بيانات
  for (let i = 0; i < 5; i++) {
    await brain.findElement(`عنصر رقم ${i + 1}`, 'test.example.com');
  }

  // التشخيص
  const diagnosis = await diagnoseSystem(page);
  
  console.log('\n📋 الملخص:');
  console.log(`✅ النظام ${diagnosis.health.isHealthy ? 'سليم' : 'يحتاج صيانة'}`);
  console.log(`📊 معدل النجاح: ${(diagnosis.health.successRate * 100).toFixed(1)}%`);
  console.log(`⚡ متوسط الاستجابة: ${diagnosis.health.averageResponseTime}ms`);
}

/**
 * برنامج تشغيل العروض
 */
export async function runAllDemos(page: any) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 عقل الروبوت الفائق - عرض توضيحي شامل              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Demo 1
    console.log('\n═══ Demo 1: تسجيل الدخول الذكي ═══');
    // await demoSmartLogin(page);

    // Demo 2
    console.log('\n═══ Demo 2: استخراج البيانات الذكي ═══');
    // await demoSmartDataExtraction(page);

    // Demo 3
    console.log('\n═══ Demo 3: التعامل مع العناصر الصعبة ═══');
    // await demoHardElementHandling(page);

    // Demo 4
    console.log('\n═══ Demo 4: التعلم المستمر ═══');
    // await demoContinuousLearning(page);

    // Demo 5
    console.log('\n═══ Demo 5: التشخيص والصيانة ═══');
    // await demoDiagnosis(page);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✅ انتهت جميع العروض                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('❌ خطأ أثناء تنفيذ العروض:', error.message);
  }
}

/**
 * نصائح الاستخدام الأمثل
 */
export const BestPractices = {
  /**
   * 1. تحديد المجال (Domain) لتحسين التعلم
   */
  alwaysSpecifyDomain: `
    // ✅ جيد - يساعد النظام على التعلم بشكل أفضل
    await brain.findElement('زر الشراء', 'amazon.com');
    
    // ❌ سيء - النظام لا يتعلم بشكل محسّن
    await brain.findElement('زر الشراء');
  `,

  /**
   * 2. استخدام أوصاف واضحة ودقيقة
   */
  clearDescriptions: `
    // ✅ جيد - واضح وشامل
    await brain.findElement('زر الشراء برتقالي اللون');
    
    // ⚠️ قد لا يعمل - غير واضح
    await brain.findElement('الشيء الأحمر');
  `,

  /**
   * 3. استخدام الأولويات للإجراءات المهمة
   */
  usePriorities: `
    // الإجراء الحرج يجب أن يكون له أولوية أعلى
    await brain.execute({
      id: 'critical_login',
      type: 'click',
      target: 'زر تسجيل الدخول',
      priority: 10  // أولوية عالية
    });
  `,

  /**
   * 4. مراقبة صحة النظام بانتظام
   */
  monitorHealth: `
    // تحقق من صحة النظام
    const health = brain.getHealth();
    if (health.successRate < 0.7) {
      console.log('تنبيه: معدل النجاح منخفض');
      const recommendations = brain.getOptimizations();
      console.log('التوصيات:', recommendations);
    }
  `,

  /**
   * 5. استخدام التقارير للتحليل
   */
  useReports: `
    // احصل على تقرير شامل
    const report = brain.getComprehensiveReport();
    console.log('معدل النجاح:', report.health.successRate);
    console.log('متوسط الاستجابة:', report.health.averageResponseTime);
    console.log('المعرفة المراكمة:', report.learning.totalMemories);
  `,
};
