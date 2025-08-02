import { Injectable } from '@nestjs/common';
import { StarForceCalculationService } from './starforce-calculation.service';
import { StarforceOptimizationRequestDto, StarforceOptimizationResponseDto } from '../contracts';

interface EnhancementStep {
  itemIndex: number;
  itemName: string;
  fromStar: number;
  toStar: number;
  expectedCost: number;
  expectedBooms: number;
  efficiency: number;
  riskLevel: string;
  priority: number;
  canAfford: boolean;
  spareRequirement: number;
  availableSpares: number;
  isGuaranteed: boolean;
}

interface ActionStep {
  step: number;
  action: string;
  fromStar: number;
  toStar: number;
  expectedCost: number;
  expectedBooms: number;
  riskLevel: string;
  efficiency: number;
  cumulativeCost: number;
  remainingBudget: number;
  specialNote?: string;
}

interface Recommendation {
  type: string;
  priority: string;
  message: string;
}
@Injectable()
export class StarforceOptimizationService {
  constructor(
    private readonly calculationService: StarForceCalculationService,
  ) {}

  /**
   * Calculate optimal starforcing strategy to maximize stars gained within budget
   */
  calculateOptimalStarforceStrategy(
    request: StarforceOptimizationRequestDto,
  ): StarforceOptimizationResponseDto {
    const {
      items,
      availableMeso,
      isInteractive,
      events,
      riskTolerance = 'balanced',
    } = request;

    // Generate all possible enhancement steps with efficiency scores
    const enhancementSteps = this.generateAllPossibleSteps(items, isInteractive, events);
    
    // Sort by cost efficiency (stars per meso)
    const sortedSteps = enhancementSteps.sort((a, b) => b.efficiency - a.efficiency);

    // Build optimal action plan within budget
    const actionPlan = this.buildOptimalActionPlan(sortedSteps, availableMeso, items, events, riskTolerance);

    // Calculate what's achievable vs what was requested
    const achievableTargets = this.calculateAchievableTargets(actionPlan, items);
    
    // Generate warnings and recommendations
    const analysis = this.analyzeOptimizationResults(items, achievableTargets, availableMeso, actionPlan, events);

    return {
      budget: {
        available: availableMeso,
        used: actionPlan.reduce((sum, step) => sum + step.expectedCost, 0),
        remaining: availableMeso - actionPlan.reduce((sum, step) => sum + step.expectedCost, 0),
      },
      starsGained: {
        total: actionPlan.length,
        byItem: this.calculateStarsGainedByItem(actionPlan, items),
      },
      actionPlan,
      achievableTargets,
      originalTargets: items.map(item => ({
        itemName: item.itemName || `Level ${item.itemLevel} Item`,
        fromStar: item.fromStar,
        requestedTarget: item.toStar,
        achievableTarget: achievableTargets.find(t => t.itemIndex === items.indexOf(item))?.achievableTarget || item.fromStar,
        starsShortfall: item.toStar - (achievableTargets.find(t => t.itemIndex === items.indexOf(item))?.achievableTarget || item.fromStar),
      })),
      analysis,
      recommendations: this.generateBudgetRecommendations(analysis, availableMeso, items, events),
    };
  }

  private generateAllPossibleSteps(items: any[], isInteractive?: boolean, events?: any): EnhancementStep[] {
    const steps: EnhancementStep[] = [];
    
    items.forEach((item, itemIndex) => {
      const startingStar = item.fromStar;
      const targetStar = item.toStar;
      
      // If item is below 15★, create a single "tap to 15★" step
      if (startingStar < 15) {
        const tapTo15Star = Math.min(15, targetStar);
        
        // Calculate cost for tapping to 15★ (or target if lower)
        const tapCalculation = this.calculationService.calculateStarForceCost({
          fromStar: startingStar,
          toStar: tapTo15Star,
          itemLevel: item.itemLevel,
          isInteractive: isInteractive || false,
          spareCount: 0,
          spareCost: 0,
          safeguardEnabled: item.safeguardEnabled,
          events,
        });

        steps.push({
          itemIndex,
          itemName: item.itemName || `Level ${item.itemLevel} Item #${itemIndex + 1}`,
          fromStar: startingStar,
          toStar: tapTo15Star,
          expectedCost: tapCalculation.averageCost,
          expectedBooms: 0, // No boom risk below 15★
          efficiency: (tapTo15Star - startingStar) / tapCalculation.averageCost, // Stars per meso
          riskLevel: 'Low',
          priority: this.calculateStepPriority(startingStar, tapCalculation.averageCost, 'Low'),
          canAfford: true,
          spareRequirement: 0,
          availableSpares: item.spareCount || 0,
          isGuaranteed: false,
        });
      }
      
      // Generate individual steps for 15★ and above
      const enhanceStart = Math.max(startingStar, 15);
      for (let star = enhanceStart; star < targetStar; star++) {
        // Skip if we already handled this range with tap to 15
        if (star < 15) continue;
        
        // Calculate cost for this single star enhancement
        const stepCalculation = this.calculationService.calculateStarForceCost({
          fromStar: star,
          toStar: star + 1,
          itemLevel: item.itemLevel,
          isInteractive: isInteractive || false,
          spareCount: 0,
          spareCost: 0,
          safeguardEnabled: item.safeguardEnabled,
          events,
        });

        // Risk assessment
        const riskAssessment = this.assessStepRisk(item, star);
        const canAfford = this.canAffordStep(item, star);

        steps.push({
          itemIndex,
          itemName: item.itemName || `Level ${item.itemLevel} Item #${itemIndex + 1}`,
          fromStar: star,
          toStar: star + 1,
          expectedCost: stepCalculation.averageCost,
          expectedBooms: stepCalculation.averageSpareCount || 0,
          efficiency: 1 / stepCalculation.averageCost, // Stars per meso
          riskLevel: riskAssessment.level,
          priority: this.calculateStepPriority(star, stepCalculation.averageCost, riskAssessment.level),
          canAfford,
          spareRequirement: stepCalculation.averageSpareCount || 0,
          availableSpares: item.spareCount || 0,
          isGuaranteed: events?.fiveTenFifteen && (star === 4 || star === 9 || star === 14),
        });
      }
    });

    return steps;
  }

  private buildOptimalActionPlan(
    sortedSteps: EnhancementStep[], 
    budget: number, 
    items: any[], 
    events?: any, 
    riskTolerance: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
  ): ActionStep[] {
    const actionPlan: ActionStep[] = [];
    let remainingBudget = budget;
    let stepNumber = 1;
    
    // Track current star level for each item
    const currentStars = items.map(item => item.fromStar);
    
    // Keep trying to find viable enhancements until budget is exhausted
    let hasProgressedThisRound = true;
    
    while (hasProgressedThisRound && remainingBudget > 50000000) {
      hasProgressedThisRound = false;
      
      // For each item, try to find the next enhancement step
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const currentStar = currentStars[itemIndex];
        const targetStar = items[itemIndex].toStar;
        
        // Skip if item already at target
        if (currentStar >= targetStar) {
          continue;
        }
        
        // Find the next step for this item
        const nextStep = sortedSteps.find(step => 
          step.itemIndex === itemIndex && 
          step.fromStar === currentStar
        );
        
        if (!nextStep) {
          continue; // No more steps available for this item
        }
        
        // Check if we can afford this step
        if (nextStep.expectedCost > remainingBudget) {
          continue;
        }
        
        // Check risk tolerance and spare requirements
        if (!this.isStepAllowedByRiskTolerance(nextStep, riskTolerance)) {
          continue;
        }
        
        // Check spare requirements for boom-possible enhancements
        if (nextStep.spareRequirement > nextStep.availableSpares && 
            nextStep.fromStar >= 15 && 
            !nextStep.isGuaranteed) {
          continue;
        }
        
        // Add special note for guaranteed successes
        let specialNote: string | undefined = undefined;
        if (nextStep.isGuaranteed) {
          specialNote = "★ GUARANTEED SUCCESS (5/10/15 Event) ★";
        }
        
        // Add this step to the plan
        actionPlan.push({
          step: stepNumber++,
          action: nextStep.fromStar < 15 ? 
            `Tap ${nextStep.itemName} to ${nextStep.toStar}★` : 
            `Enhance ${nextStep.itemName}`,
          fromStar: nextStep.fromStar,
          toStar: nextStep.toStar,
          expectedCost: nextStep.expectedCost,
          expectedBooms: nextStep.isGuaranteed ? 0 : nextStep.expectedBooms,
          riskLevel: nextStep.isGuaranteed ? 'Low' : nextStep.riskLevel,
          efficiency: nextStep.efficiency,
          cumulativeCost: (actionPlan.reduce((sum, s) => sum + s.expectedCost, 0)) + nextStep.expectedCost,
          remainingBudget: remainingBudget - nextStep.expectedCost,
          specialNote,
        });
        
        remainingBudget -= nextStep.expectedCost;
        currentStars[itemIndex] = nextStep.toStar; // Update to the new star level
        hasProgressedThisRound = true;
        
        // Break if budget is too low to continue
        if (remainingBudget < 50000000) {
          break;
        }
      }
    }

    return actionPlan;
  }

  /**
   * Check if a step is allowed based on risk tolerance
   */
  private isStepAllowedByRiskTolerance(
    step: EnhancementStep, 
    riskTolerance: 'conservative' | 'balanced' | 'aggressive'
  ): boolean {
    // Always allow guaranteed steps
    if (step.isGuaranteed) {
      return true;
    }
    
    // Check based on risk tolerance
    switch (riskTolerance) {
      case 'conservative':
        // Only allow low risk steps, or medium risk if star level is below 17
        return step.riskLevel === 'Low' || (step.riskLevel === 'Medium' && step.fromStar < 17);
        
      case 'balanced':
        // Allow low and medium risk, high risk only for very cost-efficient steps
        return step.riskLevel === 'Low' || 
               step.riskLevel === 'Medium' || 
               (step.riskLevel === 'High' && step.efficiency > 0.000001); // Very efficient high-risk steps
        
      case 'aggressive':
        // Allow all risk levels
        return true;
        
      default:
        return step.riskLevel === 'Low' || step.riskLevel === 'Medium';
    }
  }

  private calculateAchievableTargets(actionPlan: ActionStep[], items: any[]) {
    const achievableTargets = items.map((item, index) => {
      const itemName = item.itemName || `Level ${item.itemLevel} Item #${index + 1}`;
      const itemSteps = actionPlan.filter(step => 
        step.action.includes(itemName) || step.action.includes(`Item #${index + 1}`)
      );
      
      // Calculate final star level by considering multi-star steps
      let achievableTarget = item.fromStar;
      itemSteps.forEach(step => {
        achievableTarget = step.toStar; // Each step brings us to its toStar level
      });
      
      return {
        itemIndex: index,
        itemName,
        originalTarget: item.toStar,
        achievableTarget,
        starsGained: achievableTarget - item.fromStar,
        starsShortfall: item.toStar - achievableTarget,
      };
    });

    return achievableTargets;
  }

  private analyzeOptimizationResults(items: any[], achievableTargets: any[], budget: number, actionPlan: ActionStep[], events?: any) {
    const totalStarsRequested = items.reduce((sum, item) => sum + (item.toStar - item.fromStar), 0);
    const totalStarsAchievable = achievableTargets.reduce((sum, target) => sum + target.starsGained, 0);
    const budgetUsed = actionPlan.reduce((sum, step) => sum + step.expectedCost, 0);
    const budgetEfficiency = totalStarsAchievable / budgetUsed; // Stars per meso

    const itemsFullyAchievable = achievableTargets.filter(target => target.starsShortfall === 0).length;
    const itemsPartiallyAchievable = achievableTargets.filter(target => target.starsGained > 0 && target.starsShortfall > 0).length;
    const itemsNotAchievable = achievableTargets.filter(target => target.starsGained === 0).length;

    const analysis: any = {
      starsMetrics: {
        requested: totalStarsRequested,
        achievable: totalStarsAchievable,
        shortfall: totalStarsRequested - totalStarsAchievable,
        completionRate: (totalStarsAchievable / totalStarsRequested) * 100,
      },
      budgetMetrics: {
        efficiency: budgetEfficiency,
        utilizationRate: (budgetUsed / budget) * 100,
        costPerStar: budgetUsed / totalStarsAchievable,
      },
      itemsStatus: {
        fullyAchievable: itemsFullyAchievable,
        partiallyAchievable: itemsPartiallyAchievable,
        notAchievable: itemsNotAchievable,
      },
      riskAssessment: this.assessPlanRisk(actionPlan),
    };

    // Add event benefits if applicable
    if (events?.fiveTenFifteen) {
      const guaranteedSteps = actionPlan.filter(step => step.specialNote?.includes('GUARANTEED')).length;
      analysis.eventBenefits = {
        guaranteedSuccesses: guaranteedSteps,
        mesoSaved: guaranteedSteps * 150000000, // Rough estimate
        riskReduced: "15★→16★ steps are now risk-free",
      };
    }

    return analysis;
  }

  private generateBudgetRecommendations(analysis: any, budget: number, items: any[], events?: any): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Event-specific recommendations
    if (events?.fiveTenFifteen) {
      recommendations.push({
        type: 'event',
        priority: 'high',
        message: '5/10/15 Event Active! Prioritize 15★→16★ enhancements first - they\'re guaranteed and cost-efficient.',
      });
    }

    if (analysis.starsMetrics.completionRate < 50) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        message: `Budget insufficient for goals. Consider increasing budget by ${((analysis.starsMetrics.shortfall * analysis.budgetMetrics.costPerStar) / 1000000).toFixed(0)}M meso`,
      });
    }

    if (analysis.itemsStatus.fullyAchievable > 0) {
      recommendations.push({
        type: 'achievement',
        priority: 'medium',
        message: `${analysis.itemsStatus.fullyAchievable} item(s) can reach full target! Focus remaining budget here for maximum completion.`,
      });
    }

    if (analysis.itemsStatus.notAchievable > 0) {
      recommendations.push({
        type: 'priority',
        priority: 'medium',
        message: `${analysis.itemsStatus.notAchievable} items cannot be enhanced with current budget. Focus on fewer items for better results.`,
      });
    }

    if (analysis.riskAssessment.highRiskSteps > 0) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        message: `${analysis.riskAssessment.highRiskSteps} high-risk steps detected. Ensure adequate spares before proceeding.`,
      });
    }

    if (analysis.budgetMetrics.utilizationRate < 80) {
      const unusedBudget = budget - (budget * analysis.budgetMetrics.utilizationRate / 100);
      recommendations.push({
        type: 'opportunity',
        priority: 'low',
        message: `${(unusedBudget / 1000000).toFixed(0)}M meso remaining. Consider enhancing additional items or higher star targets.`,
      });
    }

    return recommendations;
  }

  private calculateStepPriority(starLevel: number, cost: number, riskLevel: string) {
    let priority = 100 - starLevel; // Lower stars = higher priority (cheaper)
    
    // Adjust for cost efficiency
    priority += (1000000000 / cost) * 10; // Cheaper steps get higher priority
    
    // Adjust for risk
    if (riskLevel === 'Low') priority += 20;
    else if (riskLevel === 'Medium') priority += 10;
    else if (riskLevel === 'High') priority -= 10;
    else if (riskLevel === 'Critical') priority -= 50;

    return priority;
  }

  private canAffordStep(item: any, starLevel: number) {
    if (starLevel >= 15) {
      return (item.spareCount || 0) > 0; // Need spares for boom-possible
    }
    return true;
  }

  private calculateStarsGainedByItem(actionPlan: ActionStep[], items: any[]) {
    return items.map((item, index) => {
      const itemName = item.itemName || `Level ${item.itemLevel} Item #${index + 1}`;
      const itemSteps = actionPlan.filter(step => 
        step.action.includes(itemName) || step.action.includes(`Item #${index + 1}`)
      );
      
      // Calculate final star level and total stars gained considering multi-star steps
      let finalStar = item.fromStar;
      itemSteps.forEach(step => {
        finalStar = step.toStar;
      });
      const starsGained = finalStar - item.fromStar;
      
      return {
        itemName,
        originalTarget: item.toStar,
        starsGained,
        finalStar,
        stepsCompleted: itemSteps.length,
        totalCost: itemSteps.reduce((sum, step) => sum + step.expectedCost, 0),
      };
    });
  }

  private assessPlanRisk(actionPlan: ActionStep[]) {
    const highRiskSteps = actionPlan.filter(step => step.riskLevel === 'High' || step.riskLevel === 'Critical').length;
    const mediumRiskSteps = actionPlan.filter(step => step.riskLevel === 'Medium').length;
    
    return {
      highRiskSteps,
      mediumRiskSteps,
      overallRisk: highRiskSteps > 0 ? 'High' : mediumRiskSteps > 3 ? 'Medium' : 'Low',
    };
  }

  private assessStepRisk(item: any, starLevel: number) {
    const spareCount = item.spareCount || 0;
    const boomPossible = starLevel >= 15;
    const highRisk = starLevel >= 17;

    if (!boomPossible) {
      return { level: 'Low', warning: null, recommendation: null };
    }

    if (spareCount === 0) {
      return {
        level: 'Critical',
        warning: `No spares available for boom-possible enhancement to ${starLevel + 1}★`,
        recommendation: 'Consider stopping here or acquiring spares first'
      };
    }

    if (highRisk && spareCount < 2) {
      return {
        level: 'High',
        warning: `Only ${spareCount} spare(s) for high-risk ${starLevel}★→${starLevel + 1}★`,
        recommendation: 'Consider using safeguard and having backup spares ready'
      };
    }

    if (boomPossible && spareCount < 3) {
      return {
        level: 'Medium',
        warning: `Limited spares (${spareCount}) for ${starLevel}★→${starLevel + 1}★`,
        recommendation: 'Proceed with caution'
      };
    }

    return { level: 'Low', warning: null, recommendation: null };
  }
}
