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
    const { items, availableMeso, isInteractive, events } = request;

    // Generate all possible enhancement steps with efficiency scores
    const enhancementSteps = this.generateAllPossibleSteps(items, isInteractive, events);
    
    // Sort by cost efficiency (stars per meso)
    const sortedSteps = enhancementSteps.sort((a, b) => b.efficiency - a.efficiency);

    // Build optimal action plan within budget
    const actionPlan = this.buildOptimalActionPlan(sortedSteps, availableMeso, items, events);

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
      for (let star = item.fromStar; star < item.toStar; star++) {
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

  private buildOptimalActionPlan(sortedSteps: EnhancementStep[], budget: number, items: any[], events?: any): ActionStep[] {
    const actionPlan: ActionStep[] = [];
    let remainingBudget = budget;
    let stepNumber = 1;
    
    // Track current star level for each item
    const currentStars = items.map(item => item.fromStar);

    for (const step of sortedSteps) {
      // Check if we can afford this step
      if (step.expectedCost > remainingBudget) {
        continue;
      }

      // Check if this step is the next logical step for this item
      if (step.fromStar !== currentStars[step.itemIndex]) {
        continue;
      }

      // Check spare requirements
      if (step.spareRequirement > step.availableSpares && step.fromStar >= 15 && !step.isGuaranteed) {
        continue; // Skip if insufficient spares for boom-possible enhancement
      }

      // Add special note for guaranteed successes
      let specialNote: string | undefined = undefined;
      if (step.isGuaranteed) {
        specialNote = "★ GUARANTEED SUCCESS (5/10/15 Event) ★";
      }

      // Add this step to the plan
      actionPlan.push({
        step: stepNumber++,
        action: `Enhance ${step.itemName}`,
        fromStar: step.fromStar,
        toStar: step.toStar,
        expectedCost: step.expectedCost,
        expectedBooms: step.isGuaranteed ? 0 : step.expectedBooms,
        riskLevel: step.isGuaranteed ? 'Low' : step.riskLevel,
        efficiency: step.efficiency,
        cumulativeCost: (actionPlan.reduce((sum, s) => sum + s.expectedCost, 0)) + step.expectedCost,
        remainingBudget: remainingBudget - step.expectedCost,
        specialNote,
      });

      remainingBudget -= step.expectedCost;
      currentStars[step.itemIndex]++;

      // Early exit if budget is very low
      if (remainingBudget < 50000000) { // Less than 50m meso
        break;
      }
    }

    return actionPlan;
  }

  private calculateAchievableTargets(actionPlan: ActionStep[], items: any[]) {
    const achievableTargets = items.map((item, index) => {
      const itemName = item.itemName || `Level ${item.itemLevel} Item #${index + 1}`;
      const itemSteps = actionPlan.filter(step => 
        step.action.includes(itemName) || step.action.includes(`Item #${index + 1}`)
      );
      const achievableTarget = item.fromStar + itemSteps.length;
      
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
      
      return {
        itemName,
        originalTarget: item.toStar,
        starsGained: itemSteps.length,
        finalStar: item.fromStar + itemSteps.length,
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
