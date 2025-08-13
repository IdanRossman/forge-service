import { Injectable } from '@nestjs/common';
import {
  EventConfiguration,
  StarForceCalculation,
  calculateStarForce as utilsCalculateStarForce,
  calculateAttemptCost as utilsCalculateAttemptCost,
} from '../services/starforce-calculation.utils';
import { StarforceCalculationStrategy } from './starforce-strategy.interface';

@Injectable()
export class NewKmsStarforceStrategy implements StarforceCalculationStrategy {
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
      16: [0.3, 0.679, 0, 0.021],
      17: [0.15, 0.782, 0, 0.068],
      18: [0.15, 0.782, 0, 0.068],
      19: [0.15, 0.765, 0, 0.085],
      20: [0.3, 0.595, 0, 0.105],
      21: [0.15, 0.7225, 0, 0.1275],
      22: [0.15, 0.68, 0, 0.17],
      23: [0.1, 0.72, 0, 0.18],
      24: [0.1, 0.72, 0, 0.18],
      25: [0.1, 0.72, 0, 0.18],
      26: [0.07, 0.744, 0, 0.186],
      27: [0.05, 0.76, 0, 0.19],
      28: [0.03, 0.776, 0, 0.194],
      29: [0.01, 0.792, 0, 0.198],
    };

    const [success, maintain, decrease, boom] = rates[currentStar] || [
      0.01, 0.792, 0, 0.198,
    ];

    return { success, maintain, decrease, boom };
  }

  getSafeguardMultiplierIncrease(currentStar: number): number {
    if (currentStar >= 15 && currentStar <= 17) {
      return 2;
    }
    return 0;
  }

  getSafeguardStars(currentStar: number): boolean {
    return currentStar >= 15 && currentStar <= 17;
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
    return 30;
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
      targetLevel <= 30
    );
  }
}
