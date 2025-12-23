/**
 * محرك ذكاء الأكواد - متخصص في تحليل وإصلاح أخطاء الأكواد
 * Code Intelligence Engine - Specialized in code analysis and error fixing
 */

export interface CodeError {
  type: 'syntax' | 'runtime' | 'logical' | 'performance' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  column?: number;
  message: string;
  code?: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface CodeAnalysisResult {
  valid: boolean;
  errors: CodeError[];
  warnings: CodeError[];
  suggestions: string[];
  quality: {
    score: number; // 0-100
    readability: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  fixes: CodeFix[];
}

export interface CodeFix {
  id: string;
  description: string;
  type: 'auto' | 'manual';
  confidence: number;
  originalCode: string;
  fixedCode: string;
  line?: number;
  applied: boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'syntax' | 'best-practice' | 'security' | 'performance';
  check: (code: string) => CodeError[];
  autoFix?: (code: string) => string;
}

/**
 * محرك ذكاء الأكواد
 */
export class CodeIntelligence {
  private validationRules: ValidationRule[] = [];
  private errorPatterns: Map<string, { pattern: RegExp; fix: string }> = new Map();
  private fixHistory: Map<string, CodeFix[]> = new Map();
  private learningData: Map<string, any> = new Map();

  constructor() {
    this.initializeValidationRules();
    this.initializeErrorPatterns();
  }

  /**
   * تحليل الكود بشكل شامل
   */
  async analyzeCode(code: string, language: 'javascript' | 'typescript' = 'javascript'): Promise<CodeAnalysisResult> {
    console.log(`🔍 تحليل الكود (${language})...`);

    const errors: CodeError[] = [];
    const warnings: CodeError[] = [];
    const suggestions: string[] = [];
    const fixes: CodeFix[] = [];

    try {
      // 1. فحص الأخطاء النحوية (Syntax Errors)
      const syntaxErrors = await this.detectSyntaxErrors(code, language);
      errors.push(...syntaxErrors);

      // 2. فحص أخطاء وقت التشغيل المحتملة
      const runtimeErrors = await this.detectRuntimeErrors(code);
      warnings.push(...runtimeErrors);

      // 3. فحص الأخطاء المنطقية
      const logicalErrors = await this.detectLogicalErrors(code);
      warnings.push(...logicalErrors);

      // 4. فحص أمان الكود
      const securityIssues = await this.detectSecurityIssues(code);
      errors.push(...securityIssues.filter(e => e.severity === 'critical' || e.severity === 'high'));
      warnings.push(...securityIssues.filter(e => e.severity === 'medium' || e.severity === 'low'));

      // 5. فحص الأداء
      const performanceIssues = await this.detectPerformanceIssues(code);
      suggestions.push(...performanceIssues);

      // 6. توليد إصلاحات تلقائية
      for (const error of errors) {
        if (error.autoFixable) {
          const fix = await this.generateAutoFix(error, code);
          if (fix) {
            fixes.push(fix);
          }
        }
      }

      // 7. حساب جودة الكود
      const quality = this.calculateCodeQuality(code, errors, warnings);

      const result: CodeAnalysisResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        quality,
        fixes,
      };

      console.log(`✅ تم التحليل: ${errors.length} أخطاء، ${warnings.length} تحذيرات، ${fixes.length} إصلاحات متاحة`);

      return result;
    } catch (error: any) {
      console.error(`❌ خطأ في تحليل الكود:`, error.message);
      
      return {
        valid: false,
        errors: [{
          type: 'syntax',
          severity: 'critical',
          message: `فشل تحليل الكود: ${error.message}`,
          autoFixable: false,
        }],
        warnings: [],
        suggestions: [],
        quality: {
          score: 0,
          readability: 0,
          maintainability: 0,
          performance: 0,
          security: 0,
        },
        fixes: [],
      };
    }
  }

  /**
   * إصلاح الكود تلقائياً
   */
  async autoFixCode(code: string, analysis?: CodeAnalysisResult): Promise<{
    success: boolean;
    fixedCode: string;
    appliedFixes: CodeFix[];
    remainingErrors: CodeError[];
  }> {
    console.log('🔧 بدء الإصلاح التلقائي للكود...');

    let fixedCode = code;
    const appliedFixes: CodeFix[] = [];
    
    // الحصول على التحليل إذا لم يتم توفيره
    if (!analysis) {
      analysis = await this.analyzeCode(code);
    }

    // تطبيق الإصلاحات بالترتيب (من الأكثر أهمية للأقل)
    const sortedFixes = [...analysis.fixes].sort((a, b) => b.confidence - a.confidence);

    for (const fix of sortedFixes) {
      if (fix.confidence > 0.7) { // تطبيق الإصلاحات ذات الثقة العالية فقط
        try {
          fixedCode = this.applyFix(fixedCode, fix);
          appliedFixes.push({ ...fix, applied: true });
          console.log(`✓ تم تطبيق الإصلاح: ${fix.description}`);
        } catch (error: any) {
          console.warn(`⚠ فشل تطبيق الإصلاح: ${fix.description} - ${error.message}`);
        }
      }
    }

    // إعادة تحليل الكود المُصلح
    const newAnalysis = await this.analyzeCode(fixedCode);

    // حفظ التعلم
    this.recordFix(code, fixedCode, appliedFixes);

    console.log(`✅ تم تطبيق ${appliedFixes.length} إصلاح، متبقي ${newAnalysis.errors.length} أخطاء`);

    return {
      success: newAnalysis.errors.length < analysis.errors.length,
      fixedCode,
      appliedFixes,
      remainingErrors: newAnalysis.errors,
    };
  }

  /**
   * التحقق من صحة الكود
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const analysis = await this.analyzeCode(code);
    
    return {
      valid: analysis.valid,
      errors: analysis.errors.map(e => `[${e.type}] ${e.message}`),
      warnings: analysis.warnings.map(w => `[${w.type}] ${w.message}`),
    };
  }

  /**
   * تحسين جودة الكود
   */
  async improveCode(code: string): Promise<{
    improvedCode: string;
    improvements: string[];
    qualityBefore: number;
    qualityAfter: number;
  }> {
    console.log('✨ تحسين جودة الكود...');

    const beforeAnalysis = await this.analyzeCode(code);
    let improvedCode = code;
    const improvements: string[] = [];

    // 1. إصلاح الأخطاء أولاً
    const fixResult = await this.autoFixCode(code, beforeAnalysis);
    if (fixResult.success) {
      improvedCode = fixResult.fixedCode;
      improvements.push(...fixResult.appliedFixes.map(f => f.description));
    }

    // 2. تطبيق تحسينات الأداء
    const performanceImproved = this.applyPerformanceOptimizations(improvedCode);
    if (performanceImproved !== improvedCode) {
      improvedCode = performanceImproved;
      improvements.push('تحسين الأداء');
    }

    // 3. تحسين القابلية للقراءة
    const readabilityImproved = this.improveReadability(improvedCode);
    if (readabilityImproved !== improvedCode) {
      improvedCode = readabilityImproved;
      improvements.push('تحسين القابلية للقراءة');
    }

    // 4. إضافة best practices
    const bestPracticesApplied = this.applyBestPractices(improvedCode);
    if (bestPracticesApplied !== improvedCode) {
      improvedCode = bestPracticesApplied;
      improvements.push('تطبيق أفضل الممارسات');
    }

    const afterAnalysis = await this.analyzeCode(improvedCode);

    console.log(`✅ تم تحسين الكود: الجودة من ${beforeAnalysis.quality.score} إلى ${afterAnalysis.quality.score}`);

    return {
      improvedCode,
      improvements,
      qualityBefore: beforeAnalysis.quality.score,
      qualityAfter: afterAnalysis.quality.score,
    };
  }

  /**
   * اكتشاف أنماط الأخطاء الشائعة والتعلم منها
   */
  async learnFromError(error: CodeError, context: string): Promise<void> {
    const pattern = this.extractErrorPattern(error, context);
    
    if (pattern) {
      const existing = this.learningData.get(pattern) || { count: 0, fixes: [] };
      existing.count++;
      this.learningData.set(pattern, existing);
      
      console.log(`📚 تم تعلم نمط خطأ جديد: ${pattern} (تكرر ${existing.count} مرات)`);
    }
  }

  /**
   * الحصول على إحصائيات التعلم
   */
  getLearningStats(): {
    totalPatterns: number;
    totalFixes: number;
    successRate: number;
    topErrors: Array<{ pattern: string; count: number }>;
  } {
    const totalPatterns = this.learningData.size;
    let totalFixes = 0;
    let successfulFixes = 0;

    this.fixHistory.forEach(fixes => {
      totalFixes += fixes.length;
      successfulFixes += fixes.filter(f => f.applied).length;
    });

    const topErrors = Array.from(this.learningData.entries())
      .map(([pattern, data]) => ({ pattern, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalPatterns,
      totalFixes,
      successRate: totalFixes > 0 ? successfulFixes / totalFixes : 0,
      topErrors,
    };
  }

  // ====== الوظائف الخاصة ======

  private initializeValidationRules(): void {
    // قواعد التحقق من الأخطاء النحوية
    this.validationRules.push({
      id: 'missing-semicolon',
      name: 'فحص الفاصلة المنقوطة',
      type: 'syntax',
      check: (code: string) => {
        const errors: CodeError[] = [];
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed && 
              !trimmed.endsWith(';') && 
              !trimmed.endsWith('{') && 
              !trimmed.endsWith('}') &&
              !trimmed.startsWith('//') &&
              !trimmed.startsWith('/*') &&
              !trimmed.startsWith('*') &&
              !trimmed.startsWith('import') &&
              !trimmed.startsWith('export')) {
            
            // تحقق من أنواع الجمل التي تحتاج فاصلة منقوطة
            if (trimmed.includes('=') || 
                trimmed.includes('const ') || 
                trimmed.includes('let ') || 
                trimmed.includes('var ') ||
                trimmed.includes('return ')) {
              errors.push({
                type: 'syntax',
                severity: 'medium',
                line: index + 1,
                message: `قد تكون الفاصلة المنقوطة مفقودة في السطر ${index + 1}`,
                code: trimmed,
                autoFixable: true,
              });
            }
          }
        });
        
        return errors;
      },
      autoFix: (code: string) => {
        // إضافة الفاصلة المنقوطة حيث تكون مفقودة
        const lines = code.split('\n');
        const fixed = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed && 
              !trimmed.endsWith(';') && 
              !trimmed.endsWith('{') && 
              !trimmed.endsWith('}') &&
              (trimmed.includes('=') || trimmed.includes('return '))) {
            return line + ';';
          }
          return line;
        });
        return fixed.join('\n');
      },
    });

    // قاعدة فحص الأقواس المتوازنة
    this.validationRules.push({
      id: 'unbalanced-brackets',
      name: 'فحص توازن الأقواس',
      type: 'syntax',
      check: (code: string) => {
        const errors: CodeError[] = [];
        const stack: Array<{ char: string; pos: number }> = [];
        const pairs: { [key: string]: string } = { '(': ')', '[': ']', '{': '}' };
        
        for (let i = 0; i < code.length; i++) {
          const char = code[i];
          
          if (char in pairs) {
            stack.push({ char, pos: i });
          } else if (Object.values(pairs).includes(char)) {
            if (stack.length === 0) {
              errors.push({
                type: 'syntax',
                severity: 'critical',
                message: `قوس إغلاق زائد '${char}' في الموضع ${i}`,
                autoFixable: false,
              });
            } else {
              const last = stack.pop()!;
              if (pairs[last.char] !== char) {
                errors.push({
                  type: 'syntax',
                  severity: 'critical',
                  message: `أقواس غير متطابقة: '${last.char}' مفتوح لكن '${char}' مغلق`,
                  autoFixable: false,
                });
              }
            }
          }
        }
        
        if (stack.length > 0) {
          errors.push({
            type: 'syntax',
            severity: 'critical',
            message: `${stack.length} قوس مفتوح غير مغلق`,
            autoFixable: false,
          });
        }
        
        return errors;
      },
    });

    // قاعدة فحص template strings
    this.validationRules.push({
      id: 'template-string-syntax',
      name: 'فحص template strings',
      type: 'syntax',
      check: (code: string) => {
        const errors: CodeError[] = [];
        
        // البحث عن ${ بدون backticks
        const regex = /['"].*\$\{.*\}.*['"]/g;
        let match;
        
        while ((match = regex.exec(code)) !== null) {
          errors.push({
            type: 'syntax',
            severity: 'high',
            message: 'استخدام ${} داخل علامات تنصيص عادية - يجب استخدام backticks ``',
            code: match[0],
            suggestion: match[0].replace(/['"]/g, '`'),
            autoFixable: true,
          });
        }
        
        return errors;
      },
      autoFix: (code: string) => {
        // تحويل template strings من '' أو "" إلى ``
        return code.replace(/(['"])([^'"]*\$\{[^}]+\}[^'"]*)\1/g, '`$2`');
      },
    });
  }

  private initializeErrorPatterns(): void {
    // أنماط الأخطاء الشائعة وإصلاحاتها
    this.errorPatterns.set('undefined_variable', {
      pattern: /(\w+) is not defined/,
      fix: 'تأكد من تعريف المتغير أو استيراده',
    });

    this.errorPatterns.set('unexpected_token', {
      pattern: /Unexpected token (.*)/,
      fix: 'تحقق من الصيغة النحوية حول هذا الرمز',
    });

    this.errorPatterns.set('missing_closing_bracket', {
      pattern: /Expected '(.*)' to match '(.*)'/,
      fix: 'أضف قوس الإغلاق المفقود',
    });
  }

  /**
   * اكتشاف أخطاء نحوية متقدمة
   */
  private async detectSyntaxErrors(code: string, language: string): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    try {
      // 1. فحص الأقواس المتطابقة
      const bracketErrors = this.checkMatchingBrackets(code);
      errors.push(...bracketErrors);
      
      // 2. فحص الفواصل المنقوطة المفقودة
      const semicolonErrors = this.checkSemicolons(code);
      errors.push(...semicolonErrors);
      
      // 3. فحص الكلمات المحجوزة
      const keywordErrors = this.checkReservedKeywords(code);
      errors.push(...keywordErrors);
      
      // 4. فحص التعليقات غير المغلقة
      const commentErrors = this.checkUnclosedComments(code);
      errors.push(...commentErrors);
      
      // 5. فحص الأقواس في الدوال
      const functionErrors = this.checkFunctionSyntax(code);
      errors.push(...functionErrors);
      
    } catch (error: any) {
      errors.push({
        type: 'syntax',
        severity: 'critical',
        message: `خطأ نحوي عام: ${error.message}`,
        autoFixable: false,
      });
    }
    
    return errors;
  }
  
  /**
   * اكتشاف أخطاء وقت التشغيل المحتملة
   */
  private async detectRuntimeErrors(code: string): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    // 1. فحص المتغيرات غير المعرفة
    const undefinedVars = this.checkUndefinedVariables(code);
    errors.push(...undefinedVars);
    
    // 2. فحص null/undefined access
    const nullErrors = this.checkNullAccess(code);
    errors.push(...nullErrors);
    
    // 3. فحص القسمة على صفر
    const divisionErrors = this.checkDivisionByZero(code);
    errors.push(...divisionErrors);
    
    // 4. فحص حلقات لا نهائية محتملة
    const infiniteLoops = this.checkInfiniteLoops(code);
    errors.push(...infiniteLoops);
    
    return errors;
  }
  
  /**
   * اكتشاف أخطاء منطقية
   */
  private async detectLogicalErrors(code: string): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    // 1. فحص الشروط الدائمة الصواب/الخطأ
    const constantConditions = this.checkConstantConditions(code);
    errors.push(...constantConditions);
    
    // 2. فحص الكود الذي لن يُنفذ أبداً
    const unreachableCode = this.checkUnreachableCode(code);
    errors.push(...unreachableCode);
    
    // 3. فحص المتغيرات غير المستخدمة
    const unusedVars = this.checkUnusedVariables(code);
    errors.push(...unusedVars);
    
    return errors;
  }
  
  /**
   * اكتشاف مشاكل الأمان
   */
  private async detectSecurityIssues(code: string): Promise<CodeError[]> {
    const errors: CodeError[] = [];
    
    // 1. فحص eval و Function constructor
    if (code.includes('eval(') || code.includes('new Function(')) {
      errors.push({
        type: 'security',
        severity: 'critical',
        message: 'استخدام eval أو Function constructor يشكل خطراً أمنياً',
        autoFixable: false,
      });
    }
    
    // 2. فحص تخزين كلمات المرور في النص الصريح
    const passwordPatterns = /password\s*=\s*['"`][^'"`]+['"`]/gi;
    if (passwordPatterns.test(code)) {
      errors.push({
        type: 'security',
        severity: 'high',
        message: 'تخزين كلمات المرور في النص الصريح غير آمن',
        autoFixable: false,
      });
    }
    
    // 3. فحص innerHTML بدون sanitization
    if (code.includes('.innerHTML =') && !code.includes('sanitize')) {
      errors.push({
        type: 'security',
        severity: 'medium',
        message: 'استخدام innerHTML قد يؤدي لثغرة XSS',
        autoFixable: false,
      });
    }
    
    return errors;
  }
  
  /**
   * اكتشاف مشاكل الأداء
   */
  private async detectPerformanceIssues(code: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    // 1. فحص الحلقات داخل حلقات
    const nestedLoops = (code.match(/for\s*\([^)]*\)\s*{[^}]*for\s*\(/g) || []).length;
    if (nestedLoops > 0) {
      suggestions.push(`وجود ${nestedLoops} حلقة متداخلة - قد يؤثر على الأداء`);
    }
    
    // 2. فحص عمليات DOM المتكررة
    if (code.includes('getElementById') && code.includes('for')) {
      suggestions.push('عمليات DOM داخل حلقات - يُنصح بتخزين النتائج');
    }
    
    // 3. فحص استخدام console.log كثيراً
    const consoleLogs = (code.match(/console\.log/g) || []).length;
    if (consoleLogs > 5) {
      suggestions.push(`${consoleLogs} استدعاء لـ console.log - قد يبطئ التطبيق`);
    }
    
    return suggestions;
  }
  
  /**
   * فحص الأقواس المتطابقة
   */
  private checkMatchingBrackets(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const stack: Array<{ char: string; line: number; col: number }> = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        
        if ('([{'.includes(char)) {
          stack.push({ char, line: lineIndex + 1, col: col + 1 });
        } else if (')]}'.includes(char)) {
          if (stack.length === 0) {
            errors.push({
              type: 'syntax',
              severity: 'critical',
              line: lineIndex + 1,
              column: col + 1,
              message: `قوس إغلاق '${char}' بدون قوس فتح مطابق`,
              autoFixable: false,
            });
          } else {
            const last = stack.pop()!;
            if (pairs[last.char] !== char) {
              errors.push({
                type: 'syntax',
                severity: 'critical',
                line: lineIndex + 1,
                column: col + 1,
                message: `قوس إغلاق غير متطابق: متوقع '${pairs[last.char]}' لكن وجد '${char}'`,
                autoFixable: false,
              });
            }
          }
        }
      }
    });
    
    // أقواس فتح غير مغلقة
    stack.forEach(bracket => {
      errors.push({
        type: 'syntax',
        severity: 'critical',
        line: bracket.line,
        column: bracket.col,
        message: `قوس فتح '${bracket.char}' غير مغلق`,
        autoFixable: false,
      });
    });
    
    return errors;
  }
  
  /**
   * فحص الفواصل المنقوطة
   */
  private checkSemicolons(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // تخطي الأسطر الفارغة والتعليقات
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
      
      // فحص الجمل التي تحتاج فاصلة منقوطة
      const needsSemicolon = (
        (trimmed.includes('=') && !trimmed.includes('=>')) ||
        trimmed.startsWith('const ') ||
        trimmed.startsWith('let ') ||
        trimmed.startsWith('var ') ||
        trimmed.startsWith('return ')
      );
      
      if (needsSemicolon && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith(',')) {
        errors.push({
          type: 'syntax',
          severity: 'low',
          line: index + 1,
          message: `قد تكون الفاصلة المنقوطة مفقودة`,
          autoFixable: true,
          suggestion: 'إضافة فاصلة منقوطة في نهاية السطر',
        });
      }
    });
    
    return errors;
  }
  
  /**
   * فحص الكلمات المحجوزة
   */
  private checkReservedKeywords(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const reserved = ['abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'];
    
    const varDeclarationPattern = /(?:const|let|var)\s+(\w+)/g;
    let match;
    
    while ((match = varDeclarationPattern.exec(code)) !== null) {
      const varName = match[1];
      if (reserved.includes(varName)) {
        errors.push({
          type: 'syntax',
          severity: 'critical',
          message: `'${varName}' هي كلمة محجوزة ولا يمكن استخدامها كاسم متغير`,
          autoFixable: false,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * فحص التعليقات غير المغلقة
   */
  private checkUnclosedComments(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const multilineCommentStart = /\/\*/g;
    const multilineCommentEnd = /\*\//g;
    
    const starts = (code.match(multilineCommentStart) || []).length;
    const ends = (code.match(multilineCommentEnd) || []).length;
    
    if (starts > ends) {
      errors.push({
        type: 'syntax',
        severity: 'critical',
        message: `${starts - ends} تعليق متعدد الأسطر غير مغلق`,
        autoFixable: false,
      });
    }
    
    return errors;
  }
  
  /**
   * فحص بنية الدوال
   */
  private checkFunctionSyntax(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // فحص الدوال بدون return في دوال غير async
    const functionPattern = /function\s+\w+\s*\([^)]*\)\s*{([^}]*)}/g;
    let match;
    
    while ((match = functionPattern.exec(code)) !== null) {
      const functionBody = match[1];
      if (functionBody && !functionBody.includes('return') && !functionBody.includes('void')) {
        // تحذير فقط، قد تكون الدالة لا تحتاج return
      }
    }
    
    return errors;
  }
  
  /**
   * فحص المتغيرات غير المعرفة
   */
  private checkUndefinedVariables(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // استخراج جميع المتغيرات المعرفة
    const declaredVars = new Set<string>();
    const varPattern = /(?:const|let|var)\s+(\w+)/g;
    let match;
    
    while ((match = varPattern.exec(code)) !== null) {
      declaredVars.add(match[1]);
    }
    
    // فحص استخدام متغيرات غير معرفة (تبسيط)
    // في بيئة حقيقية، نحتاج parser أكثر تعقيداً
    
    return errors;
  }
  
  /**
   * فحص الوصول إلى null/undefined
   */
  private checkNullAccess(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // فحص optional chaining غير المستخدم
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('.') && !line.includes('?.') && !line.includes('null') && !line.includes('undefined')) {
        // تحذير بسيط
      }
    });
    
    return errors;
  }
  
  /**
   * فحص القسمة على صفر
   */
  private checkDivisionByZero(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    if (code.includes('/ 0') || code.includes('/0')) {
      errors.push({
        type: 'runtime',
        severity: 'high',
        message: 'قسمة محتملة على صفر',
        autoFixable: false,
      });
    }
    
    return errors;
  }
  
  /**
   * فحص الحلقات اللانهائية المحتملة
   */
  private checkInfiniteLoops(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // فحص while(true) بدون break
    const whileTruePattern = /while\s*\(\s*true\s*\)\s*{([^}]*)}/g;
    let match;
    
    while ((match = whileTruePattern.exec(code)) !== null) {
      const loopBody = match[1];
      if (!loopBody.includes('break')) {
        errors.push({
          type: 'runtime',
          severity: 'high',
          message: 'حلقة while(true) بدون break - قد تسبب حلقة لا نهائية',
          autoFixable: false,
        });
      }
    }
    
    return errors;
  }
  
  /**
   * فحص الشروط الدائمة
   */
  private checkConstantConditions(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // فحص if(true) أو if(false)
    if (code.includes('if (true)') || code.includes('if(true)')) {
      errors.push({
        type: 'logical',
        severity: 'medium',
        message: 'شرط دائم الصواب - قد يكون خطأ منطقي',
        autoFixable: false,
      });
    }
    
    if (code.includes('if (false)') || code.includes('if(false)')) {
      errors.push({
        type: 'logical',
        severity: 'medium',
        message: 'شرط دائم الخطأ - الكود لن يُنفذ أبداً',
        autoFixable: true,
      });
    }
    
    return errors;
  }
  
  /**
   * فحص الكود الذي لن يُنفذ
   */
  private checkUnreachableCode(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('return ') && index < lines.length - 1) {
        const nextLine = lines[index + 1].trim();
        if (nextLine && !nextLine.startsWith('}')) {
          errors.push({
            type: 'logical',
            severity: 'low',
            line: index + 2,
            message: 'كود لن يُنفذ أبداً بعد return',
            autoFixable: true,
          });
        }
      }
    });
    
    return errors;
  }
  
  /**
   * فحص المتغيرات غير المستخدمة
   */
  private checkUnusedVariables(code: string): CodeError[] {
    const errors: CodeError[] = [];
    
    // استخراج المتغيرات المعرفة
    const varPattern = /(?:const|let|var)\s+(\w+)/g;
    const declaredVars = new Map<string, number>();
    let match;
    let lineNum = 0;
    
    code.split('\n').forEach((line, index) => {
      const matches = line.matchAll(varPattern);
      for (const m of matches) {
        declaredVars.set(m[1], index + 1);
      }
    });
    
    // فحص الاستخدام (تبسيط)
    declaredVars.forEach((line, varName) => {
      const usage = code.split(varName).length - 1; // معرف مرة واحدة فقط
      if (usage <= 1) {
        errors.push({
          type: 'logical',
          severity: 'low',
          line,
          message: `المتغير '${varName}' معرف لكن غير مستخدم`,
          autoFixable: true,
        });
      }
    });
    
    return errors;
  }

  private async generateAutoFix(error: CodeError, code: string): Promise<CodeFix | null> {
    // البحث عن قاعدة التحقق المناسبة
    for (const rule of this.validationRules) {
      if (rule.type === error.type && rule.autoFix) {
        try {
          const fixedCode = rule.autoFix(code);
          
          return {
            id: `fix_${Date.now()}`,
            description: `إصلاح: ${error.message}`,
            type: 'auto',
            confidence: 0.9,
            originalCode: code,
            fixedCode,
            line: error.line,
            applied: false,
          };
        } catch (e) {
          console.error('فشل توليد الإصلاح:', e);
        }
      }
    }

    // إصلاحات مخصصة بناءً على نوع الخطأ
    if (error.suggestion) {
      return {
        id: `fix_${Date.now()}`,
        description: error.suggestion,
        type: 'auto',
        confidence: 0.7,
        originalCode: error.code || code,
        fixedCode: error.suggestion,
        line: error.line,
        applied: false,
      };
    }

    return null;
  }

  private calculateCodeQuality(
    code: string,
    errors: CodeError[],
    warnings: CodeError[]
  ): {
    score: number;
    readability: number;
    maintainability: number;
    performance: number;
    security: number;
  } {
    // حساب النتيجة الأساسية
    let score = 100;

    // خصم نقاط للأخطاء
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    // خصم نقاط للتحذيرات
    warnings.forEach(warning => {
      switch (warning.severity) {
        case 'critical': score -= 10; break;
        case 'high': score -= 5; break;
        case 'medium': score -= 2; break;
        case 'low': score -= 1; break;
      }
    });

    score = Math.max(0, score);

    // حساب مقاييس فرعية
    const readability = this.calculateReadability(code);
    const maintainability = this.calculateMaintainability(code);
    const performance = this.calculatePerformance(code);
    const security = this.calculateSecurity(code, errors);

    return {
      score: Math.round(score),
      readability,
      maintainability,
      performance,
      security,
    };
  }

  private calculateReadability(code: string): number {
    const lines = code.split('\n');
    let score = 100;

    // طول الأسطر
    const longLines = lines.filter(l => l.length > 120).length;
    score -= longLines * 2;

    // التعليقات
    const comments = (code.match(/\/\//g) || []).length;
    const commentRatio = comments / lines.length;
    if (commentRatio < 0.1) score -= 10;

    // المسافات البادئة
    const badIndent = lines.filter(l => l.startsWith('  ') && !l.startsWith('    ')).length;
    score -= badIndent * 1;

    return Math.max(0, Math.min(100, score));
  }

  private calculateMaintainability(code: string): number {
    let score = 100;

    // تعقيد الدوال
    const functions = (code.match(/function\s+\w+/g) || []).length;
    const linesPerFunction = code.split('\n').length / Math.max(functions, 1);
    
    if (linesPerFunction > 50) score -= 20;
    else if (linesPerFunction > 30) score -= 10;

    // الحلقات المتداخلة
    const nestedLoops = (code.match(/for\s*\([^)]*\)\s*{[^}]*for\s*\(/g) || []).length;
    score -= nestedLoops * 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformance(code: string): number {
    let score = 100;

    // استخدام متكرر للـ DOM
    const domAccess = (code.match(/document\./g) || []).length;
    if (domAccess > 20) score -= 15;

    // حلقات متعددة
    const loops = (code.match(/for\s*\(|while\s*\(/g) || []).length;
    if (loops > 10) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateSecurity(code: string, errors: CodeError[]): number {
    let score = 100;

    // خصم للأخطاء الأمنية
    const securityErrors = errors.filter(e => e.type === 'security');
    securityErrors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private applyFix(code: string, fix: CodeFix): string {
    if (fix.line !== undefined) {
      // إصلاح سطر محدد
      const lines = code.split('\n');
      lines[fix.line - 1] = fix.fixedCode;
      return lines.join('\n');
    } else {
      // إصلاح شامل
      return fix.fixedCode;
    }
  }

  private applyPerformanceOptimizations(code: string): string {
    let optimized = code;

    // تحويل for loops بسيطة إلى map/filter
    // (مثال بسيط - يمكن توسيعه)
    
    return optimized;
  }

  private improveReadability(code: string): string {
    let improved = code;

    // تحسين المسافات البادئة
    // إضافة أسطر فارغة بين الدوال
    // (يمكن استخدام prettier هنا)

    return improved;
  }

  private applyBestPractices(code: string): string {
    let improved = code;

    // تحويل == إلى ===
    improved = improved.replace(/([^=!])={2}([^=])/g, '$1===$2');

    // تحويل var إلى const/let
    improved = improved.replace(/\bvar\b/g, 'let');

    return improved;
  }

  private isAutoFixable(errorMessage: string): boolean {
    // تحديد إذا كان الخطأ قابل للإصلاح التلقائي
    const autoFixablePatterns = [
      /missing semicolon/i,
      /unexpected token/i,
      /template/i,
    ];

    return autoFixablePatterns.some(pattern => pattern.test(errorMessage));
  }

  private extractErrorPattern(error: CodeError, context: string): string | null {
    // استخراج نمط الخطأ للتعلم
    return `${error.type}:${error.message.substring(0, 50)}`;
  }

  private recordFix(originalCode: string, fixedCode: string, fixes: CodeFix[]): void {
    const hash = this.hashCode(originalCode);
    const existing = this.fixHistory.get(hash) || [];
    this.fixHistory.set(hash, [...existing, ...fixes]);
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}

// مثيل مشترك
export const codeIntelligence = new CodeIntelligence();