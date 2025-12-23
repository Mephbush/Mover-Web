/**
 * قوالب إنشاء حسابات للمنصات المختلفة
 * يتضمن خطوات مفصلة لكل منصة مع معالجة متطلباتها الخاصة
 */

import { TempMailService } from './temp-mail-service';
import { AIDecisionEngine } from './ai-decision-engine';

export interface PlatformTemplate {
  id: string;
  name: string;
  platform: string;
  icon: string;
  description: string;
  category: 'social' | 'email' | 'commerce' | 'cloud' | 'dev' | 'other';
  requirements: {
    email: boolean;
    phone?: boolean;
    captcha?: boolean;
    verification?: 'email' | 'phone' | 'both';
    age?: number;
  };
  steps: PlatformStep[];
}

export interface PlatformStep {
  id: string;
  name: string;
  type: 'navigate' | 'fill' | 'click' | 'verify' | 'wait' | 'custom';
  description: string;
  selector?: string;
  value?: string | ((context: any) => string);
  waitFor?: string;
  conditions?: any[];
  errorHandling?: {
    retry: boolean;
    fallback?: string;
    skipOnError?: boolean;
  };
}

export const platformTemplates: PlatformTemplate[] = [
  // ===== منصات التواصل الاجتماعي =====
  {
    id: 'facebook',
    name: 'Facebook',
    platform: 'facebook.com',
    icon: '📘',
    description: 'إنشاء حساب Facebook جديد',
    category: 'social',
    requirements: {
      email: true,
      verification: 'email',
      age: 13
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة التسجيل',
        value: 'https://www.facebook.com/reg/',
        waitFor: 'input[name="firstname"]'
      },
      {
        id: 'fill_firstname',
        name: 'الاسم الأول',
        type: 'fill',
        description: 'إدخال الاسم الأول',
        selector: 'input[name="firstname"]',
        value: (ctx) => ctx.generateName().first
      },
      {
        id: 'fill_lastname',
        name: 'الاسم الأخير',
        type: 'fill',
        description: 'إدخال الاسم الأخير',
        selector: 'input[name="lastname"]',
        value: (ctx) => ctx.generateName().last
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="reg_email__"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'confirm_email',
        name: 'تأكيد البريد',
        type: 'fill',
        description: 'إعادة إدخال البريد الإلكتروني',
        selector: 'input[name="reg_email_confirmation__"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="reg_passwd__"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'select_birthday',
        name: 'تاريخ الميلاد',
        type: 'custom',
        description: 'اختيار تاريخ ميلاد عشوائي',
        value: (ctx) => ctx.generateBirthday(18, 65)
      },
      {
        id: 'select_gender',
        name: 'الجنس',
        type: 'click',
        description: 'اختيار الجنس',
        selector: 'input[name="sex"][value="2"]'
      },
      {
        id: 'submit',
        name: 'إرسال النموذج',
        type: 'click',
        description: 'النقر على زر التسجيل',
        selector: 'button[name="websubmit"]',
        waitFor: '.confirmationCode, .emailVerification'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق من البريد',
        value: 'email'
      }
    ]
  },

  {
    id: 'twitter',
    name: 'Twitter (X)',
    platform: 'twitter.com',
    icon: '🐦',
    description: 'إنشاء حساب Twitter/X جديد',
    category: 'social',
    requirements: {
      email: true,
      phone: false,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة التسجيل',
        value: 'https://twitter.com/i/flow/signup',
        waitFor: 'input[name="name"]'
      },
      {
        id: 'fill_name',
        name: 'الاسم',
        type: 'fill',
        description: 'إدخال الاسم الكامل',
        selector: 'input[name="name"]',
        value: (ctx) => ctx.generateFullName()
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="email"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'fill_birthday',
        name: 'تاريخ الميلاد',
        type: 'custom',
        description: 'إدخال تاريخ الميلاد',
        value: (ctx) => ctx.generateBirthday(18, 65)
      },
      {
        id: 'click_next_1',
        name: 'التالي',
        type: 'click',
        description: 'الانتقال للخطوة التالية',
        selector: '[data-testid="ocf_submit_button"]'
      },
      {
        id: 'confirm',
        name: 'تأكيد',
        type: 'click',
        description: 'تأكيد المعلومات',
        selector: '[data-testid="ocf_submit_button"]'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق',
        value: 'email'
      },
      {
        id: 'enter_code',
        name: 'إدخال الكود',
        type: 'fill',
        description: 'إدخال كود التحقق',
        selector: 'input[name="verfication_code"]',
        value: (ctx) => ctx.verificationCode
      },
      {
        id: 'create_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'submit',
        name: 'إنهاء التسجيل',
        type: 'click',
        description: 'إنهاء عملية التسجيل',
        selector: '[data-testid="ocf_submit_button"]'
      }
    ]
  },

  {
    id: 'instagram',
    name: 'Instagram',
    platform: 'instagram.com',
    icon: '📷',
    description: 'إنشاء حساب Instagram جديد',
    category: 'social',
    requirements: {
      email: true,
      verification: 'email',
      age: 13
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة التسجيل',
        value: 'https://www.instagram.com/accounts/emailsignup/',
        waitFor: 'input[name="emailOrPhone"]'
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="emailOrPhone"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'fill_fullname',
        name: 'الاسم الكامل',
        type: 'fill',
        description: 'إدخال الاسم الكامل',
        selector: 'input[name="fullName"]',
        value: (ctx) => ctx.generateFullName()
      },
      {
        id: 'fill_username',
        name: 'اسم المستخدم',
        type: 'fill',
        description: 'اختيار اسم مستخدم فريد',
        selector: 'input[name="username"]',
        value: (ctx) => ctx.generateUsername()
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور قوية',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'submit',
        name: 'التسجيل',
        type: 'click',
        description: 'النقر على زر التسجيل',
        selector: 'button[type="submit"]',
        waitFor: 'select[title="Month:"]'
      },
      {
        id: 'fill_birthday',
        name: 'تاريخ الميلاد',
        type: 'custom',
        description: 'إدخال تاريخ الميلاد',
        value: (ctx) => ctx.generateBirthday(18, 65)
      },
      {
        id: 'click_next',
        name: 'التالي',
        type: 'click',
        description: 'الانتقال للخطوة التالية',
        selector: 'button[type="button"]'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق',
        value: 'email'
      },
      {
        id: 'enter_code',
        name: 'إدخال الكود',
        type: 'fill',
        description: 'إدخال كود التحقق',
        selector: 'input[name="email_confirmation_code"]',
        value: (ctx) => ctx.verificationCode
      },
      {
        id: 'confirm',
        name: 'تأكيد',
        type: 'click',
        description: 'تأكيد الحساب',
        selector: 'button[type="button"]'
      }
    ]
  },

  {
    id: 'linkedin',
    name: 'LinkedIn',
    platform: 'linkedin.com',
    icon: '💼',
    description: 'إنشاء حساب LinkedIn احترافي',
    category: 'social',
    requirements: {
      email: true,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة التسجيل',
        value: 'https://www.linkedin.com/signup',
        waitFor: 'input[name="email"]'
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="email"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'submit_1',
        name: 'الموافقة والانضمام',
        type: 'click',
        description: 'النقر على زر الانضمام',
        selector: 'button[type="submit"]'
      },
      {
        id: 'fill_firstname',
        name: 'الاسم الأول',
        type: 'fill',
        description: 'إدخال الاسم الأول',
        selector: 'input[name="firstName"]',
        value: (ctx) => ctx.generateName().first
      },
      {
        id: 'fill_lastname',
        name: 'الاسم الأخير',
        type: 'fill',
        description: 'إدخال الاسم الأخير',
        selector: 'input[name="lastName"]',
        value: (ctx) => ctx.generateName().last
      },
      {
        id: 'continue',
        name: 'متابعة',
        type: 'click',
        description: 'المتابعة للخطوة التالية',
        selector: 'button[type="submit"]'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق',
        value: 'email'
      },
      {
        id: 'enter_code',
        name: 'إدخال الكود',
        type: 'fill',
        description: 'إدخال كود التحقق',
        selector: 'input[name="pin"]',
        value: (ctx) => ctx.verificationCode
      },
      {
        id: 'submit_code',
        name: 'إرسال الكود',
        type: 'click',
        description: 'تأكيد الكود',
        selector: 'button[type="submit"]'
      }
    ]
  },

  // ===== منصات البريد الإلكتروني =====
  {
    id: 'gmail',
    name: 'Gmail',
    platform: 'gmail.com',
    icon: '📧',
    description: 'إنشاء حساب Gmail جديد',
    category: 'email',
    requirements: {
      email: false,
      phone: true,
      verification: 'phone'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة إنشاء حساب Google',
        value: 'https://accounts.google.com/signup',
        waitFor: 'input[name="firstName"]'
      },
      {
        id: 'fill_firstname',
        name: 'الاسم الأول',
        type: 'fill',
        description: 'إدخال الاسم الأول',
        selector: 'input[name="firstName"]',
        value: (ctx) => ctx.generateName().first
      },
      {
        id: 'fill_lastname',
        name: 'الاسم الأخير',
        type: 'fill',
        description: 'إدخال الاسم الأخير',
        selector: 'input[name="lastName"]',
        value: (ctx) => ctx.generateName().last
      },
      {
        id: 'fill_username',
        name: 'اسم المستخدم',
        type: 'fill',
        description: 'اختيار اسم مستخدم Gmail',
        selector: 'input[name="Username"]',
        value: (ctx) => ctx.generateUsername()
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="Passwd"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'confirm_password',
        name: 'تأكيد كلمة المرور',
        type: 'fill',
        description: 'إعادة إدخال كلمة المرور',
        selector: 'input[name="ConfirmPasswd"]',
        value: (ctx) => ctx.password
      },
      {
        id: 'click_next',
        name: 'التالي',
        type: 'click',
        description: 'الانتقال للخطوة التالية',
        selector: '#accountDetailsNext'
      },
      {
        id: 'skip_phone',
        name: 'تخطي الهاتف',
        type: 'click',
        description: 'تخطي إضافة رقم الهاتف (إن أمكن)',
        selector: '#gradsIdvPhoneNext',
        errorHandling: { skipOnError: true, retry: false }
      }
    ]
  },

  {
    id: 'outlook',
    name: 'Outlook',
    platform: 'outlook.com',
    icon: '📬',
    description: 'إنشاء حساب Outlook جديد',
    category: 'email',
    requirements: {
      email: false,
      captcha: true,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة إنشاء حساب Outlook',
        value: 'https://signup.live.com/signup',
        waitFor: 'input[name="MemberName"]'
      },
      {
        id: 'fill_email',
        name: 'اسم البريد',
        type: 'fill',
        description: 'اختيار اسم البريد الإلكتروني',
        selector: 'input[name="MemberName"]',
        value: (ctx) => ctx.generateUsername()
      },
      {
        id: 'select_domain',
        name: 'اختيار النطاق',
        type: 'click',
        description: 'اختيار @outlook.com',
        selector: 'select[name="LiveDomainBoxList"]'
      },
      {
        id: 'click_next',
        name: 'التالي',
        type: 'click',
        description: 'الانتقال للخطوة التالية',
        selector: '#iSignupAction'
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="Password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'fill_firstname',
        name: 'الاسم الأول',
        type: 'fill',
        description: 'إدخال الاسم الأول',
        selector: 'input[name="FirstName"]',
        value: (ctx) => ctx.generateName().first
      },
      {
        id: 'fill_lastname',
        name: 'الاسم الأخير',
        type: 'fill',
        description: 'إدخال الاسم الأخير',
        selector: 'input[name="LastName"]',
        value: (ctx) => ctx.generateName().last
      },
      {
        id: 'fill_birthday',
        name: 'تاريخ الميلاد',
        type: 'custom',
        description: 'إدخال تاريخ الميلاد',
        value: (ctx) => ctx.generateBirthday(18, 65)
      },
      {
        id: 'submit',
        name: 'إنشاء الحساب',
        type: 'click',
        description: 'النقر على زر إنشاء الحساب',
        selector: '#iSignupAction'
      }
    ]
  },

  // ===== منصات التطوير =====
  {
    id: 'github',
    name: 'GitHub',
    platform: 'github.com',
    icon: '🐙',
    description: 'إنشاء حساب GitHub للمطورين',
    category: 'dev',
    requirements: {
      email: true,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة التسجيل',
        value: 'https://github.com/signup',
        waitFor: 'input[name="email"]'
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="email"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'click_continue',
        name: 'متابعة',
        type: 'click',
        description: 'المتابعة',
        selector: 'button[type="submit"]'
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور قوية',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'click_continue_2',
        name: 'متابعة',
        type: 'click',
        description: 'المتابعة',
        selector: 'button[type="submit"]'
      },
      {
        id: 'fill_username',
        name: 'اسم المستخدم',
        type: 'fill',
        description: 'اختيار اسم مستخدم فريد',
        selector: 'input[name="login"]',
        value: (ctx) => ctx.generateUsername()
      },
      {
        id: 'click_continue_3',
        name: 'متابعة',
        type: 'click',
        description: 'المتابعة',
        selector: 'button[type="submit"]'
      },
      {
        id: 'verify_puzzle',
        name: 'حل اللغز',
        type: 'custom',
        description: 'حل لغز التحقق من GitHub',
        value: 'solve_github_puzzle'
      },
      {
        id: 'create_account',
        name: 'إ��شاء الحساب',
        type: 'click',
        description: 'تأكيد إنشاء الحساب',
        selector: 'button[type="submit"]'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق',
        value: 'email'
      },
      {
        id: 'enter_code',
        name: 'إدخال الكود',
        type: 'fill',
        description: 'إدخال كود التحقق',
        selector: 'input[name="verification_code"]',
        value: (ctx) => ctx.verificationCode
      }
    ]
  },

  // ===== منصات التجارة الإلكترونية =====
  {
    id: 'amazon',
    name: 'Amazon',
    platform: 'amazon.com',
    icon: '🛒',
    description: 'إنشاء حساب Amazon للتسوق',
    category: 'commerce',
    requirements: {
      email: true,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة إنشاء الحساب',
        value: 'https://www.amazon.com/ap/register',
        waitFor: 'input[name="customerName"]'
      },
      {
        id: 'fill_name',
        name: 'الاسم',
        type: 'fill',
        description: 'إدخال الاسم الكامل',
        selector: 'input[name="customerName"]',
        value: (ctx) => ctx.generateFullName()
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="email"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'confirm_password',
        name: 'تأكيد كلمة المرور',
        type: 'fill',
        description: 'إعادة إدخال كلمة المرور',
        selector: 'input[name="passwordCheck"]',
        value: (ctx) => ctx.password
      },
      {
        id: 'submit',
        name: 'إنشاء حساب Amazon',
        type: 'click',
        description: 'إنشاء الحساب',
        selector: '#continue'
      },
      {
        id: 'verify_email',
        name: 'تحقق البريد',
        type: 'verify',
        description: 'الحصول على كود التحقق',
        value: 'email'
      },
      {
        id: 'enter_otp',
        name: 'إدخال OTP',
        type: 'fill',
        description: 'إدخال رمز OTP',
        selector: 'input[name="cvf_code"]',
        value: (ctx) => ctx.verificationCode
      },
      {
        id: 'verify',
        name: 'التحقق',
        type: 'click',
        description: 'تأكيد الرمز',
        selector: '#a-autoid-0'
      }
    ]
  },

  {
    id: 'reddit',
    name: 'Reddit',
    platform: 'reddit.com',
    icon: '🤖',
    description: 'إنشاء حساب Reddit جديد',
    category: 'social',
    requirements: {
      email: true,
      verification: 'email'
    },
    steps: [
      {
        id: 'nav',
        name: 'الانتقال للصفحة',
        type: 'navigate',
        description: 'فتح صفحة Reddit الرئيسية',
        value: 'https://www.reddit.com/',
        waitFor: '[data-testid="signup-button"]'
      },
      {
        id: 'click_signup',
        name: 'النقر على التسجيل',
        type: 'click',
        description: 'فتح نموذج التسجيل',
        selector: '[data-testid="signup-button"]'
      },
      {
        id: 'fill_email',
        name: 'البريد الإلكتروني',
        type: 'fill',
        description: 'إدخال البريد الإلكتروني',
        selector: 'input[name="email"]',
        value: (ctx) => ctx.tempEmail
      },
      {
        id: 'click_continue',
        name: 'متابع��',
        type: 'click',
        description: 'المتابعة',
        selector: 'button[type="submit"]'
      },
      {
        id: 'fill_username',
        name: 'اسم المستخدم',
        type: 'fill',
        description: 'اختيار اسم مستخدم',
        selector: 'input[name="username"]',
        value: (ctx) => ctx.generateUsername()
      },
      {
        id: 'fill_password',
        name: 'كلمة المرور',
        type: 'fill',
        description: 'إنشاء كلمة مرور',
        selector: 'input[name="password"]',
        value: (ctx) => ctx.generatePassword()
      },
      {
        id: 'submit',
        name: 'إنشاء الحساب',
        type: 'click',
        description: 'إنشاء حساب Reddit',
        selector: 'button[type="submit"]'
      }
    ]
  }
];

/**
 * الحصول على قالب حسب المعرف
 */
export function getPlatformTemplate(id: string): PlatformTemplate | undefined {
  return platformTemplates.find(t => t.id === id);
}

/**
 * الحصول على القوالب حسب الفئة
 */
export function getTemplatesByCategory(category: string): PlatformTemplate[] {
  return platformTemplates.filter(t => t.category === category);
}

/**
 * البحث في القوالب
 */
export function searchTemplates(query: string): PlatformTemplate[] {
  const q = query.toLowerCase();
  return platformTemplates.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.platform.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  );
}
