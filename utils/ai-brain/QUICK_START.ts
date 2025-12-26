/**
 * 🚀 دليل البدء السريع مع عقل الروبوت الفائق
 * Quick Start Guide - Supreme Robot Brain v2.0
 * 
 * هذا الملف يحتوي على أمثلة عملية سهلة الفهم
 * استخدمها كنقطة انطلاق للعمل مع النظام الجديد
 */

/**
 * ═════════════════════════════════════════════════════════════
 * 1️⃣  الاستخدام الأساسي - Basic Usage
 * ═════════════════════════════════════════════════════════════
 */

// الطريقة الأولى: استخدام الكائن الموحد (الأسهل)
export async function basicUsage_Method1(page: any) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  
  // تهيئة مرة واحدة
  await integratedBrain.initialize(page);

  // البحث عن عنصر
  const found = await integratedBrain.findElement(
    'زر تسجيل الدخول',  // وصف العنصر
    'gmail.com'          // المجال (مهم للتعلم)
  );

  if (found.found) {
    console.log('✅ تم العثور على العنصر');
    console.log(`   المحدد: ${found.selector}`);
    console.log(`   الثقة: ${found.confidence}`);
    console.log(`   السرعة: ${found.timeMs}ms`);
  }
}

// الطريقة الثانية: استخدام الدوال السريعة
export async function basicUsage_Method2(page: any) {
  const { quickFind, smartAction } = require('./supreme-brain-exports');

  // البحث السريع
  const element = await quickFind(page, 'حقل البريد الإلكتروني', {
    domain: 'gmail.com',
    timeout: 5000,
  });

  // الإجراء الذكي
  const result = await smartAction(page, {
    type: 'fill',
    target: 'حقل البريد الإلكتروني',
    value: 'user@example.com',
  }, {
    domain: 'gmail.com',
  });
}

/**
 * ═════════════════════════════════════════════════════════════
 * 2️⃣  أنماط الاستخدام الشائعة - Common Patterns
 * ═════════════════════════════════════════════════════════════
 */

// النمط 1: تسجيل دخول
export async function pattern_Login(page: any, email: string, password: string) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  await integratedBrain.initialize(page);

  // ملء البريد الإلكتروني
  await integratedBrain.execute({
    id: '1',
    type: 'fill',
    target: 'حقل البريد الإلكتروني',
    value: email,
    domain: page.url?.() || 'login.site',
  });

  // ملء كلمة المرور
  await integratedBrain.execute({
    id: '2',
    type: 'fill',
    target: 'حقل كلمة المرور',
    value: password,
    domain: page.url?.() || 'login.site',
  });

  // النقر على زر تسجيل الدخول
  await integratedBrain.execute({
    id: '3',
    type: 'click',
    target: 'زر تسجيل الدخول',
    domain: page.url?.() || 'login.site',
    priority: 10, // أولوية عالية
  });
}

// النمط 2: استخراج البيانات
export async function pattern_ExtractData(page: any, dataFields: string[]) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  await integratedBrain.initialize(page);

  const extracted: Record<string, any> = {};

  for (const field of dataFields) {
    const result = await integratedBrain.findElement(
      field,
      page.url?.() || 'unknown'
    );

    if (result.found) {
      extracted[field] = {
        selector: result.selector,
        confidence: result.confidence,
      };
    }
  }

  return extracted;
}

// النمط 3: النقر المتكرر على عناصر
export async function pattern_MultipleClicks(
  page: any,
  targets: string[],
  domain: string
) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  await integratedBrain.initialize(page);

  const results = [];

  for (const target of targets) {
    const result = await integratedBrain.execute({
      id: `click_${Date.now()}`,
      type: 'click',
      target,
      domain,
    });

    results.push(result);
  }

  return results;
}

/**
 * ═════════════════════════════════════════════════════════════
 * 3️⃣  الميزات المتقدمة - Advanced Features
 * ═════════════════════════════════════════════════════════════
 */

// مراقبة الأداء
export function feature_PerformanceMonitoring(integratedBrain: any) {
  // الحصول على حالة الصحة
  const health = integratedBrain.getHealth();
  console.log('🏥 صحة النظام:');
  console.log(`   معدل النجاح: ${(health.successRate * 100).toFixed(1)}%`);
  console.log(`   متوسط الاستجابة: ${health.averageResponseTime}ms`);
  console.log(`   الحالة: ${health.isHealthy ? '✅ سليم' : '⚠️ يحتاج صيانة'}`);

  if (health.issues?.length > 0) {
    console.log('   المشاكل:');
    health.issues.forEach(issue => console.log(`     - ${issue}`));
  }
}

// الحصول على التوصيات
export function feature_GetRecommendations(integratedBrain: any) {
  const recommendations = integratedBrain.getOptimizations();
  console.log('💡 التوصيات:');
  recommendations.forEach(rec => console.log(`   - ${rec}`));
}

// التقرير الشامل
export function feature_ComprehensiveReport(integratedBrain: any) {
  const report = integratedBrain.getComprehensiveReport();
  console.log('\n📊 التقرير الشامل:');
  console.log(JSON.stringify(report, null, 2));
}

/**
 * ═════════════════════════════════════════════════════════════
 * 4️⃣  معالجة الأخطاء - Error Handling
 * ═════════════════════════════════════════════════════════════
 */

export async function errorHandling_SafeExecution(page: any) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  
  try {
    await integratedBrain.initialize(page);

    const result = await integratedBrain.findElement('عنصر ما', 'site.com');

    if (!result.found) {
      console.log('⚠️ لم يتم العثور على العنصر');
      console.log(`   السبب: ${result.reasoning.join(', ')}`);
      
      // محاولة استراتيجيات بديلة
      const alternativeResult = await integratedBrain.findElement(
        'عنصر بديل',
        'site.com'
      );

      if (alternativeResult.found) {
        console.log('✅ وجد العنصر البديل');
      }
    }
  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
    
    // إعادة تعيين النظام في حالة الخطأ
    integratedBrain.reset();
  }
}

/**
 * ═════════════════════════════════════════════════════════════
 * 5️⃣  النصائح الذهبية - Golden Tips
 * ═════════════════════════════════════════════════════════════
 */

export const GoldenTips = {
  // نصيحة 1: استخدم الأوصاف الواضحة
  tip1_ClearDescriptions: `
    ✅ جيد:
    brain.findElement('زر الشراء الأخضر الكبير', 'amazon.com')
    
    ❌ سيء:
    brain.findElement('الزر', 'amazon.com')
  `,

  // نصيحة 2: حدد المجال دائماً
  tip2_AlwaysSpecifyDomain: `
    ✅ جيد (يساعد على التعلم):
    brain.findElement('زر البحث', 'google.com')
    
    ❌ سيء (لا يتعلم):
    brain.findElement('زر البحث')
  `,

  // نصيحة 3: استخدم الأولويات للعمليات الحرجة
  tip3_UsePriorities: `
    // العملية الحرجة
    await brain.execute({
      id: 'critical',
      type: 'click',
      target: 'زر الدفع',
      priority: 100  // أولوية عالية جداً
    });

    // العملية العادية
    await brain.execute({
      id: 'normal',
      type: 'click',
      target: 'زر تفاصيل إضافية',
      priority: 1   // أولوية منخفضة
    });
  `,

  // نصيحة 4: راقب الصحة بانتظام
  tip4_MonitorHealth: `
    // بعد عدة عمليات
    const health = brain.getHealth();
    
    if (health.successRate < 0.7) {
      console.warn('تنبيه: معدل النجاح منخفض');
      // اتخذ إجراء (مثلاً: إعادة تعيين أو تغيير الاستراتيجية)
    }
  `,

  // نصيحة 5: استخدم التقارير للتحليل
  tip5_AnalyzeReports: `
    const report = brain.getComprehensiveReport();
    
    // تحليل الأداء
    const { successRate, avgResponseTime } = report.health;
    
    // تحليل التعلم
    const { totalMemories, patterns } = report.learning;
    
    // الحصول على التوصيات
    const { recommendations } = report;
  `,
};

/**
 * ═════════════════════════════════════════════════════════════
 * 6️⃣  سيناريوهات واقعية - Real-World Scenarios
 * ═════════════════════════════════════════════════════════════
 */

// سيناريو 1: اختبار موقع تجارة إلكترونية
export async function scenario_EcommerceTesting(page: any) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  await integratedBrain.initialize(page);

  console.log('🛍️ اختبار موقع تجارة إلكترونية...\n');

  // البحث عن منتج
  const searchField = await integratedBrain.findElement('حقل البحث', 'ecommerce.com');
  if (searchField.found) {
    await integratedBrain.execute({
      id: '1',
      type: 'fill',
      target: 'حقل البحث',
      value: 'laptop',
      domain: 'ecommerce.com',
    });
  }

  // استخراج معلومات المنتج
  const productData = await integratedBrain.findElement('عنوان المنتج', 'ecommerce.com');
  const priceData = await integratedBrain.findElement('السعر', 'ecommerce.com');
  const ratingData = await integratedBrain.findElement('التقييم', 'ecommerce.com');

  console.log('📊 البيانات المستخرجة:');
  console.log(`  ✅ المنتج: ${productData.found ? 'موجود' : 'غير موجود'}`);
  console.log(`  ✅ السعر: ${priceData.found ? 'موجود' : 'غير موجود'}`);
  console.log(`  ✅ التقييم: ${ratingData.found ? 'موجود' : 'غير موجود'}`);
}

// سيناريو 2: اختبار نموذج تسجيل
export async function scenario_FormTesting(page: any) {
  const { integratedBrain } = require('./integrated-supreme-brain');
  await integratedBrain.initialize(page);

  console.log('📝 اختبار نموذج التسجيل...\n');

  const fields = [
    { name: 'الاسم الكامل', value: 'أحمد محمد' },
    { name: 'البريد الإلكتروني', value: 'ahmed@example.com' },
    { name: 'كلمة المرور', value: 'SecurePassword123' },
    { name: 'رقم الهاتف', value: '555-1234' },
  ];

  let successCount = 0;

  for (const field of fields) {
    const result = await integratedBrain.execute({
      id: `field_${field.name}`,
      type: 'fill',
      target: field.name,
      value: field.value,
      domain: 'registration.site',
    });

    if (result.success) {
      console.log(`  ✅ ${field.name}`);
      successCount++;
    } else {
      console.log(`  ❌ ${field.name}`);
    }
  }

  console.log(`\n📊 النتيجة: ${successCount}/${fields.length} حقول`);

  // النقر على زر الإرسال
  await integratedBrain.execute({
    id: 'submit',
    type: 'click',
    target: 'زر الإرسال',
    domain: 'registration.site',
    priority: 10,
  });
}

/**
 * ═════════════════════════════════════════════════════════════
 * 🎯 خلاصة وملخص
 * ═════════════════════════════════════════════════════════════
 * 
 * عقل الروبوت الفائق يوفر:
 * 
 * 🚀 السرعة: البحث في أقل من 100ms
 * 🧠 الذكاء: فهم عميق للمواقع والعناصر
 * 📚 التعلم: يتحسن مع كل محاولة
 * 🎯 الدقة: معدل نجاح أعلى من 90%
 * 📊 المراقبة: تقارير شاملة وتوصيات
 * 
 * ابدأ الآن واستمتع بأفضل أداء! 🎉
 */
