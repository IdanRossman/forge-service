/**
 * Starforce calculation utilities based on Brandon's proven working calculator logic
 */

export type Server = 'gms' | 'kms' | 'msea';

export interface EventConfiguration {
  thirtyOff?: boolean;
  fiveTenFifteen?: boolean;
  starCatching?: boolean;
  mvpDiscount?: number;
  yohiTapEvent?: boolean;
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
  // Add cost results for percentile analysis (optional)
  costResults?: number[];
  // Add boom results for spare planning (optional)
  boomResults?: number[];
}

export type StarforceOutcome = 'Success' | 'Maintain' | 'Decrease' | 'Boom';

/**
 * Brandon's proven meso calculation functions
 */
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

export function getBaseCost(
  server: Server,
  currentStar: number,
  itemLevel: number,
): number {
  return saviorCost(currentStar, itemLevel);
}

export function getSafeguardMultiplierIncrease(
  currentStar: number,
  server: Server,
): number {
  if (server === 'kms' && currentStar >= 15 && currentStar <= 17) {
    return 2;
  }
  if (server !== 'kms' && currentStar >= 15 && currentStar <= 16) {
    return 1;
  }
  return 0;
}

/**
 * Calculate attempt cost with all modifiers applied
 */
export function calculateAttemptCost(
  currentStar: number,
  itemLevel: number,
  boomProtect: boolean,
  events: EventConfiguration,
  server: Server,
  chanceTime = false,
): number {
  let multiplier = 1;

  // MVP discounts (for stars <= 15)
  if (events.mvpDiscount && events.mvpDiscount > 0 && currentStar <= 15) {
    multiplier = multiplier - events.mvpDiscount;
  }

  // 30% off event
  if (events.thirtyOff) {
    multiplier = multiplier - 0.3;
  }

  // Safeguard cost increase
  if (boomProtect && !chanceTime) {
    multiplier =
      multiplier + getSafeguardMultiplierIncrease(currentStar, server);
  }

  const cost = getBaseCost(server, currentStar, itemLevel) * multiplier;
  return Math.round(cost);
}

/**
 * Get Brandon's exact savior rates
 */
export function getStarforceRates(currentStar: number): {
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

/**
 * Determine outcome with all modifiers applied
 */
export function determineOutcome(
  currentStar: number,
  events: EventConfiguration,
  boomProtect: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _server: Server, // Server parameter kept for future server-specific logic
): StarforceOutcome {
  // 5/10/15 event guaranteed success
  if (
    events.fiveTenFifteen &&
    (currentStar === 5 || currentStar === 10 || currentStar === 15)
  ) {
    return 'Success';
  }

  let { success, maintain, decrease, boom } = getStarforceRates(currentStar);

  // Safeguard removes boom chance
  if (boomProtect && currentStar >= 12 && currentStar <= 16) {
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

  const outcome = Math.random();
  if (outcome <= success) return 'Success';
  if (outcome <= success + maintain) return 'Maintain';
  if (outcome <= success + maintain + decrease) return 'Decrease';
  return 'Boom';
}

/**
 * Perform a single enhancement experiment
 */
export function performEnhancementExperiment(
  currentStars: number,
  targetStars: number,
  itemLevel: number,
  events: EventConfiguration,
  boomProtect: boolean,
  server: Server,
): { totalCost: number; totalBooms: number } {
  let currentStar = currentStars;
  let totalCost = 0;
  let totalBooms = 0;
  let decreaseCount = 0;

  while (currentStar < targetStars) {
    const chanceTime = decreaseCount === 2;
    totalCost += calculateAttemptCost(
      currentStar,
      itemLevel,
      boomProtect,
      events,
      server,
      chanceTime,
    );

    if (chanceTime) {
      currentStar++;
      decreaseCount = 0;
    } else {
      const outcome = determineOutcome(
        currentStar,
        events,
        boomProtect,
        server,
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
        currentStar = 12; // Reset to 12 stars on boom
        totalBooms++;
        decreaseCount = 0;
      }
    }
  }

  return { totalCost, totalBooms };
}

/**
 * Calculate what percentile an actual cost falls into
 */
export function calculateCostPercentile(
  actualCost: number,
  costResults: number[],
): {
  percentile: number;
  luckRating: 'Very Lucky' | 'Lucky' | 'Average' | 'Unlucky' | 'Very Unlucky';
  description: string;
  betterThanPercent: number;
  worseThanPercent: number;
} {
  const sortedCosts = [...costResults].sort((a, b) => a - b);
  const totalTrials = sortedCosts.length;

  // Find how many results were worse (higher cost) than the actual cost
  const betterThanActual = sortedCosts.filter(
    (cost) => cost < actualCost,
  ).length;
  const worseThanActual = sortedCosts.filter(
    (cost) => cost > actualCost,
  ).length;

  // Calculate percentile (what percentage of results were worse than actual)
  const percentile = Math.round((betterThanActual / totalTrials) * 10000) / 100;
  const worseThanPercent =
    Math.round((worseThanActual / totalTrials) * 10000) / 100;
  const betterThanPercent = percentile;

  // Determine luck rating
  let luckRating:
    | 'Very Lucky'
    | 'Lucky'
    | 'Average'
    | 'Unlucky'
    | 'Very Unlucky';
  let description: string;

  if (percentile <= 10) {
    luckRating = 'Very Lucky';
    description = `🍀 Extremely lucky! Your cost was lower than ${percentile}% of all attempts`;
  } else if (percentile <= 25) {
    luckRating = 'Lucky';
    description = `✨ Lucky! Your cost was lower than ${percentile}% of all attempts`;
  } else if (percentile <= 75) {
    luckRating = 'Average';
    description = `📊 Average luck. Your cost was around the ${percentile}th percentile`;
  } else if (percentile <= 90) {
    luckRating = 'Unlucky';
    description = `😬 Unlucky. Your cost was higher than ${betterThanPercent}% of attempts`;
  } else {
    luckRating = 'Very Unlucky';
    description = `💸 Very unlucky! Your cost was higher than ${betterThanPercent}% of attempts`;
  }

  return {
    percentile,
    luckRating,
    description,
    betterThanPercent,
    worseThanPercent,
  };
}

/**
 * Main starforce calculation function - matches frontend implementation exactly
 */
export function calculateStarForce(
  itemLevel: number,
  currentLevel: number,
  targetLevel: number,
  events: {
    costMultiplier?: number;
    successRateBonus?: number;
    starCatching?: boolean;
    safeguard?: boolean;
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    mvpDiscount?: number;
  } = {},
  returnCostResults = false, // New parameter to control if we return full cost results
): StarForceCalculation {
  const {
    costMultiplier = 1,
    successRateBonus = 0,
    starCatching = false,
    safeguard = false,
    thirtyOff = false,
    fiveTenFifteen = false,
    mvpDiscount = 0,
  } = events || {};

  // Input validation
  if (
    currentLevel >= targetLevel ||
    itemLevel < 1 ||
    targetLevel > 25 ||
    currentLevel < 0
  ) {
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

  const trials = targetLevel <= 22 ? 1000 : 250; // Dynamic trials: more accuracy for lower stars, performance for 22+ stars
  const costResults: number[] = []; // Store all cost results for median calculation
  const boomResults: number[] = []; // Store all boom results for median calculation

  // Convert events to EventConfiguration format
  const eventConfig: EventConfiguration = {
    thirtyOff: thirtyOff || costMultiplier < 1,
    fiveTenFifteen: fiveTenFifteen || successRateBonus > 0,
    starCatching,
    mvpDiscount,
  };

  const server: Server = 'gms'; // Default to GMS

  // Run simulations using Brandon's exact algorithm
  for (let i = 0; i < trials; i++) {
    // Each trial gets both meso and boom data from the same experiment
    const { totalCost, totalBooms } = performEnhancementExperiment(
      currentLevel,
      targetLevel,
      itemLevel,
      eventConfig,
      safeguard,
      server,
    );
    costResults.push(totalCost);
    boomResults.push(totalBooms);
  }

  // Calculate average values
  const avgCost = costResults.reduce((sum, cost) => sum + cost, 0) / trials;
  const avgBooms = boomResults.reduce((sum, booms) => sum + booms, 0) / trials;

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
    // Only include cost results if requested (for percentile analysis)
    costResults: returnCostResults ? costResults : undefined,
    // Only include boom results if requested (for spare planning)
    boomResults: returnCostResults ? boomResults : undefined,
  };
}
