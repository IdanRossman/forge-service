import { Injectable } from '@nestjs/common';
import {
  EnhancedStarforceCostRequestDto,
  EnhancedStarforceCostResponseDto,
  BulkEnhancedStarforceRequestDto,
  BulkEnhancedStarforceResponseDto,
} from '../contracts';
import { StarForceCalculationService } from './starforce-calculation.service';
import { LuckAnalysisService } from './luck-analysis.service';

@Injectable()
export class StarforceCostService {
  constructor(
    private readonly calculationService: StarForceCalculationService,
    private readonly luckAnalysisService: LuckAnalysisService,
  ) {}

  /**
   * Enhanced calculation with all modular features
   */
  calculateEnhancedStarforceCost(
    request: EnhancedStarforceCostRequestDto,
  ): EnhancedStarforceCostResponseDto {
    // Core calculation
    const calculation = this.calculationService.calculateStarForceCost({
      fromStar: request.fromStar,
      toStar: request.toStar,
      itemLevel: request.itemLevel,
      isInteractive: request.isInteractive,
      spareCount: request.spareCount,
      spareCost: request.spareCost,
      safeguardEnabled: request.safeguardEnabled,
      events: request.events,
      returnCostResults: true, // Always return cost results for distribution calculations
    });

    const response: EnhancedStarforceCostResponseDto = {
      fromStar: calculation.fromStar,
      toStar: calculation.toStar,
      itemLevel: request.itemLevel,
      isInteractive: calculation.isInteractive,
      averageCost: calculation.averageCost,
      medianCost: calculation.medianCost,
      percentile75Cost: calculation.percentile75Cost,
      trials: calculation.trials,
      costDistribution: calculation.costDistribution,
      averageSpareCount: calculation.averageSpareCount,
      medianSpareCount: calculation.medianSpareCount,
      percentile75SpareCount: calculation.percentile75SpareCount,
      totalInvestment: calculation.totalInvestment,
    };

    // Add luck analysis if actualCost provided
    if (request.actualCost !== undefined) {
      // Use the calculation service instead - request cost results for luck analysis
      const detailedCalculation =
        this.calculationService.calculateStarForceCost({
          fromStar: request.fromStar,
          toStar: request.toStar,
          itemLevel: request.itemLevel,
          isInteractive: request.isInteractive,
          safeguardEnabled: request.safeguardEnabled || false,
          events: request.events,
          returnCostResults: true, // Request cost results for luck analysis
        });

      if (detailedCalculation.costResults) {
        const luckAnalysis = this.luckAnalysisService.analyzeLuck(
          request.actualCost,
          detailedCalculation.costResults,
        );

        response.luckAnalysis = {
          ...luckAnalysis,
          shareMessage:
            this.luckAnalysisService.generateLuckSummary(luckAnalysis),
        };
      }
    }

    return response;
  }

  /**
   * Bulk calculation for multiple items with shared events
   */
  calculateBulkStarforceCost(
    request: BulkEnhancedStarforceRequestDto,
  ): BulkEnhancedStarforceResponseDto {
    // Calculate each item using the shared events
    const results = request.items.map((item) => {
      const enhancedRequest: EnhancedStarforceCostRequestDto = {
        itemLevel: item.itemLevel,
        fromStar: item.fromStar,
        toStar: item.toStar,
        isInteractive: request.isInteractive,
        safeguardEnabled: item.safeguardEnabled,
        events: request.events, // Shared events across all items
        spareCount: item.spareCount,
        spareCost: item.spareCost,
        actualCost: item.actualCost,
      };

      return this.calculateEnhancedStarforceCost(enhancedRequest);
    });

    // Calculate summary statistics
    const totalExpectedCost = results.reduce(
      (sum, result) => sum + result.averageCost,
      0,
    );
    const totalMedianCost = results.reduce(
      (sum, result) => sum + result.medianCost,
      0,
    );
    const totalConservativeCost = results.reduce(
      (sum, result) => sum + result.percentile75Cost,
      0,
    );
    const totalExpectedBooms = results.reduce(
      (sum, result) => sum + (result.averageSpareCount || 0),
      0,
    );
    const worstCaseScenario = results.reduce(
      (sum, result) => sum + result.costDistribution.max,
      0,
    );
    const bestCaseScenario = results.reduce(
      (sum, result) => sum + result.costDistribution.min,
      0,
    );

    return {
      results,
      summary: {
        totalExpectedCost,
        totalMedianCost,
        totalConservativeCost,
        totalExpectedBooms,
        totalCalculations: results.length,
        worstCaseScenario,
        bestCaseScenario,
      },
    };
  }
}
