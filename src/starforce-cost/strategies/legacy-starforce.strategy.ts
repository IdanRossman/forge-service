import { Injectable } from '@nestjs/common';
import {
  EventConfiguration,
  StarForceCalculation,
  getBaseCost,
  performEnhancementExperiment,
} from '../services/starforce-calculation.utils';
import { StarforceCalculationStrategy } from './starforce-strategy.interface';

@Injectable()
export class LegacyStarforceStrategy implements StarforceCalculationStrategy {
  calculateStarForce(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
    events: {
      starCatching?: boolean;
      safeguard?: boolean;
      thirtyOff?: boolean;
      fiveTenFifteen?: boolean;
    } = {},
    returnCostResults = false,
  ): StarForceCalculation {
    const { safeguard = false } = events || {};

    if (!this.inputValidation(itemLevel, currentLevel, targetLevel)) {
      return {
        currentLevel,
        targetLevel,
        averageCost: 0,
        medianCost: 0,
        p75Cost: 0,
        averageBooms: 0,
        medianBooms: 0,
        p75Booms: 0,
      };
    }

    const trials = targetLevel <= 22 ? 1000 : 250;
    const costResults: number[] = [];
    const boomResults: number[] = [];

    for (let i = 0; i < trials; i++) {
      // Each trial gets both meso and boom data from the same experiment
      const { totalCost, totalBooms } = performEnhancementExperiment(
        currentLevel,
        targetLevel,
        itemLevel,
        events,
        safeguard,
        this,
      );
      costResults.push(totalCost);
      boomResults.push(totalBooms);
    }

    // Calculate average values
    const avgCost = costResults.reduce((sum, cost) => sum + cost, 0) / trials;
    const avgBooms =
      boomResults.reduce((sum, booms) => sum + booms, 0) / trials;

    // Calculate median values
    const sortedCosts = [...costResults].sort((a, b) => a - b);
    const sortedBooms = [...boomResults].sort((a, b) => a - b);

    const medianCost =
      trials % 2 === 0
        ? (sortedCosts[trials / 2 - 1] + sortedCosts[trials / 2]) / 2
        : sortedCosts[Math.floor(trials / 2)];

    const medianBooms =
      trials % 2 === 0
        ? (sortedBooms[trials / 2 - 1] + sortedBooms[trials / 2]) / 2
        : sortedBooms[Math.floor(trials / 2)];

    // Calculate 75th percentile values
    const p75Index = Math.floor(trials * 0.75);
    const p75Cost = sortedCosts[p75Index];
    const p75Booms = sortedBooms[p75Index];

    return {
      currentLevel,
      targetLevel,
      averageCost: Math.round(avgCost),
      averageBooms: Math.round(avgBooms * 100) / 100,
      medianCost: Math.round(medianCost),
      medianBooms: Math.round(medianBooms * 100) / 100,
      p75Cost: Math.round(p75Cost),
      p75Booms: Math.round(p75Booms * 100) / 100,
      costResults: returnCostResults ? costResults : undefined,
      boomResults: returnCostResults ? boomResults : undefined,
    };
  }

  getStarforceRates(currentStar: number): {
    success: number;
    maintain: number;
    decrease: number;
    boom: number;
  } {
    const rates: { [key: number]: [number, number, number, number] } = {
      0: [0.95, 0.05, 0, 0],
      1: [0.9, 0.1, 0, 0],
      2: [0.85, 0.15, 0, 0],
      3: [0.85, 0.15, 0, 0],
      4: [0.8, 0.2, 0, 0],
      5: [0.75, 0.25, 0, 0],
      6: [0.7, 0.3, 0, 0],
      7: [0.65, 0.35, 0, 0],
      8: [0.6, 0.4, 0, 0],
      9: [0.55, 0.45, 0, 0],
      10: [0.5, 0.5, 0, 0],
      11: [0.45, 0.55, 0, 0],
      12: [0.4, 0.6, 0, 0],
      13: [0.35, 0.65, 0, 0],
      14: [0.3, 0.7, 0, 0],
      15: [0.3, 0.679, 0, 0.021],
      16: [0.3, 0, 0.679, 0.021],
      17: [0.3, 0, 0.679, 0.021],
      18: [0.3, 0, 0.672, 0.028],
      19: [0.3, 0, 0.672, 0.028],
      20: [0.3, 0.63, 0, 0.07],
      21: [0.3, 0, 0.63, 0.07],
      22: [0.03, 0, 0.776, 0.194],
      23: [0.02, 0, 0.686, 0.294],
      24: [0.01, 0, 0.594, 0.396],
      25: [0.01, 0, 0.594, 0.396],
    };

    const [success, maintain, decrease, boom] = rates[currentStar] || [
      0.3, 0.4, 0, 0.3,
    ];

    return { success, maintain, decrease, boom };
  }

  getSafeguardMultiplierIncrease(currentStar: number): number {
    if (currentStar >= 15 && currentStar <= 16) {
      return 1;
    }
    return 0;
  }

  getSafeguardStars(currentStar: number): boolean {
    return currentStar >= 15 && currentStar <= 16;
  }

  getBaseCost(currentStar: number, itemLevel: number): number {
    return getBaseCost(currentStar, itemLevel);
  }

  calculateAttemptCost(
    currentStar: number,
    itemLevel: number,
    safeguard: boolean,
    events: EventConfiguration,
  ): number {
    let multiplier = 1;

    // 30% off event
    if (events.thirtyOff) {
      multiplier -= 0.3;
    }

    // Safeguard cost increase
    if (safeguard) {
      multiplier += this.getSafeguardMultiplierIncrease(currentStar);
    }

    const cost = getBaseCost(currentStar, itemLevel) * multiplier;
    return Math.round(cost);
  }

  getMaxStars(): number {
    return 25;
  }

  supportsStarLevel(starLevel: number): boolean {
    return starLevel <= 25;
  }

  inputValidation(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
  ): boolean {
    return (
      itemLevel > 0 &&
      currentLevel >= 0 &&
      targetLevel > currentLevel &&
      targetLevel <= 25
    );
  }
}
