/**
 * محرك الوعي بالسياق
 * Context Awareness Engine
 * 
 * تتبع وصيانة السياق الجلسة
 */

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  userId?: string;
  website: string;
  currentUrl: string;
  variables: Map<string, any>;
  history: ContextSnapshot[];
  metadata: Record<string, any>;
}

export interface ContextSnapshot {
  timestamp: Date;
  url: string;
  pageTitle: string;
  elementCount: number;
  visibleElements: number;
  formState?: Record<string, any>;
  userInputs: Record<string, any>;
  cookies?: Record<string, string>;
  localStorage?: Record<string, any>;
  sessionStorage?: Record<string, any>;
}

export interface ContextVariable {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  sourceAction?: string;
  extractedAt: Date;
  lifetime?: number; // ms - how long to keep
}

export interface ContextInference {
  context: string;
  confidence: number;
  indicators: string[];
  suggestedActions: string[];
}

/**
 * محرك الوعي بالسياق
 */
export class ContextAwarenessEngine {
  private sessions: Map<string, SessionContext> = new Map();
  private currentSessionId: string | null = null;
  private contextInferences: Map<string, ContextInference> = new Map();
  private patternMatchers: Map<string, (context: SessionContext) => ContextInference | null> = new Map();

  constructor() {
    this.initializePatternMatchers();
  }

  /**
   * إنشاء جلسة جديدة
   */
  createSession(website: string, currentUrl: string, userId?: string): string {
    const sessionId = `session_${Date.now()}_${Math.random()}`;

    const session: SessionContext = {
      sessionId,
      startTime: new Date(),
      website,
      currentUrl,
      userId,
      variables: new Map(),
      history: [],
      metadata: {},
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    console.log(`📝 Session created: ${sessionId} on ${website}`);
    return sessionId;
  }

  /**
   * إنهاء الجلسة
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`🔚 Session ended: ${sessionId}`);
      console.log(`   Duration: ${Date.now() - session.startTime.getTime()}ms`);
    }
  }

  /**
   * تحديث السياق
   */
  async updateContext(
    page: any,
    sessionId?: string
  ): Promise<ContextSnapshot> {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      throw new Error('No active session');
    }

    const session = this.sessions.get(sid);
    if (!session) {
      throw new Error(`Session not found: ${sid}`);
    }

    // Capture current page state
    const snapshot = await this.captureSnapshot(page);

    // Update session
    session.currentUrl = snapshot.url;
    session.history.push(snapshot);

    // Clean old snapshots (keep last 100)
    if (session.history.length > 100) {
      session.history = session.history.slice(-100);
    }

    // Infer context
    const inference = await this.inferContext(session);
    if (inference) {
      this.contextInferences.set(sid, inference);
      console.log(`💡 Context inferred: ${inference.context} (${(inference.confidence * 100).toFixed(0)}%)`);
    }

    return snapshot;
  }

  /**
   * حفظ متغير في السياق
   */
  setVariable(
    name: string,
    value: any,
    sessionId?: string,
    lifetime?: number
  ): void {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      throw new Error('No active session');
    }

    const session = this.sessions.get(sid);
    if (!session) {
      throw new Error(`Session not found: ${sid}`);
    }

    const variable: ContextVariable = {
      name,
      value,
      type: this.getValueType(value),
      extractedAt: new Date(),
      lifetime,
    };

    session.variables.set(name, variable);

    // Set timeout for variable cleanup if lifetime specified
    if (lifetime) {
      setTimeout(() => {
        session.variables.delete(name);
      }, lifetime);
    }
  }

  /**
   * الحصول على متغير من السياق
   */
  getVariable(name: string, sessionId?: string): any {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      return null;
    }

    const session = this.sessions.get(sid);
    if (!session) {
      return null;
    }

    const variable = session.variables.get(name);
    return variable?.value || null;
  }

  /**
   * الحصول على جميع المتغيرات
   */
  getAllVariables(sessionId?: string): Record<string, any> {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      return {};
    }

    const session = this.sessions.get(sid);
    if (!session) {
      return {};
    }

    const result: Record<string, any> = {};
    session.variables.forEach((variable, name) => {
      result[name] = variable.value;
    });

    return result;
  }

  /**
   * الحصول على السياق المستنتج
   */
  getInferredContext(sessionId?: string): ContextInference | null {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      return null;
    }

    return this.contextInferences.get(sid) || null;
  }

  /**
   * الحصول على سجل الجلسة
   */
  getSessionHistory(sessionId?: string, limit?: number): ContextSnapshot[] {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      return [];
    }

    const session = this.sessions.get(sid);
    if (!session) {
      return [];
    }

    if (limit) {
      return session.history.slice(-limit);
    }

    return [...session.history];
  }

  /**
   * الحصول على معلومات الجلسة
   */
  getSessionInfo(sessionId?: string): SessionContext | null {
    const sid = sessionId || this.currentSessionId;
    if (!sid) {
      return null;
    }

    return this.sessions.get(sid) || null;
  }

  /**
   * مقارنة السياقات
   */
  compareContexts(snapshot1: ContextSnapshot, snapshot2: ContextSnapshot): {
    differences: string[];
    similarity: number;
  } {
    const differences: string[] = [];

    if (snapshot1.url !== snapshot2.url) {
      differences.push(`URL changed: ${snapshot1.url} → ${snapshot2.url}`);
    }

    if (snapshot1.pageTitle !== snapshot2.pageTitle) {
      differences.push(`Title changed: ${snapshot1.pageTitle} → ${snapshot2.pageTitle}`);
    }

    if (snapshot1.elementCount !== snapshot2.elementCount) {
      differences.push(`Elements changed: ${snapshot1.elementCount} → ${snapshot2.elementCount}`);
    }

    if (snapshot1.visibleElements !== snapshot2.visibleElements) {
      differences.push(`Visible elements changed: ${snapshot1.visibleElements} → ${snapshot2.visibleElements}`);
    }

    // Calculate similarity (0-1)
    const similarity = Math.max(0, 1 - differences.length * 0.2);

    return { differences, similarity };
  }

  // =================== Private Methods ===================

  private async captureSnapshot(page: any): Promise<ContextSnapshot> {
    try {
      const snapshot = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        const userInputs: Record<string, any> = {};

        inputs.forEach((input: any) => {
          if (input.id) {
            userInputs[input.id] = input.value || input.textContent;
          } else if (input.name) {
            userInputs[input.name] = input.value || input.textContent;
          }
        });

        return {
          url: window.location.href,
          pageTitle: document.title,
          elementCount: document.querySelectorAll('*').length,
          visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el as Element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }).length,
          userInputs,
          cookies: Object.fromEntries(
            document.cookie.split('; ').map(c => c.split('='))
          ),
          localStorage: { ...window.localStorage },
          sessionStorage: { ...window.sessionStorage },
        };
      });

      return {
        timestamp: new Date(),
        ...snapshot,
      };
    } catch (error: any) {
      console.debug(`Failed to capture snapshot: ${error.message}`);
      return {
        timestamp: new Date(),
        url: await page.url(),
        pageTitle: '',
        elementCount: 0,
        visibleElements: 0,
        userInputs: {},
      };
    }
  }

  private async inferContext(session: SessionContext): Promise<ContextInference | null> {
    if (session.history.length === 0) {
      return null;
    }

    // Apply pattern matchers
    for (const [name, matcher] of this.patternMatchers) {
      const inference = matcher(session);
      if (inference) {
        return inference;
      }
    }

    return null;
  }

  private initializePatternMatchers(): void {
    // Pattern: Login form
    this.patternMatchers.set('login_form', (session: SessionContext) => {
      const lastSnapshot = session.history[session.history.length - 1];
      if (lastSnapshot?.userInputs) {
        const hasPassword = Object.keys(lastSnapshot.userInputs).some(k =>
          k.toLowerCase().includes('password')
        );
        const hasEmail = Object.keys(lastSnapshot.userInputs).some(k =>
          k.toLowerCase().includes('email') || k.toLowerCase().includes('username')
        );

        if (hasPassword && hasEmail) {
          return {
            context: 'login_form',
            confidence: 0.9,
            indicators: ['password field', 'email/username field'],
            suggestedActions: ['fill_login_form', 'validate_credentials'],
          };
        }
      }
      return null;
    });

    // Pattern: Checkout flow
    this.patternMatchers.set('checkout_flow', (session: SessionContext) => {
      const url = session.currentUrl.toLowerCase();
      if (url.includes('checkout') || url.includes('cart') || url.includes('payment')) {
        return {
          context: 'checkout_flow',
          confidence: 0.95,
          indicators: ['checkout URL pattern'],
          suggestedActions: ['fill_shipping', 'fill_payment', 'confirm_order'],
        };
      }
      return null;
    });

    // Pattern: Search results
    this.patternMatchers.set('search_results', (session: SessionContext) => {
      const url = session.currentUrl.toLowerCase();
      if (url.includes('search') || url.includes('results') || url.includes('query')) {
        return {
          context: 'search_results',
          confidence: 0.85,
          indicators: ['search URL pattern'],
          suggestedActions: ['extract_results', 'navigate_pagination'],
        };
      }
      return null;
    });

    // Pattern: Form submission
    this.patternMatchers.set('form_submission', (session: SessionContext) => {
      if (session.history.length >= 2) {
        const prev = session.history[session.history.length - 2];
        const curr = session.history[session.history.length - 1];

        const inputsChanged = Object.keys(prev.userInputs || {}).length !==
                              Object.keys(curr.userInputs || {}).length;

        if (inputsChanged && prev.url === curr.url) {
          return {
            context: 'form_submission',
            confidence: 0.8,
            indicators: ['form inputs changed'],
            suggestedActions: ['submit_form', 'validate_submission'],
          };
        }
      }
      return null;
    });
  }

  private getValueType(value: any): ContextVariable['type'] {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    return 'object';
  }
}

export function getContextAwarenessEngine(): ContextAwarenessEngine {
  return new ContextAwarenessEngine();
}
