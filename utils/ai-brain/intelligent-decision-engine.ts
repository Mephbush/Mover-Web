/**
 * محرك القرارات الذكي
 * Intelligent Decision Engine
 * 
 * اتخاذ القرارات بناءً على السياق والمنطق
 */

export interface DecisionContext {
  taskType: string;
  currentState: Record<string, any>;
  pastActions: string[];
  availableOptions: DecisionOption[];
  constraints: Record<string, any>;
  goals: string[];
  riskLevel: number; // 0-1
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  expectedOutcome: string;
  riskLevel: number; // 0-1
  timeEstimate: number; // ms
  successRate: number; // 0-1
  requiredResources: string[];
  sideEffects?: string[];
  dependencies?: string[]; // IDs of other options
  cost?: number; // resource cost
}

export interface Decision {
  id: string;
  timestamp: Date;
  context: DecisionContext;
  chosenOption: DecisionOption;
  reasoning: string;
  confidence: number; // 0-1
  alternatives: DecisionOption[];
  expectedSuccess: number; // 0-1
}

export interface DecisionEvaluation {
  decisionId: string;
  success: boolean;
  actualOutcome: any;
  duration: number;
  learnings: string[];
  adjustmentRecommended: boolean;
}

/**
 * محرك القرارات الذكي
 */
export class IntelligentDecisionEngine {
  private decisionHistory: Decision[] = [];
  private evaluations: DecisionEvaluation[] = [];
  private readonly maxHistorySize = 1000;
  private reasoningRules: Map<string, (context: DecisionContext) => DecisionOption | null> = new Map();

  constructor() {
    this.initializeReasoningRules();
  }

  /**
   * اتخاذ القرار الأمثل
   */
  makeDecision(context: DecisionContext): Decision {
    const startTime = Date.now();

    console.log(`🧠 Making decision for task: ${context.taskType}`);
    console.log(`   Available options: ${context.availableOptions.length}`);
    console.log(`   Risk level: ${(context.riskLevel * 100).toFixed(1)}%`);

    // 1. Apply reasoning rules
    const ruleBased = this.applyReasoningRules(context);
    if (ruleBased) {
      console.log(`   ✅ Rule-based match: ${ruleBased.name}`);
    }

    // 2. Score all options
    const scores = context.availableOptions.map(option => ({
      option,
      score: this.scoreOption(option, context),
    }));

    // 3. Sort by score
    scores.sort((a, b) => b.score - a.score);

    // 4. Select best option
    const chosenOption = scores[0]?.option;

    if (!chosenOption) {
      throw new Error('No viable decision option available');
    }

    // 5. Evaluate confidence
    const confidence = this.calculateConfidence(chosenOption, context);

    // 6. Get alternatives
    const alternatives = scores
      .slice(1, 4)
      .map(s => s.option);

    const decision: Decision = {
      id: `decision_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      context,
      chosenOption,
      reasoning: this.generateReasoning(chosenOption, context),
      confidence,
      alternatives,
      expectedSuccess: chosenOption.successRate * confidence,
    };

    // Store decision
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > this.maxHistorySize) {
      this.decisionHistory = this.decisionHistory.slice(-this.maxHistorySize);
    }

    console.log(`   📊 Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   ⏱️ Time to decide: ${Date.now() - startTime}ms`);

    return decision;
  }

  /**
   * تقييم القرار
   */
  evaluateDecision(
    decisionId: string,
    success: boolean,
    actualOutcome: any,
    duration: number
  ): DecisionEvaluation {
    const decision = this.decisionHistory.find(d => d.id === decisionId);

    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    // Extract learnings
    const learnings = this.extractLearnings(decision, success, actualOutcome, duration);

    // Determine if adjustment needed
    const adjustmentNeeded =
      (!success && decision.confidence > 0.8) || // High confidence but failed
      (success && decision.confidence < 0.5) || // Low confidence but succeeded
      duration > decision.context.constraints.maxTime;

    const evaluation: DecisionEvaluation = {
      decisionId,
      success,
      actualOutcome,
      duration,
      learnings,
      adjustmentRecommended: adjustmentNeeded,
    };

    this.evaluations.push(evaluation);

    if (success) {
      console.log(`✅ Decision successful: ${decision.chosenOption.name}`);
    } else {
      console.log(`❌ Decision failed: ${decision.chosenOption.name}`);
      console.log(`   Suggested alternatives: ${decision.alternatives.map(a => a.name).join(', ')}`);
    }

    return evaluation;
  }

  /**
   * تحسين القرار بناءً على التقييمات
   */
  improveFutureDecisions(): {
    insights: string[];
    patterns: Record<string, number>;
    recommendations: string[];
  } {
    const insights: string[] = [];
    const patterns: Record<string, number> = {};
    const recommendations: string[] = [];

    if (this.evaluations.length === 0) {
      return { insights, patterns, recommendations };
    }

    // Analyze evaluation history
    const successRate = this.evaluations.filter(e => e.success).length / this.evaluations.length;
    insights.push(`Overall success rate: ${(successRate * 100).toFixed(1)}%`);

    // Find patterns
    this.evaluations.forEach(eval => {
      const decision = this.decisionHistory.find(d => d.id === eval.decisionId);
      if (decision) {
        const key = decision.chosenOption.name;
        patterns[key] = (patterns[key] || 0) + (eval.success ? 1 : 0);
      }
    });

    // Generate recommendations
    Object.entries(patterns).forEach(([option, successes]) => {
      const total = this.evaluations.filter(e => {
        const decision = this.decisionHistory.find(d => d.id === e.decisionId);
        return decision?.chosenOption.name === option;
      }).length;

      if (total > 0) {
        const rate = successes / total;
        if (rate > 0.9) {
          recommendations.push(`⭐ "${option}" has 90%+ success rate - prioritize this`);
        } else if (rate < 0.3) {
          recommendations.push(`❌ "${option}" has low success rate (<30%) - avoid or improve`);
        }
      }
    });

    return { insights, patterns, recommendations };
  }

  /**
   * الحصول على سجل القرارات
   */
  getDecisionHistory(limit?: number): Decision[] {
    if (limit) {
      return this.decisionHistory.slice(-limit);
    }
    return [...this.decisionHistory];
  }

  /**
   * الحصول على الإحصائيات
   */
  getStatistics(): {
    totalDecisions: number;
    successfulEvaluations: number;
    failedEvaluations: number;
    averageConfidence: number;
    averageDecisionTime: number;
  } {
    const successCount = this.evaluations.filter(e => e.success).length;
    const failureCount = this.evaluations.filter(e => !e.success).length;

    const avgConfidence =
      this.decisionHistory.length > 0
        ? this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) /
          this.decisionHistory.length
        : 0;

    const avgTime =
      this.evaluations.length > 0
        ? this.evaluations.reduce((sum, e) => sum + e.duration, 0) / this.evaluations.length
        : 0;

    return {
      totalDecisions: this.decisionHistory.length,
      successfulEvaluations: successCount,
      failedEvaluations: failureCount,
      averageConfidence: avgConfidence,
      averageDecisionTime: avgTime,
    };
  }

  // =================== Private Methods ===================

  private applyReasoningRules(context: DecisionContext): DecisionOption | null {
    for (const [ruleName, ruleFunc] of this.reasoningRules) {
      try {
        const result = ruleFunc(context);
        if (result) {
          console.log(`   📋 Rule matched: ${ruleName}`);
          return result;
        }
      } catch (error) {
        console.debug(`Rule ${ruleName} failed: ${error}`);
      }
    }
    return null;
  }

  private scoreOption(option: DecisionOption, context: DecisionContext): number {
    let score = 0;

    // Success rate (40% weight)
    score += option.successRate * 0.4;

    // Risk consideration (20% weight)
    const riskScore = 1 - Math.abs(option.riskLevel - context.riskLevel);
    score += riskScore * 0.2;

    // Time efficiency (20% weight)
    const maxTime = context.constraints.maxTime || 30000;
    const timeScore = Math.max(0, 1 - option.timeEstimate / maxTime);
    score += timeScore * 0.2;

    // Resource availability (10% weight)
    const resourceScore = option.requiredResources.length > 0 ? 0.5 : 1.0;
    score += resourceScore * 0.1;

    // Dependencies check
    if (option.dependencies && option.dependencies.length > 0) {
      const dependenciesMet = option.dependencies.every(depId =>
        context.pastActions.includes(depId)
      );
      if (!dependenciesMet) {
        score *= 0.5; // Penalize if dependencies not met
      }
    }

    // Constraint compliance
    if (!this.meetsConstraints(option, context)) {
      score *= 0.3; // Heavy penalty
    }

    return Math.max(0, Math.min(1, score)); // Clamp to 0-1
  }

  private calculateConfidence(option: DecisionOption, context: DecisionContext): number {
    let confidence = option.successRate;

    // Adjust based on task type match
    const taskRelevance = this.getTaskRelevance(option, context.taskType);
    confidence *= taskRelevance;

    // Adjust based on past experiences
    const pastSuccess = this.getPastSuccessRate(option.name);
    if (pastSuccess !== null) {
      confidence = confidence * 0.5 + pastSuccess * 0.5; // Blend with history
    }

    // Adjust based on constraints
    if (this.meetsConstraints(option, context)) {
      confidence *= 1.05; // Small boost if constraints met
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private meetsConstraints(option: DecisionOption, context: DecisionContext): boolean {
    // Check time constraint
    if (context.constraints.maxTime && option.timeEstimate > context.constraints.maxTime) {
      return false;
    }

    // Check cost constraint
    if (context.constraints.maxCost && option.cost && option.cost > context.constraints.maxCost) {
      return false;
    }

    // Check resource availability
    if (context.constraints.availableResources) {
      for (const required of option.requiredResources) {
        if (!context.constraints.availableResources.includes(required)) {
          return false;
        }
      }
    }

    return true;
  }

  private generateReasoning(option: DecisionOption, context: DecisionContext): string {
    return `Selected "${option.name}" because: ` +
      `Success rate ${(option.successRate * 100).toFixed(0)}%, ` +
      `Risk level ${(option.riskLevel * 100).toFixed(0)}% (vs target ${(context.riskLevel * 100).toFixed(0)}%), ` +
      `Estimated time ${option.timeEstimate}ms`;
  }

  private extractLearnings(
    decision: Decision,
    success: boolean,
    actualOutcome: any,
    duration: number
  ): string[] {
    const learnings: string[] = [];

    if (success !== decision.expectedSuccess > 0.5) {
      learnings.push(`Outcome different from expected: ${success ? 'succeeded' : 'failed'} despite ${decision.confidence > 0.5 ? 'high' : 'low'} confidence`);
    }

    if (duration > decision.context.constraints.maxTime) {
      learnings.push(`Took longer than expected: ${duration}ms vs ${decision.context.constraints.maxTime}ms`);
    }

    if (success && decision.alternatives.length > 0) {
      learnings.push(`Primary choice succeeded - next time might reconsider alternatives`);
    }

    return learnings;
  }

  private getTaskRelevance(option: DecisionOption, taskType: string): number {
    // Check if option description mentions the task type
    const description = option.description.toLowerCase();
    const taskLower = taskType.toLowerCase();

    if (description.includes(taskLower)) {
      return 1.2;
    }

    // Check related keywords
    const relevantKeywords: Record<string, string[]> = {
      'form_submission': ['form', 'submit', 'fill'],
      'navigation': ['navigate', 'click', 'link'],
      'extraction': ['extract', 'read', 'get'],
    };

    const keywords = relevantKeywords[taskType] || [];
    const matches = keywords.filter(k => description.includes(k)).length;

    return 1 + matches * 0.1;
  }

  private getPastSuccessRate(optionName: string): number | null {
    const relevant = this.evaluations.filter(e => {
      const decision = this.decisionHistory.find(d => d.id === e.decisionId);
      return decision?.chosenOption.name === optionName;
    });

    if (relevant.length === 0) return null;

    const successes = relevant.filter(e => e.success).length;
    return successes / relevant.length;
  }

  private initializeReasoningRules(): void {
    // Rule: If error detected, use safe option
    this.reasoningRules.set('error_detected', (context: DecisionContext) => {
      if (context.currentState.errorDetected) {
        return context.availableOptions.find(opt => opt.riskLevel < 0.3) || null;
      }
      return null;
    });

    // Rule: If timeout, use faster option
    this.reasoningRules.set('timeout_risk', (context: DecisionContext) => {
      if (context.riskLevel > 0.7) {
        return context.availableOptions.find(opt => opt.timeEstimate < 1000) || null;
      }
      return null;
    });

    // Rule: If resource limited, use lightweight option
    this.reasoningRules.set('resource_limited', (context: DecisionContext) => {
      if (context.currentState.resourcesLimited) {
        return context.availableOptions.find(opt => opt.requiredResources.length === 0) || null;
      }
      return null;
    });

    // Rule: Match goals
    this.reasoningRules.set('goal_match', (context: DecisionContext) => {
      if (context.goals.length > 0) {
        const goalKeyword = context.goals[0].toLowerCase();
        return context.availableOptions.find(opt =>
          opt.expectedOutcome.toLowerCase().includes(goalKeyword)
        ) || null;
      }
      return null;
    });
  }
}

export function getIntelligentDecisionEngine(): IntelligentDecisionEngine {
  return new IntelligentDecisionEngine();
}
