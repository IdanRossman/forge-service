import { Injectable } from '@nestjs/common';
import {
  StarforceCostRequestDto,
  StarforceCostResponseDto,
  StarforcePerStarStatsDto,
} from '../contracts';
import {
  performEnhancementExperiment,
  generateRecommendations,
  getStarforceRates,
  calculateAttemptCost,
  Server,
  EventConfiguration,
} from './starforce-calculation.utils';

@Injectable()
export class StarforceCostService {
  /**
   * Calculate the cost to starforce an item using Brandon's proven simulation logic
   */
  calculateStarforceCost(
    request: StarforceCostRequestDto,
  ): StarforceCostResponseDto {
    const {
      itemLevel,
      currentStars,
      targetStars,
      server = 'gms',
      events = {},
      safeguardEnabled = false,
    } = request;

    // Input validation
    if (currentStars >= targetStars) {
      throw new Error('Current stars must be less than target stars');
    }

    if (currentStars < 0 || targetStars > 25 || itemLevel < 1) {
      throw new Error(
        'Invalid parameters. Stars must be 0-25, item level must be positive',
      );
    }

    // Run Monte Carlo simulation (Brandon's approach)
    const trials = 1000;
    let totalCost = 0;
    let totalBooms = 0;

    // Apply Yohi's legendary luck early if enabled
    const effectiveEvents: EventConfiguration = { ...events };
    const isYohiActive = events.yohiTapEvent || false;

    for (let i = 0; i < trials; i++) {
      const { totalCost: trialCost, totalBooms: trialBooms } =
        performEnhancementExperiment(
          currentStars,
          targetStars,
          itemLevel,
          effectiveEvents,
          safeguardEnabled,
          server as Server,
        );

      totalCost += trialCost;
      totalBooms += trialBooms;
    }

    // Calculate averages
    let averageCost = totalCost / trials;
    let averageBooms = totalBooms / trials;
    const sparesNeeded = Math.ceil(averageBooms);

    // Apply Yohi's legendary luck (halves costs and booms)
    if (isYohiActive) {
      averageCost *= 0.5;
      averageBooms *= 0.5;
    }

    // Calculate per-star statistics
    const perStarStats = this.calculatePerStarStats(
      currentStars,
      targetStars,
      itemLevel,
      server as Server,
      effectiveEvents,
      safeguardEnabled,
      isYohiActive,
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      currentStars,
      targetStars,
      averageCost,
      averageBooms,
      effectiveEvents,
      safeguardEnabled,
    );

    // Calculate derived metrics
    const totalAttempts = targetStars - currentStars;
    const costPerAttempt = averageCost / Math.max(totalAttempts, 1);
    const successRate = 100; // Simplified for now
    const boomRate = (averageBooms / Math.max(totalAttempts, 1)) * 100;

    return {
      currentLevel: currentStars,
      targetLevel: targetStars,
      averageCost: Math.round(averageCost),
      averageBooms: Math.round(averageBooms * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      boomRate: Math.round(boomRate * 100) / 100,
      costPerAttempt: Math.round(costPerAttempt),
      perStarStats,
      recommendations,
      sparesNeeded,
    };
  }

  /**
   * Calculate per-star statistics
   */
  private calculatePerStarStats(
    currentStars: number,
    targetStars: number,
    itemLevel: number,
    server: Server,
    events: EventConfiguration,
    safeguardEnabled: boolean,
    isYohiActive: boolean,
  ): StarforcePerStarStatsDto[] {
    const stats: StarforcePerStarStatsDto[] = [];

    for (let star = currentStars; star < targetStars; star++) {
      const rates = getStarforceRates(star);
      let cost = calculateAttemptCost(
        star,
        itemLevel,
        safeguardEnabled,
        events,
        server,
      );

      // Apply Yohi's luck to individual costs
      if (isYohiActive) {
        cost *= 0.5;
      }

      // Apply safeguard modifications to rates for display
      let { success, maintain, decrease, boom } = rates;

      if (safeguardEnabled && star >= 12 && star <= 16) {
        if (decrease > 0) {
          decrease = decrease + boom;
        } else {
          maintain = maintain + boom;
        }
        boom = 0;
      }

      // Apply star catching bonus for display
      if (events.starCatching) {
        success = Math.min(1, success * 1.05);
        const leftOver = 1 - success;

        if (decrease === 0) {
          maintain = (maintain * leftOver) / (maintain + boom);
          boom = leftOver - maintain;
        } else {
          decrease = (decrease * leftOver) / (decrease + boom);
          boom = leftOver - decrease;
        }
      }

      stats.push({
        star,
        successRate: Math.round(success * 1000) / 10, // Convert to percentage with 1 decimal
        boomRate: Math.round(boom * 1000) / 10,
        cost: Math.round(cost),
        maintainRate: Math.round(maintain * 1000) / 10,
        decreaseRate: Math.round(decrease * 1000) / 10,
      });
    }

    return stats;
  }

  /**
   * Calculate starforce costs for multiple equipment items in bulk
   */
  calculateBulk(calculations: StarforceCostRequestDto[]): {
    results: StarforceCostResponseDto[];
    summary: {
      totalExpectedCost: number;
      totalExpectedAttempts: number;
      totalCalculations: number;
    };
  } {
    const results: StarforceCostResponseDto[] = [];
    let totalExpectedCost = 0;
    let totalExpectedAttempts = 0;

    // Process each calculation
    for (const calculation of calculations) {
      const result = this.calculateStarforceCost(calculation);
      results.push(result);
      totalExpectedCost += result.averageCost;
      // Calculate attempts from average cost and cost per attempt
      totalExpectedAttempts += result.averageCost / result.costPerAttempt;
    }

    return {
      results,
      summary: {
        totalExpectedCost: Math.round(totalExpectedCost),
        totalExpectedAttempts: Math.round(totalExpectedAttempts),
        totalCalculations: calculations.length,
      },
    };
  }
}
