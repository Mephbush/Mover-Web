/**
 * خدمة البريد الإلكتروني المؤقت - دعم temp-mail.io
 * توفر إمكانية إنشاء بريد مؤقت والحصول على رسائل التحقق
 */

export interface TempEmail {
  address: string;
  token: string;
  createdAt: Date;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  html: string;
  receivedAt: Date;
  verificationCode?: string;
  verificationLink?: string;
}

export class TempMailService {
  private apiBase = 'https://api.mail.tm';
  private currentEmail: TempEmail | null = null;

  /**
   * إنشاء عنوان بريد إلكتروني مؤقت جديد
   */
  async createTempEmail(): Promise<TempEmail> {
    try {
      // 1. الحصول على النطاقات المتاحة
      const domainsResponse = await fetch(`${this.apiBase}/domains`);
      const domains = await domainsResponse.json();
      
      if (!domains || domains.length === 0) {
        throw new Error('لا توجد نطاقات متاحة');
      }

      const domain = domains[0].domain;
      const username = this.generateRandomUsername();
      const password = this.generateRandomPassword();
      const address = `${username}@${domain}`;

      // 2. إنشاء الحساب
      const accountResponse = await fetch(`${this.apiBase}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
      });

      if (!accountResponse.ok) {
        throw new Error('فشل إنشاء حساب البريد المؤقت');
      }

      // 3. تسجيل الدخول للحصول على Token
      const loginResponse = await fetch(`${this.apiBase}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password })
      });

      const loginData = await loginResponse.json();

      this.currentEmail = {
        address,
        token: loginData.token,
        createdAt: new Date()
      };

      return this.currentEmail;
    } catch (error) {
      console.error('Error creating temp email:', error);
      throw error;
    }
  }

  /**
   * الحصول على الرسائل الواردة
   */
  async getMessages(maxWaitSeconds: number = 60): Promise<EmailMessage[]> {
    if (!this.currentEmail) {
      throw new Error('لا يوجد بريد إلكتروني نشط');
    }

    const startTime = Date.now();
    let messages: EmailMessage[] = [];

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      try {
        const response = await fetch(`${this.apiBase}/messages`, {
          headers: {
            'Authorization': `Bearer ${this.currentEmail.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            messages = await Promise.all(
              data.map(async (msg: any) => {
                const fullMessage = await this.getMessageById(msg.id);
                return fullMessage;
              })
            );
            
            if (messages.length > 0) {
              break;
            }
          }
        }

        // انتظر ثانيتين قبل المحاولة التالية
        await this.sleep(2000);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }

    return messages;
  }

  /**
   * الحصول على رسالة محددة بالتفاصيل الكاملة
   */
  async getMessageById(messageId: string): Promise<EmailMessage> {
    if (!this.currentEmail) {
      throw new Error('لا يوجد بريد إلكتروني نشط');
    }

    const response = await fetch(`${this.apiBase}/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${this.currentEmail.token}`
      }
    });

    const data = await response.json();

    // استخراج رمز التحقق من الرسالة
    const verificationCode = this.extractVerificationCode(data.text || data.html);
    const verificationLink = this.extractVerificationLink(data.html || data.text);

    return {
      id: data.id,
      from: data.from.address,
      subject: data.subject,
      body: data.text || '',
      html: data.html || '',
      receivedAt: new Date(data.createdAt),
      verificationCode,
      verificationLink
    };
  }

  /**
   * استخراج رمز التحقق من نص الرسالة
   */
  private extractVerificationCode(text: string): string | undefined {
    // الأنماط الشائعة لرموز التحقق
    const patterns = [
      /code[:\s]+(\d{4,8})/i,
      /verification[:\s]+(\d{4,8})/i,
      /رمز التحقق[:\s]+(\d{4,8})/i,
      /كود التأكيد[:\s]+(\d{4,8})/i,
      /\b(\d{6})\b/,
      /\b(\d{4})\b/,
      /OTP[:\s]+(\d{4,8})/i,
      />(\d{4,8})</
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * استخراج رابط التحقق من HTML الرسالة
   */
  private extractVerificationLink(html: string): string | undefined {
    // البحث عن روابط التحقق الشائعة
    const patterns = [
      /href=["']([^"']*verify[^"']*)["']/i,
      /href=["']([^"']*confirm[^"']*)["']/i,
      /href=["']([^"']*activate[^"']*)["']/i,
      /href=["']([^"']*validation[^"']*)["']/i,
      /(https?:\/\/[^\s<>"]+verify[^\s<>"]*)/i,
      /(https?:\/\/[^\s<>"]+confirm[^\s<>"]*)/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * انتظار رسالة تحتوي على رمز تحقق
   */
  async waitForVerificationCode(timeoutSeconds: number = 60): Promise<string> {
    const messages = await this.getMessages(timeoutSeconds);
    
    for (const message of messages) {
      if (message.verificationCode) {
        return message.verificationCode;
      }
    }

    throw new Error('لم يتم استلام رمز التحقق');
  }

  /**
   * انتظار رسالة تحتوي على رابط تحقق
   */
  async waitForVerificationLink(timeoutSeconds: number = 60): Promise<string> {
    const messages = await this.getMessages(timeoutSeconds);
    
    for (const message of messages) {
      if (message.verificationLink) {
        return message.verificationLink;
      }
    }

    throw new Error('لم يتم استلام رابط التحقق');
  }

  /**
   * النقر على رابط التحقق تلقائياً
   */
  async clickVerificationLink(page: any, timeoutSeconds: number = 60): Promise<boolean> {
    try {
      const link = await this.waitForVerificationLink(timeoutSeconds);
      await page.goto(link);
      return true;
    } catch (error) {
      console.error('Error clicking verification link:', error);
      return false;
    }
  }

  /**
   * الحصول على عنوان البريد الحالي
   */
  getCurrentEmail(): string | null {
    return this.currentEmail?.address || null;
  }

  /**
   * حذف البريد الإلكتروني
   */
  async deleteTempEmail(): Promise<void> {
    if (!this.currentEmail) return;

    try {
      await fetch(`${this.apiBase}/accounts/${this.currentEmail.address}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentEmail.token}`
        }
      });
    } catch (error) {
      console.error('Error deleting temp email:', error);
    }

    this.currentEmail = null;
  }

  private generateRandomUsername(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < 10; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-12) + 
           Math.random().toString(36).slice(-12).toUpperCase() +
           Math.floor(Math.random() * 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// مثيل مشترك للاستخدام
export const tempMailService = new TempMailService();
