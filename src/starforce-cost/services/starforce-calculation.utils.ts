/**
 * Starforce calculation utilities based on Brandon's proven working calculator logic
 */

export type Server = 'gms' | 'kms' | 'msea';
export type ItemType = 'regular' | 'superior';

export interface EventConfiguration {
  thirtyOff?: boolean;
  fiveTenFifteen?: boolean;
  starCatching?: boolean;
  mvpDiscount?: number;
  yohiTapEvent?: boolean;
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
 * Generate enhancement recommendations
 */
export function generateRecommendations(
  currentStars: number,
  targetStars: number,
  averageCost: number,
  averageBooms: number,
  events: EventConfiguration,
  safeguardEnabled: boolean,
): string[] {
  const recommendations: string[] = [];

  if (averageBooms > 0.5 && !safeguardEnabled && targetStars >= 15) {
    recommendations.push(
      'Consider using Safeguard for stars 15-16 to prevent destruction.',
    );
  }

  if (averageCost > 500000000 && !events.thirtyOff) {
    recommendations.push(
      'Wait for a 30% Off event to significantly reduce costs.',
    );
  }

  const sparesNeeded = Math.ceil(averageBooms);
  if (sparesNeeded > 0) {
    recommendations.push(
      `Expected ${averageBooms.toFixed(1)} booms - prepare ${sparesNeeded} spare item${sparesNeeded > 1 ? 's' : ''}.`,
    );
  }

  if (targetStars >= 22 && !events.starCatching) {
    recommendations.push(
      'Star Catching is highly recommended for 22+ star attempts.',
    );
  }

  if (events.yohiTapEvent) {
    recommendations.push(
      '🍀 Yohi Tap Event is active - all costs and spares have been halved due to supernatural luck!',
    );
  }

  return recommendations;
}

/**
 * Format mesos for display
 */
export function formatMesos(amount: number): string {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
}
