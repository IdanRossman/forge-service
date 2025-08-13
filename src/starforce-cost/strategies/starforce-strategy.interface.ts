import {
  EventConfiguration,
  StarForceCalculation,
} from '../services/starforce-calculation.utils';

export interface StarforceCalculationStrategy {
  calculateStarForce(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
    events: EventConfiguration,
    returnCostResults?: boolean,
  ): StarForceCalculation;

  getStarforceRates(currentStar: number): {
    success: number;
    maintain: number;
    decrease: number;
    boom: number;
  };

  getSafeguardMultiplierIncrease(currentStar: number): number;

  getSafeguardStars(currentStar: number): boolean;

  getMaxStars(): number;

  calculateAttemptCost(
    currentStar: number,
    itemLevel: number,
    safeguard: boolean,
    events: EventConfiguration,
  ): number;

  getBaseCost?(currentStar: number, itemLevel: number): number;

  inputValidation(
    itemLevel: number,
    currentLevel: number,
    targetLevel: number,
  ): boolean;
}
