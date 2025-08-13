import { Injectable } from '@nestjs/common';
import {
  EventConfiguration,
  StarForceCalculation,
  calculateStarForce as utilsCalculateStarForce,
  calculateAttemptCost as utilsCalculateAttemptCost,
} from '../services/starforce-calculation.utils';
import { StarforceCalculationStrategy } from './starforce-strategy.interface';

@Injectable()
export class LegacyStarforceStrategy implements StarforceCalculationStrategy {
  calculateStarForce(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
    events: EventConfiguration = {},
    returnCostResults = false,
  ): StarForceCalculation {
    return utilsCalculateStarForce(
      this,
      itemLevel,
      currentLevel,
      targetLevel,
      events,
      returnCostResults,
    );
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

  calculateAttemptCost(
    currentStar: number,
    itemLevel: number,
    safeguard: boolean,
    events: EventConfiguration,
  ): number {
    return utilsCalculateAttemptCost(
      this,
      currentStar,
      itemLevel,
      safeguard,
      events,
    );
  }

  getMaxStars(): number {
    return 25;
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
