// دالة محسنة لتحليل السكريبت
function parseScript(script: string): ActionStep[] {
  const steps: ActionStep[] = [];
  
  // محاولة تحليل السكريبت
  if (!script || script.trim() === '') {
    return [];
  }
  
  // التحقق من نوع السكريبت أولاً
  const lines = script.split('\n');
  let currentStep: ActionStep | null = null;
  let stepCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // التعرف على بداية خطوة جديدة من التعليق
    if (line.includes('// Step') || line.includes('// خطوة')) {
      // حفظ الخطوة السابقة
      if (currentStep) {
        steps.push(currentStep);
      }
      
      // إنشاء خطوة جديدة
      stepCounter++;
      currentStep = {
        id: `step-${stepCounter}`,
        type: 'navigate',
        params: {},
        fallbacks: [],
        conditions: [],
        errorHandling: {
          ignoreErrors: false,
          retryCount: 3
        }
      };
    }
    
    if (!currentStep) continue;
    
    // تحليل نوع الخطوة والمعاملات
    if (line.includes('await page.goto(')) {
      const urlMatch = line.match(/goto\(['"]([^'"]+)['"]/);
      currentStep.type = 'navigate';
      currentStep.params = { url: urlMatch?.[1] || '' };
    } else if (line.includes('await page.click(')) {
      const selectorMatch = line.match(/click\(['"]([^'"]+)['"]/);
      currentStep.type = 'click';
      currentStep.params = { selector: selectorMatch?.[1] || '' };
    } else if (line.includes('await page.fill(')) {
      const matches = line.match(/fill\(['"]([^'"]+)['"],\s*['"]([^'"]*)['"]/);
      currentStep.type = 'type';
      currentStep.params = { 
        selector: matches?.[1] || '', 
        text: matches?.[2] || '' 
      };
    } else if (line.includes('await page.waitForTimeout(')) {
      const durationMatch = line.match(/waitForTimeout\((\d+)\)/);
      currentStep.type = 'wait';
      currentStep.params = { 
        type: 'time', 
        duration: parseInt(durationMatch?.[1] || '1000') 
      };
    } else if (line.includes('await page.waitForSelector(')) {
      const selectorMatch = line.match(/waitForSelector\(['"]([^'"]+)['"]/);
      currentStep.type = 'wait';
      currentStep.params = { 
        type: 'selector', 
        selector: selectorMatch?.[1] || '' 
      };
    } else if (line.includes('await page.$$eval(')) {
      const selectorMatch = line.match(/\$\$eval\(['"]([^'"]+)['"]/);
      currentStep.type = 'extract';
      currentStep.params = { selector: selectorMatch?.[1] || '' };
    } else if (line.includes('await page.screenshot(')) {
      currentStep.type = 'screenshot';
      currentStep.params = { 
        fullPage: line.includes('fullPage: true') 
      };
    } else if (line.includes('window.scrollTo')) {
      const posMatch = line.match(/scrollTo\(\d+,\s*(\d+|document\.body\.scrollHeight)\)/);
      currentStep.type = 'scroll';
      currentStep.params = { 
        position: posMatch?.[1] === 'document.body.scrollHeight' ? 'end' : posMatch?.[1] || 'end' 
      };
    }
    
    // تحليل معالجة الأخطاء
    if (line.includes('let retries_step')) {
      const retryMatch = line.match(/=\s*(\d+)/);
      if (retryMatch) {
        currentStep.errorHandling.retryCount = parseInt(retryMatch[1]);
      }
    }
    
    if (line.includes('console.warn') && line.includes('تخطي الخطأ')) {
      currentStep.errorHandling.ignoreErrors = true;
    }
  }
  
  // إضافة آخر خطوة
  if (currentStep && currentStep.type) {
    steps.push(currentStep);
  }
  
  return steps;
}

// ملاحظة: هذا الملف مؤقت للمراجعة فقط
// سيتم نسخ الدالة إلى AdvancedVisualBuilder.tsx
export {};
