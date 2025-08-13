import { Injectable } from '@nestjs/common';
import { LegacyStarforceStrategy } from '../strategies/legacy-starforce.strategy';
import { NewKmsStarforceStrategy } from '../strategies/new-kms-starforce.strategy';
import { StarforceCalculationStrategy } from '../strategies/starforce-strategy.interface';
import { StarforceStrategy } from '../contracts';

export interface StarForceCalculationRequest {
  fromStar: number;
  toStar: number;
  itemLevel: number;
  isInteractive: boolean;
  spareCount?: number;
  spareCost?: number;
  safeguardEnabled?: boolean;
  returnCostResults?: boolean;
  calculationVersion?: 'legacy' | 'enhanced';
  strategy?: StarforceStrategy;
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: number;
    yohiTapEvent?: boolean;
  };
}

export interface StarForceCalculationResponse {
  fromStar: number;
  toStar: number;
  isInteractive: boolean;
  averageCost: number;
  medianCost: number;
  percentile75Cost: number;
  trials: number;
  averageSpareCount?: number;
  medianSpareCount?: number;
  percentile75SpareCount?: number;
  totalInvestment?: number;
  costDistribution: {
    min: number;
    max: number;
    standardDeviation: number;
  };
  costResults?: number[];
  boomResults?: number[];
}

@Injectable()
export class StarForceCalculationService {
  constructor(
    private readonly legacyStrategy: LegacyStarforceStrategy,
    private readonly newKmsStrategy: NewKmsStarforceStrategy,
  ) {}

  private getStrategy(strategy?: StarforceStrategy): StarforceCalculationStrategy {
    switch (strategy) {
      case StarforceStrategy.NEW_KMS:
        return this.newKmsStrategy;
      case StarforceStrategy.LEGACY:
      default:
        return this.legacyStrategy;
    }
  }

  /**
   * Main calculation method that handles all starforce cost scenarios
   */
  calculateStarForceCost(
    request: StarForceCalculationRequest,
  ): StarForceCalculationResponse {
    const {
      fromStar,
      toStar,
      itemLevel,
      isInteractive,
      spareCount,
      spareCost,
      safeguardEnabled = false,
      returnCostResults = false,
      strategy,
      events = {},
    } = request;

    // Validate input
    this.validateRequest(request);

    // Select appropriate strategy
    const selectedStrategy = this.getStrategy(strategy);

    // Determine optimal trial count based on star level
    const trials = this.getOptimalTrialCount(toStar);

    // Run the calculation using the selected strategy
    const calculation = selectedStrategy.calculateStarForce(
      itemLevel,
      fromStar,
      toStar,
      {
        // Pass all events to the calculation engine
        safeguard: safeguardEnabled,
        thirtyOff: events.thirtyOff,
        fiveTenFifteen: events.fiveTenFifteen,
        starCatching: events.starCatching,
      },
      returnCostResults, // Use the returnCostResults parameter
    );

    // Build response
    const response: StarForceCalculationResponse = {
      fromStar,
      toStar,
      isInteractive,
      averageCost: calculation.averageCost,
      medianCost: calculation.medianCost,
      percentile75Cost: calculation.p75Cost,
      trials,
      costDistribution: {
        min: calculation.costResults ? Math.min(...calculation.costResults) : 0,
        max: calculation.costResults ? Math.max(...calculation.costResults) : 0,
        standardDeviation: calculation.costResults
          ? this.calculateStandardDeviation(calculation.costResults)
          : 0,
      },
    };

    // Add boom statistics if boom results are available
    if (calculation.boomResults) {
      const boomStats = this.calculateBoomStatistics(calculation.boomResults);
      response.averageSpareCount = boomStats.average;
      response.medianSpareCount = boomStats.median;
      response.percentile75SpareCount = boomStats.percentile75;

      // Calculate total investment if spare cost is provided
      if (spareCount !== undefined && spareCost !== undefined) {
        response.totalInvestment =
          response.medianCost + boomStats.median * spareCost;
      }
    } else if (spareCount !== undefined && spareCost !== undefined) {
      // Fallback for legacy compatibility
      response.totalInvestment = response.medianCost + spareCount * spareCost;
    }

    // Include raw results if requested
    if (returnCostResults) {
      response.costResults = calculation.costResults;
      response.boomResults = calculation.boomResults;
    }

    return response;
  }

  /**
   * Calculate boom statistics from boom results
   */
  private calculateBoomStatistics(boomResults: number[]): {
    average: number;
    median: number;
    percentile75: number;
  } {
    const average =
      boomResults.reduce((sum, val) => sum + val, 0) / boomResults.length;
    const median = this.calculatePercentile(boomResults, 50);
    const percentile75 = this.calculatePercentile(boomResults, 75);

    return {
      average: Math.round(average * 100) / 100, // Round to 2 decimal places
      median: Math.round(median * 100) / 100,
      percentile75: Math.round(percentile75 * 100) / 100,
    };
  }

  /**
   * Calculate percentile from an array of numbers
   */
  private calculatePercentile(data: number[], percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get optimal number of trials based on target star level for performance
   */
  private getOptimalTrialCount(toStar: number): number {
    // Higher star levels need fewer trials due to computational complexity
    // Lower star levels can handle more trials for better accuracy
    return toStar <= 22 ? 1000 : 250;
  }

  /**
   * Validate the calculation request
   */
  private validateRequest(request: StarForceCalculationRequest): void {
    const {
      fromStar,
      toStar,
      itemLevel,
      isInteractive,
      spareCount,
      spareCost,
    } = request;

    if (fromStar < 0 || fromStar > 29) {
      throw new Error('fromStar must be between 0 and 25');
    }

    if (toStar < 0 || toStar > 30) {
      throw new Error('toStar must be between 0 and 25');
    }

    if (fromStar >= toStar) {
      throw new Error('toStar must be greater than fromStar');
    }

    if (itemLevel < 1 || itemLevel > 300) {
      throw new Error('itemLevel must be between 1 and 300');
    }

    if (typeof isInteractive !== 'boolean') {
      throw new Error('isInteractive must be a boolean');
    }

    // Validate spare parameters together
    if ((spareCount !== undefined) !== (spareCost !== undefined)) {
      throw new Error(
        'spareCount and spareCost must both be provided or both omitted',
      );
    }

    if (spareCount !== undefined && spareCount < 0) {
      throw new Error('spareCount must be non-negative');
    }

    if (spareCost !== undefined && spareCost < 0) {
      throw new Error('spareCost must be non-negative');
    }
  }

  /**
   * Calculate standard deviation for cost distribution analysis
   */
  private calculateStandardDeviation(costs: number[]): number {
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const squaredDifferences = costs.map((cost) => Math.pow(cost - mean, 2));
    const variance =
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / costs.length;
    return Math.sqrt(variance);
  }
}
