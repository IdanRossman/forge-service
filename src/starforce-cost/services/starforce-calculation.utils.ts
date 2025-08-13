import { StarforceCalculationStrategy } from '../strategies/starforce-strategy.interface';

// Quickselect algorithm for efficient percentile calculation - O(n) vs O(n log n)
function quickSelect(arr: number[], k: number): number {
  if (arr.length === 1) return arr[0];
  
  const pivot = arr[Math.floor(Math.random() * arr.length)];
  const lows = arr.filter(x => x < pivot);
  const highs = arr.filter(x => x > pivot);
  const pivots = arr.filter(x => x === pivot);
  
  if (k < lows.length) {
    return quickSelect(lows, k);
  } else if (k < lows.length + pivots.length) {
    return pivot;
  } else {
    return quickSelect(highs, k - lows.length - pivots.length);
  }
}

// Cache for rate calculations to avoid repeated computations
const rateCache = new Map<string, { success: number; maintain: number; decrease: number; boom: number }>();

// Cache for cost calculations
const costCache = new Map<string, number>();

export interface EventConfiguration {
  thirtyOff?: boolean;
  fiveTenFifteen?: boolean;
  starCatching?: boolean;
  boomReduction?: boolean;
  safeguard?: boolean;
}

export interface StarForceCalculation {
  currentLevel: number;
  targetLevel: number;
  averageCost: number;
  medianCost: number;
  p75Cost: number;
  averageBooms: number;
  medianBooms: number;
  p75Booms: number;
  costResults?: number[];
  boomResults?: number[];
}

export type StarforceOutcome = 'Success' | 'Maintain' | 'Decrease' | 'Boom';

export function makeMesoFn(
  divisor: number,
  currentStarExp = 2.7,
  extraMult = 1,
) {
  return (currentStar: number, itemLevel: number) =>
    100 *
    Math.round(
      (extraMult * itemLevel ** 3 * (currentStar + 1) ** currentStarExp) /
        divisor +
        10,
    );
}

export function saviorMesoFn(currentStar: number) {
  switch (currentStar) {
    case 11:
      return makeMesoFn(22000);
    case 12:
      return makeMesoFn(15000);
    case 13:
      return makeMesoFn(11000);
    case 14:
      return makeMesoFn(7500);
    default:
      return preSaviorMesoFn(currentStar);
  }
}

export function preSaviorMesoFn(currentStar: number) {
  if (currentStar >= 15) return makeMesoFn(20000);
  if (currentStar >= 10) return makeMesoFn(40000);
  return makeMesoFn(2500, 1);
}

export function saviorCost(currentStar: number, itemLevel: number): number {
  const mesoFn = saviorMesoFn(currentStar);
  return mesoFn(currentStar, itemLevel);
}

export function getBaseCost(currentStar: number, itemLevel: number): number {
  return saviorCost(currentStar, itemLevel);
}

/**
 * Perform a single enhancement experiment
 */
export function performEnhancementExperiment(
  currentStars: number,
  targetStars: number,
  itemLevel: number,
  events: EventConfiguration,
  safeguard: boolean,
  strategy: StarforceCalculationStrategy,
): { totalCost: number; totalBooms: number } {
  let currentStar = currentStars;
  let totalCost = 0;
  let totalBooms = 0;
  let decreaseCount = 0;

  while (currentStar < targetStars) {
    const chanceTime = decreaseCount === 2;
    totalCost += strategy.calculateAttemptCost(
      currentStar,
      itemLevel,
      safeguard,
      events,
    );

    if (chanceTime) {
      currentStar++;
      decreaseCount = 0;
    } else {
      const outcome = determineOutcome(
        currentStar,
        events,
        safeguard,
        strategy,
      );

      if (outcome === 'Success') {
        currentStar++;
        decreaseCount = 0;
      } else if (outcome === 'Decrease') {
        currentStar--;
        decreaseCount++;
      } else if (outcome === 'Maintain') {
        decreaseCount = 0;
      } else if (outcome === 'Boom') {
        currentStar = 12;
        totalBooms++;
        decreaseCount = 0;
      }
    }
  }

  return { totalCost, totalBooms };
}

export function determineOutcome(
  currentStar: number,
  events: EventConfiguration,
  safeguard: boolean,
  strategy: StarforceCalculationStrategy,
): StarforceOutcome {
  if (
    events.fiveTenFifteen &&
    (currentStar === 5 || currentStar === 10 || currentStar === 15)
  ) {
    return 'Success';
  }

  // Create cache key for this specific combination
  const cacheKey = `${currentStar}-${!!events.starCatching}-${!!events.boomReduction}-${safeguard && strategy.getSafeguardStars(currentStar)}`;
  
  let rates = rateCache.get(cacheKey);
  if (!rates) {
    let { success, maintain, decrease, boom } =
      strategy.getStarforceRates(currentStar);

    // Safeguard removes boom chance
    if (safeguard && strategy.getSafeguardStars(currentStar)) {
      if (decrease > 0) {
        decrease = decrease + boom;
      } else {
        maintain = maintain + boom;
      }
      boom = 0;
    }

    // Star catching (5% multiplicative)
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

    // Boom reduction event
    if (events.boomReduction && currentStar <= 21) {
      const boomReduction = boom * 0.3;
      boom = boom * 0.7;
      maintain = maintain + boomReduction;
    }

    rates = { success, maintain, decrease, boom };
    rateCache.set(cacheKey, rates);
  }

  const outcome = Math.random();
  if (outcome <= rates.success) return 'Success';
  if (outcome <= rates.success + rates.maintain) return 'Maintain';
  if (outcome <= rates.success + rates.maintain + rates.decrease) return 'Decrease';
  return 'Boom';
}

/**
 * Generic starforce calculation function that can be used by any strategy
 */
export function calculateStarForce(
  strategy: StarforceCalculationStrategy,
  itemLevel: number,
  currentLevel: number,
  targetLevel: number,
  events: EventConfiguration = {},
  returnCostResults = false,
): StarForceCalculation {
  const { safeguard = false } = events || {};

  if (!strategy.inputValidation(itemLevel, currentLevel, targetLevel)) {
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

  // Optimized trial count: fewer trials for very high stars
  const trials = targetLevel <= 22 ? 1000 : targetLevel <= 25 ? 250 : 100;
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
      strategy,
    );
    costResults.push(totalCost);
    boomResults.push(totalBooms);
  }

  // Calculate average values
  const avgCost = costResults.reduce((sum, cost) => sum + cost, 0) / trials;
  const avgBooms = boomResults.reduce((sum, booms) => sum + booms, 0) / trials;

  // Optimized: Use quickselect for percentiles - O(n) vs O(n log n) sorting
  const medianIndex = Math.floor(trials / 2);
  const p75Index = Math.floor(trials * 0.75);
  
  const medianCost = quickSelect([...costResults], medianIndex);
  const medianBooms = quickSelect([...boomResults], medianIndex);
  const p75Cost = quickSelect([...costResults], p75Index);
  const p75Booms = quickSelect([...boomResults], p75Index);

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


/**
 * Generic attempt cost calculation function that can be used by any strategy
 */
export function calculateAttemptCost(
  strategy: StarforceCalculationStrategy,
  currentStar: number,
  itemLevel: number,
  safeguard: boolean,
  events: EventConfiguration,
): number {
  // Create cache key for cost calculation
  const cacheKey = `${currentStar}-${itemLevel}-${safeguard}-${!!events.thirtyOff}`;
  
  let cost = costCache.get(cacheKey);
  if (cost === undefined) {
    let multiplier = 1;

    // 30% off event
    if (events.thirtyOff) {
      multiplier -= 0.3;
    }

    // Safeguard cost increase
    if (safeguard) {
      multiplier += strategy.getSafeguardMultiplierIncrease(currentStar);
    }

    cost = Math.round(getBaseCost(currentStar, itemLevel) * multiplier);
    costCache.set(cacheKey, cost);
  }

  return cost;
}
