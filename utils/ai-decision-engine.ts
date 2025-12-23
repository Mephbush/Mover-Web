/**
 * محرك القرارات الذكي للروبوت
 * يحلل الحالة الحالية ويتخذ قرارات بناءً على السياق والظروف
 */

export interface PageContext {
  url: string;
  title: string;
  content?: string;
  elements?: any[];
  screenshots?: string[];
  errors?: string[];
}

export interface DecisionResult {
  action: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[];
  params?: any;
}

export class AIDecisionEngine {
  /**
   * تحليل صفحة تسجيل دخول واتخاذ قرار
   */
  async analyzeLoginPage(context: PageContext): Promise<DecisionResult> {
    const { url, content = '' } = context;
    
    // البحث عن حقول الإدخال الشائعة
    const hasEmailField = this.detectEmailField(content);
    const hasPasswordField = this.detectPasswordField(content);
    const hasUsernameField = this.detectUsernameField(content);
    const hasCaptcha = this.detectCaptcha(content);
    const has2FA = this.detect2FA(content);

    let decision: DecisionResult = {
      action: 'login',
      confidence: 0,
      reasoning: '',
      params: {}
    };

    // تحديد استراتيجية تسجيل الدخول
    if (hasCaptcha) {
      decision.action = 'solve_captcha_then_login';
      decision.confidence = 0.7;
      decision.reasoning = 'تم اكتشاف CAPTCHA - يجب حلها أولاً';
      decision.alternatives = ['use_automation_bypass', 'manual_intervention'];
    } else if (has2FA) {
      decision.action = 'login_with_2fa';
      decision.confidence = 0.85;
      decision.reasoning = 'تم اكتشاف مصادقة ثنائية - سيتم التعامل معها';
    } else if (hasEmailField && hasPasswordField) {
      decision.action = 'email_password_login';
      decision.confidence = 0.95;
      decision.reasoning = 'صفحة تسجيل دخول قياسية بالبريد وكلمة المرور';
      decision.params = {
        emailSelector: this.findBestSelector(content, 'email'),
        passwordSelector: this.findBestSelector(content, 'password'),
        submitSelector: this.findBestSelector(content, 'submit')
      };
    } else if (hasUsernameField && hasPasswordField) {
      decision.action = 'username_password_login';
      decision.confidence = 0.9;
      decision.reasoning = 'صفحة تسجيل دخول باسم المستخدم وكلمة المرور';
    }

    return decision;
  }

  /**
   * تحليل صفحة إنشاء حساب واتخاذ قرار
   */
  async analyzeSignupPage(context: PageContext): Promise<DecisionResult> {
    const { content = '' } = context;
    
    const requiredFields = this.detectRequiredFields(content);
    const hasEmailVerification = this.detectEmailVerification(content);
    const hasPhoneVerification = this.detectPhoneVerification(content);
    const passwordRequirements = this.detectPasswordRequirements(content);

    return {
      action: 'create_account',
      confidence: 0.9,
      reasoning: `تم اكتشاف ${requiredFields.length} حقل مطلوب`,
      params: {
        requiredFields,
        needsEmailVerification: hasEmailVerification,
        needsPhoneVerification: hasPhoneVerification,
        passwordRequirements
      }
    };
  }

  /**
   * اتخاذ قرار بناءً على خطأ معين
   */
  async handleError(error: string, context: PageContext): Promise<DecisionResult> {
    const errorLower = error.toLowerCase();

    // خطأ بيانات الاعتماد
    if (errorLower.includes('incorrect') || errorLower.includes('invalid credentials')) {
      return {
        action: 'retry_with_different_credentials',
        confidence: 0.8,
        reasoning: 'بيانات اعتماد خاطئة - سيتم المحاولة ببيانات مختلفة'
      };
    }

    // خطأ CAPTCHA
    if (errorLower.includes('captcha')) {
      return {
        action: 'solve_captcha',
        confidence: 0.9,
        reasoning: 'يجب حل CAPTCHA للمتابعة'
      };
    }

    // خطأ انتهاء الجلسة
    if (errorLower.includes('session') || errorLower.includes('timeout')) {
      return {
        action: 'restart_session',
        confidence: 0.85,
        reasoning: 'انتهت الجلسة - سيتم البدء من جديد'
      };
    }

    // خطأ عنصر غير موجود
    if (errorLower.includes('not found') || errorLower.includes('element')) {
      return {
        action: 'wait_and_retry',
        confidence: 0.7,
        reasoning: 'العنصر غير موجود - سيتم الانتظار والمحاولة مرة أخرى',
        params: { waitTime: 3000, maxRetries: 3 }
      };
    }

    // خطأ شبكة
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return {
        action: 'check_connection_and_retry',
        confidence: 0.6,
        reasoning: 'مشكلة في الاتصال - سيتم فحص الاتصال وإعادة المحاولة'
      };
    }

    // خطأ غير معروف
    return {
      action: 'analyze_and_decide',
      confidence: 0.4,
      reasoning: 'خطأ غير معروف - يحتاج تحليل إضافي',
      alternatives: ['skip_step', 'manual_intervention', 'abort_task']
    };
  }

  /**
   * تحديد الإجراء التالي بناءً على حالة الصفحة
   */
  async decideNextAction(context: PageContext, currentStep: string): Promise<DecisionResult> {
    const { url, title, content = '' } = context;

    // فحص إذا تم إعادة التوجيه
    const wasRedirected = this.detectRedirect(url, currentStep);
    if (wasRedirected) {
      return {
        action: 'verify_redirect',
        confidence: 0.85,
        reasoning: 'تم اكتشاف إعادة توجيه - يجب التحقق من الصفحة الجديدة'
      };
    }

    // فحص إذا ظهرت رسالة نجاح
    const hasSuccessMessage = this.detectSuccessMessage(content);
    if (hasSuccessMessage) {
      return {
        action: 'proceed_to_next_step',
        confidence: 0.95,
        reasoning: 'تم اكتشاف رسالة نجاح - المتابعة للخطوة التالية'
      };
    }

    // فحص إذا ظهر طلب تحقق
    const needsVerification = this.detectVerificationRequest(content);
    if (needsVerification.detected) {
      return {
        action: 'handle_verification',
        confidence: 0.9,
        reasoning: `يتطلب ${needsVerification.type} للمتابعة`,
        params: { verificationType: needsVerification.type }
      };
    }

    // فحص إذا ظهرت نافذة منبثقة
    const hasModal = this.detectModal(content);
    if (hasModal) {
      return {
        action: 'handle_modal',
        confidence: 0.8,
        reasoning: 'تم اكتشاف نافذة منبثقة - يجب التعامل معها'
      };
    }

    // الإجراء الافتراضي
    return {
      action: 'continue',
      confidence: 0.6,
      reasoning: 'لا توجد مؤشرات خاصة - المتابعة بشكل طبيعي'
    };
  }

  /**
   * اختيار أفضل استراتيجية لملء النموذج
   */
  async selectFormStrategy(formFields: any[]): Promise<DecisionResult> {
    const fieldTypes = formFields.map(f => f.type);
    const hasConditionalFields = this.detectConditionalFields(formFields);

    if (hasConditionalFields) {
      return {
        action: 'fill_form_conditionally',
        confidence: 0.85,
        reasoning: 'النموذج يحتوي على حقول مشروطة - سيتم ملؤها بناءً على الحالة'
      };
    }

    if (fieldTypes.length > 10) {
      return {
        action: 'fill_form_in_chunks',
        confidence: 0.9,
        reasoning: 'نموذج كبير - سيتم ملؤه على دفعات لتجنب المشاكل'
      };
    }

    return {
      action: 'fill_form_sequentially',
      confidence: 0.95,
      reasoning: 'نموذج قياسي - سيتم ملؤه بشكل تسلسلي'
    };
  }

  // ====== وظائف الكشف المساعدة ======

  private detectEmailField(content: string): boolean {
    const patterns = [
      /type=["']email["']/i,
      /name=["'][^"']*email[^"']*["']/i,
      /id=["'][^"']*email[^"']*["']/i,
      /placeholder=["'][^"']*email[^"']*["']/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectPasswordField(content: string): boolean {
    const patterns = [
      /type=["']password["']/i,
      /name=["'][^"']*password[^"']*["']/i,
      /id=["'][^"']*password[^"']*["']/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectUsernameField(content: string): boolean {
    const patterns = [
      /name=["'][^"']*username[^"']*["']/i,
      /id=["'][^"']*username[^"']*["']/i,
      /placeholder=["'][^"']*username[^"']*["']/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectCaptcha(content: string): boolean {
    const patterns = [
      /recaptcha/i,
      /captcha/i,
      /hcaptcha/i,
      /data-sitekey/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detect2FA(content: string): boolean {
    const patterns = [
      /two[- ]?factor/i,
      /2fa/i,
      /verification code/i,
      /authenticator/i,
      /رمز التحقق/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectRequiredFields(content: string): string[] {
    const fields: string[] = [];
    const requiredPattern = /required|aria-required=["']true["']/i;
    
    // استخراج الحقول المطلوبة
    const inputMatches = content.match(/<input[^>]*>/gi) || [];
    for (const input of inputMatches) {
      if (requiredPattern.test(input)) {
        const nameMatch = input.match(/name=["']([^"']+)["']/i);
        if (nameMatch) {
          fields.push(nameMatch[1]);
        }
      }
    }
    
    return fields;
  }

  private detectEmailVerification(content: string): boolean {
    const patterns = [
      /verify.*email/i,
      /email.*verification/i,
      /confirm.*email/i,
      /تأكيد البريد/i,
      /تحقق من البريد/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectPhoneVerification(content: string): boolean {
    const patterns = [
      /verify.*phone/i,
      /phone.*verification/i,
      /sms.*code/i,
      /تأكيد الهاتف/i,
      /رمز.*sms/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectPasswordRequirements(content: string): any {
    return {
      minLength: this.extractNumberFromPattern(content, /(?:at least|minimum)\s*(\d+)\s*character/i) || 8,
      requiresUppercase: /uppercase|capital letter/i.test(content),
      requiresLowercase: /lowercase/i.test(content),
      requiresNumber: /number|digit/i.test(content),
      requiresSpecial: /special character|symbol/i.test(content)
    };
  }

  private detectSuccessMessage(content: string): boolean {
    const patterns = [
      /success/i,
      /successfully/i,
      /completed/i,
      /تم بنجاح/i,
      /نجحت العملية/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectVerificationRequest(content: string): { detected: boolean; type?: string } {
    if (/email.*verification|verify.*email/i.test(content)) {
      return { detected: true, type: 'email' };
    }
    if (/phone.*verification|verify.*phone|sms/i.test(content)) {
      return { detected: true, type: 'phone' };
    }
    if (/enter.*code|verification.*code/i.test(content)) {
      return { detected: true, type: 'code' };
    }
    return { detected: false };
  }

  private detectModal(content: string): boolean {
    const patterns = [
      /class=["'][^"']*modal[^"']*["']/i,
      /class=["'][^"']*popup[^"']*["']/i,
      /class=["'][^"']*dialog[^"']*["']/i,
      /role=["']dialog["']/i
    ];
    return patterns.some(p => p.test(content));
  }

  private detectRedirect(currentUrl: string, expectedUrl: string): boolean {
    return currentUrl !== expectedUrl && !currentUrl.includes(expectedUrl);
  }

  private detectConditionalFields(fields: any[]): boolean {
    return fields.some(f => f.conditional || f.dependsOn);
  }

  private findBestSelector(content: string, type: string): string {
    // البحث عن أفضل selector بناءً على النوع
    const patterns: { [key: string]: RegExp[] } = {
      email: [
        /id=["']([^"']*email[^"']*)["']/i,
        /name=["']([^"']*email[^"']*)["']/i
      ],
      password: [
        /id=["']([^"']*password[^"']*)["']/i,
        /name=["']([^"']*password[^"']*)["']/i
      ],
      submit: [
        /type=["']submit["'][^>]*id=["']([^"']+)["']/i,
        /type=["']submit["'][^>]*name=["']([^"']+)["']/i
      ]
    };

    for (const pattern of patterns[type] || []) {
      const match = content.match(pattern);
      if (match) {
        return `#${match[1]}`;
      }
    }

    return `input[type="${type}"]`;
  }

  private extractNumberFromPattern(content: string, pattern: RegExp): number | null {
    const match = content.match(pattern);
    return match ? parseInt(match[1], 10) : null;
  }
}

// مثيل مشترك
export const aiDecisionEngine = new AIDecisionEngine();
