/**
 * منطق الروبوت المتقدم جداً
 * Advanced Robot Brain Logic
 * 
 * نظام متقدم جداً للفهم والتفكير والتخطيط
 */

export interface RobotUnderstanding {
  pageContext: PageAnalysis;
  userIntent: string;
  elementContext: ElementAnalysis[];
  executionPath: ExecutionStep[];
  confidence: number;
  alternatives: ExecutionPath[];
}

export interface PageAnalysis {
  url: string;
  title: string;
  language: string;
  elementTypes: Map<string, number>;
  interactiveElements: string[];
  forms: FormAnalysis[];
  navigation: NavigationAnalysis;
  dynamicContent: boolean;
  loadingPatterns: string[];
}

export interface ElementAnalysis {
  selector: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
  isInteractive: boolean;
  isVisible: boolean;
  parent?: string;
  siblings?: string[];
  semanticRole: string;
  ariaLabel?: string;
  dataAttributes: Record<string, string>;
  confidence: number;
}

export interface FormAnalysis {
  selector: string;
  fields: FormField[];
  submitButton?: string;
  validation: string[];
  type: 'login' | 'signup' | 'search' | 'contact' | 'custom';
}

export interface FormField {
  selector: string;
  type: string;
  name?: string;
  placeholder?: string;
  required: boolean;
  validation: string[];
}

export interface NavigationAnalysis {
  type: string;
  items: NavItem[];
  currentPage: string;
}

export interface NavItem {
  text: string;
  href?: string;
  selector: string;
}

export interface ExecutionStep {
  id: string;
  action: string;
  target?: string;
  parameters?: Record<string, any>;
  expectedResult?: string;
  fallbacks?: ExecutionStep[];
  timeout: number;
}

export interface ExecutionPath {
  steps: ExecutionStep[];
  successProbability: number;
  estimatedTime: number;
  reasoning: string[];
}

/**
 * محرك تحليل الصفحات الذكي
 */
class PageUnderstandingEngine {
  /**
   * تحليل شامل للصفحة
   */
  async analyzePage(page: any): Promise<PageAnalysis> {
    const pageData = await page.evaluate(() => {
      const getElementInfo = (el: any) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 100),
        class: el.className,
        id: el.id,
        visible: el.offsetParent !== null,
      });

      return {
        title: document.title,
        url: window.location.href,
        lang: document.documentElement.lang || 'ar',
        elements: {
          buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(getElementInfo),
          inputs: Array.from(document.querySelectorAll('input, textarea')).map(getElementInfo),
          links: Array.from(document.querySelectorAll('a')).map(getElementInfo),
          forms: Array.from(document.querySelectorAll('form')).map(getElementInfo),
          select: Array.from(document.querySelectorAll('select')).map(getElementInfo),
        },
        bodyText: document.body.innerText?.substring(0, 500),
      };
    });

    return {
      url: pageData.url,
      title: pageData.title,
      language: pageData.lang,
      elementTypes: new Map([
        ['button', pageData.elements.buttons.length],
        ['input', pageData.elements.inputs.length],
        ['link', pageData.elements.links.length],
        ['form', pageData.elements.forms.length],
        ['select', pageData.elements.select.length],
      ]),
      interactiveElements: [
        ...pageData.elements.buttons.map((b: any) => b.tag),
        ...pageData.elements.inputs.map((i: any) => i.tag),
        ...pageData.elements.links.map((l: any) => l.tag),
      ],
      forms: this.analyzeForms(pageData.elements.forms),
      navigation: this.analyzeNavigation(pageData.elements.links),
      dynamicContent: this.detectDynamicContent(pageData.bodyText),
      loadingPatterns: this.detectLoadingPatterns(pageData),
    };
  }

  /**
   * تحليل النماذج
   */
  private analyzeForms(forms: any[]): FormAnalysis[] {
    return forms.map(form => ({
      selector: form.id || form.class,
      fields: [],
      type: this.classifyFormType(form),
      validation: [],
    }));
  }

  /**
   * تحليل التنقل
   */
  private analyzeNavigation(links: any[]): NavigationAnalysis {
    return {
      type: 'standard',
      items: links.slice(0, 10).map((link: any) => ({
        text: link.text || '',
        selector: link.id || link.class,
      })),
      currentPage: '',
    };
  }

  /**
   * اكتشاف المحتوى الديناميكي
   */
  private detectDynamicContent(text: string): boolean {
    const patterns = ['loading', 'تحميل', 'جاري', 'لحظة'];
    return patterns.some(p => text.toLowerCase().includes(p));
  }

  /**
   * اكتشاف أنماط التحميل
   */
  private detectLoadingPatterns(data: any): string[] {
    return [];
  }

  /**
   * تصنيف نوع النموذج
   */
  private classifyFormType(form: any): any {
    const text = (form.text || '').toLowerCase();
    if (text.includes('login') || text.includes('دخول')) return 'login';
    if (text.includes('signup') || text.includes('تسجيل')) return 'signup';
    if (text.includes('search') || text.includes('بحث')) return 'search';
    return 'custom';
  }
}

/**
 * محرك البحث الذكي عن العناصر
 */
class IntelligentElementFinder {
  /**
   * بحث ذكي متقدم عن العنصر
   */
  async findElement(
    query: {
      type?: string;
      text?: string;
      placeholder?: string;
      ariaLabel?: string;
      role?: string;
      dataAttribute?: Record<string, string>;
    },
    page: any,
    pageContext: PageAnalysis
  ): Promise<ElementAnalysis | null> {
    const selectors = this.generateSelectorsFromQuery(query, pageContext);

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        const box = await element.boundingBox();

        if (box && box.width > 0 && box.height > 0) {
          return await this.analyzeElement(element, selector);
        }
      } catch {}
    }

    return null;
  }

  /**
   * توليد محددات ذكية من الاستعلام
   */
  private generateSelectorsFromQuery(
    query: any,
    context: PageAnalysis
  ): string[] {
    const selectors: string[] = [];

    // من ARIA
    if (query.ariaLabel) {
      selectors.push(`[aria-label="${query.ariaLabel}"]`);
      selectors.push(`[aria-label*="${query.ariaLabel}"]`);
    }

    // من النوع
    if (query.type) {
      selectors.push(`${query.type}`);
      selectors.push(`[type="${query.type}"]`);
    }

    // من النص
    if (query.text) {
      selectors.push(`text="${query.text}"`);
      selectors.push(`text*="${query.text}"`);
      selectors.push(`button:has-text("${query.text}")`);
    }

    // من الـ Placeholder
    if (query.placeholder) {
      selectors.push(`[placeholder="${query.placeholder}"]`);
      selectors.push(`[placeholder*="${query.placeholder}"]`);
    }

    // من البيانات
    if (query.dataAttribute) {
      for (const [key, value] of Object.entries(query.dataAttribute)) {
        selectors.push(`[data-${key}="${value}"]`);
      }
    }

    return selectors;
  }

  /**
   * تحليل العنصر بتفصيل
   */
  private async analyzeElement(element: any, selector: string): Promise<ElementAnalysis> {
    const box = await element.boundingBox();
    const attrs = await element.getAttribute('data-*');

    return {
      selector,
      type: await element.evaluate(el => el.tagName.toLowerCase()),
      text: await element.textContent(),
      position: box || { x: 0, y: 0, width: 0, height: 0 },
      isInteractive: true,
      isVisible: true,
      confidence: 0.95,
      dataAttributes: attrs || {},
    };
  }
}

/**
 * محرك فهم النية الذكي
 */
class IntentUnderstandingEngine {
  /**
   * فهم نية المستخدم من السياق
   */
  understandIntent(task: string, context: PageAnalysis): string {
    const text = task.toLowerCase();

    // تسجيل الدخول
    if (
      text.includes('login') ||
      text.includes('دخول') ||
      text.includes('تسجيل')
    ) {
      return 'login';
    }

    // البحث
    if (
      text.includes('search') ||
      text.includes('بحث') ||
      text.includes('ابحث')
    ) {
      return 'search';
    }

    // الملء
    if (
      text.includes('fill') ||
      text.includes('ملء') ||
      text.includes('اكتب')
    ) {
      return 'fill_form';
    }

    // النقر
    if (
      text.includes('click') ||
      text.includes('نقر') ||
      text.includes('اضغط')
    ) {
      return 'click';
    }

    // الاستخراج
    if (
      text.includes('extract') ||
      text.includes('استخرج') ||
      text.includes('جمع')
    ) {
      return 'extract';
    }

    return 'unknown';
  }
}

/**
 * محرك التخطيط الذكي
 */
class SmartPlanningEngine {
  private elementFinder: IntelligentElementFinder;
  private intentEngine: IntentUnderstandingEngine;

  constructor() {
    this.elementFinder = new IntelligentElementFinder();
    this.intentEngine = new IntentUnderstandingEngine();
  }

  /**
   * التخطيط الذكي للتنفيذ
   */
  planExecution(
    intent: string,
    context: PageAnalysis,
    parameters: any = {}
  ): ExecutionPath[] {
    const paths: ExecutionPath[] = [];

    switch (intent) {
      case 'login':
        paths.push(this.planLoginFlow(context, parameters));
        break;

      case 'search':
        paths.push(this.planSearchFlow(context, parameters));
        break;

      case 'fill_form':
        paths.push(this.planFormFilling(context, parameters));
        break;

      case 'click':
        paths.push(this.planClick(context, parameters));
        break;

      case 'extract':
        paths.push(this.planExtraction(context, parameters));
        break;
    }

    return paths.sort((a, b) => b.successProbability - a.successProbability);
  }

  /**
   * التخطيط لتدفق تسجيل الدخول
   */
  private planLoginFlow(context: PageAnalysis, params: any): ExecutionPath {
    const steps: ExecutionStep[] = [];

    // البحث عن حقل البريد الإلكتروني
    steps.push({
      id: 'find_email',
      action: 'find_element',
      target: 'email_input',
      parameters: {
        type: 'email',
        ariaLabel: 'email',
      },
      timeout: 5000,
    });

    // إدخال البريد الإلكتروني
    steps.push({
      id: 'fill_email',
      action: 'fill',
      target: 'email_input',
      parameters: { value: params.email },
      timeout: 2000,
    });

    // البحث عن حقل كلمة المرور
    steps.push({
      id: 'find_password',
      action: 'find_element',
      target: 'password_input',
      parameters: {
        type: 'password',
        ariaLabel: 'password',
      },
      timeout: 5000,
    });

    // إدخال كلمة المرور
    steps.push({
      id: 'fill_password',
      action: 'fill',
      target: 'password_input',
      parameters: { value: params.password },
      timeout: 2000,
    });

    // النقر على زر الدخول
    steps.push({
      id: 'click_submit',
      action: 'click',
      target: 'submit_button',
      parameters: { text: 'login' },
      timeout: 5000,
    });

    return {
      steps,
      successProbability: 0.85,
      estimatedTime: 15000,
      reasoning: [
        'تم اكتشاف نموذج تسجيل دخول',
        'الترتيب: البريد → كلمة المرور → الدخول',
      ],
    };
  }

  /**
   * التخطيط لتدفق البحث
   */
  private planSearchFlow(context: PageAnalysis, params: any): ExecutionPath {
    const steps: ExecutionStep[] = [];

    steps.push({
      id: 'find_search_box',
      action: 'find_element',
      target: 'search_input',
      parameters: {
        type: 'search',
        placeholder: 'search',
      },
      timeout: 5000,
    });

    steps.push({
      id: 'fill_search',
      action: 'fill',
      target: 'search_input',
      parameters: { value: params.query },
      timeout: 2000,
    });

    steps.push({
      id: 'submit_search',
      action: 'click',
      target: 'search_button',
      parameters: { text: 'search' },
      timeout: 5000,
    });

    return {
      steps,
      successProbability: 0.9,
      estimatedTime: 10000,
      reasoning: ['تم اكتشاف حقل بحث'],
    };
  }

  /**
   * التخطيط لملء النموذج
   */
  private planFormFilling(context: PageAnalysis, params: any): ExecutionPath {
    const steps: ExecutionStep[] = [];

    if (context.forms.length > 0) {
      const form = context.forms[0];

      for (const field of form.fields) {
        steps.push({
          id: `fill_${field.name}`,
          action: 'fill',
          target: field.selector,
          parameters: { value: params[field.name] || '' },
          timeout: 2000,
        });
      }

      if (form.submitButton) {
        steps.push({
          id: 'submit_form',
          action: 'click',
          target: form.submitButton,
          timeout: 5000,
        });
      }
    }

    return {
      steps,
      successProbability: 0.8,
      estimatedTime: 10000,
      reasoning: [`تم اكتشاف ${context.forms.length} نموذج(ج)`],
    };
  }

  /**
   * التخطيط للنقر
   */
  private planClick(context: PageAnalysis, params: any): ExecutionPath {
    return {
      steps: [
        {
          id: 'click_element',
          action: 'click',
          target: params.selector,
          timeout: 5000,
        },
      ],
      successProbability: 0.9,
      estimatedTime: 2000,
      reasoning: ['نقر مباشر على العنصر'],
    };
  }

  /**
   * التخطيط للاستخراج
   */
  private planExtraction(context: PageAnalysis, params: any): ExecutionPath {
    return {
      steps: [
        {
          id: 'extract_data',
          action: 'extract',
          target: params.selector,
          parameters: { method: 'text' },
          timeout: 5000,
        },
      ],
      successProbability: 0.95,
      estimatedTime: 3000,
      reasoning: ['استخراج البيانات من العناصر'],
    };
  }
}

/**
 * محرك التنفيذ الذكي
 */
class SmartExecutionEngine {
  /**
   * تنفيذ ذكي للخطوات
   */
  async executeStep(
    step: ExecutionStep,
    page: any,
    context: any
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      switch (step.action) {
        case 'find_element':
          return await this.executeFind(step, page);

        case 'click':
          return await this.executeClick(step, page);

        case 'fill':
          return await this.executeFill(step, page);

        case 'extract':
          return await this.executeExtract(step, page);

        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async executeFind(step: ExecutionStep, page: any): Promise<any> {
    const element = await page.locator(step.target!).first();
    const box = await element.boundingBox();

    if (box && box.width > 0 && box.height > 0) {
      return { success: true, result: element };
    }

    return { success: false, error: 'Element not found' };
  }

  private async executeClick(step: ExecutionStep, page: any): Promise<any> {
    await page.locator(step.target!).click();
    return { success: true };
  }

  private async executeFill(step: ExecutionStep, page: any): Promise<any> {
    await page.locator(step.target!).fill(step.parameters!.value);
    return { success: true };
  }

  private async executeExtract(step: ExecutionStep, page: any): Promise<any> {
    const data = await page.locator(step.target!).allTextContents();
    return { success: true, result: data };
  }
}

/**
 * النظام المتكامل الشامل
 */
export class AdvancedRobotBrainLogic {
  private pageEngine: PageUnderstandingEngine;
  private elementFinder: IntelligentElementFinder;
  private intentEngine: IntentUnderstandingEngine;
  private planningEngine: SmartPlanningEngine;
  private executionEngine: SmartExecutionEngine;

  constructor() {
    this.pageEngine = new PageUnderstandingEngine();
    this.elementFinder = new IntelligentElementFinder();
    this.intentEngine = new IntentUnderstandingEngine();
    this.planningEngine = new SmartPlanningEngine();
    this.executionEngine = new SmartExecutionEngine();
  }

  /**
   * فهم شامل وتنفيذ ذكي
   */
  async understand(
    task: string,
    page: any
  ): Promise<RobotUnderstanding> {
    const startTime = Date.now();

    // 1. فهم السياق
    const pageContext = await this.pageEngine.analyzePage(page);

    // 2. فهم النية
    const userIntent = this.intentEngine.understandIntent(task, pageContext);

    // 3. البحث عن العناصر ذات الصلة
    const elementContext: ElementAnalysis[] = [];

    // 4. التخطيط الذكي
    const executionPaths = this.planningEngine.planExecution(
      userIntent,
      pageContext
    );

    const executionPath = executionPaths[0] || {
      steps: [],
      successProbability: 0,
      estimatedTime: 0,
      reasoning: [],
    };

    return {
      pageContext,
      userIntent,
      elementContext,
      executionPath: executionPath.steps,
      confidence: executionPath.successProbability,
      alternatives: executionPaths,
    };
  }

  /**
   * البحث والفهم والتنفيذ
   */
  async findAndUnderstand(
    query: {
      type?: string;
      text?: string;
      placeholder?: string;
      ariaLabel?: string;
    },
    page: any
  ): Promise<ElementAnalysis | null> {
    const pageContext = await this.pageEngine.analyzePage(page);
    return await this.elementFinder.findElement(query, page, pageContext);
  }
}

export function createAdvancedRobotBrain(): AdvancedRobotBrainLogic {
  return new AdvancedRobotBrainLogic();
}
