import { Injectable } from '@nestjs/common';
import { CubeType, PotentialTier } from '../contracts/potential-enums';

// Cube costs matching the cubes.js constants
const CUBE_COSTS: Record<CubeType, number> = {
  [CubeType.RED]: 12000000,
  [CubeType.BLACK]: 22000000,
  [CubeType.MASTER]: 7500000,
  [CubeType.MEISTER]: 0, // Not specified in original, assuming 0
  [CubeType.OCCULT]: 0, // Free cube
};

// Tier up rates - matches the tier_rates in cubes.js
const TIER_RATES: Record<CubeType, Record<number, number>> = {
  [CubeType.OCCULT]: {
    0: 0.009901,
  },
  [CubeType.MASTER]: {
    0: 0.1184,
    1: 0.0381,
  },
  [CubeType.MEISTER]: {
    0: 0.1163,
    1: 0.0879,
    2: 0.0459,
  },
  [CubeType.RED]: {
    0: 0.14,
    1: 0.06,
    2: 0.025,
  },
  [CubeType.BLACK]: {
    0: 0.17,
    1: 0.11,
    2: 0.05,
  },
};

// DMT tier up rates - matches tier_rates_DMT in cubes.js
const TIER_RATES_DMT: Record<CubeType, Record<number, number>> = {
  [CubeType.OCCULT]: TIER_RATES[CubeType.OCCULT],
  [CubeType.MASTER]: TIER_RATES[CubeType.MASTER],
  [CubeType.MEISTER]: TIER_RATES[CubeType.MEISTER],
  [CubeType.RED]: {
    0: 0.14 * 2,
    1: 0.06 * 2,
    2: 0.025 * 2,
  },
  [CubeType.BLACK]: {
    0: 0.17 * 2,
    1: 0.11 * 2,
    2: 0.05 * 2,
  },
};

// Geometric distribution statistics
interface GeometricStats {
  mean: number;
  median: number;
  seventyFifth: number;
  eightyFifth: number;
  ninetyFifth: number;
}

@Injectable()
export class PotentialCostService {
  // Get cube cost by type
  public getCubeCost(cubeType: CubeType): number {
    return CUBE_COSTS[cubeType];
  }

  // Get reveal cost constant based on item level
  public getRevealCostConstant(itemLevel: number): number {
    if (itemLevel < 30) return 0;
    if (itemLevel <= 70) return 0.5;
    if (itemLevel <= 120) return 2.5;
    return 20;
  }

  // Calculate cubing cost (cube cost + reveal cost)
  public calculateCubingCost(
    cubeType: CubeType,
    itemLevel: number,
    totalCubeCount: number,
  ): number {
    const cubeCost = this.getCubeCost(cubeType);
    const revealCostConst = this.getRevealCostConstant(itemLevel);
    const revealPotentialCost = revealCostConst * itemLevel ** 2;
    return cubeCost * totalCubeCount + totalCubeCount * revealPotentialCost;
  }

  // Calculate geometric distribution quantiles
  private calculateGeometricStats(probability: number): GeometricStats {
    if (probability <= 0 || probability >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    const mean = 1 / probability;
    const median = Math.ceil(Math.log(0.5) / Math.log(1 - probability));
    const seventyFifth = Math.ceil(Math.log(0.25) / Math.log(1 - probability));
    const eightyFifth = Math.ceil(Math.log(0.15) / Math.log(1 - probability));
    const ninetyFifth = Math.ceil(Math.log(0.05) / Math.log(1 - probability));

    return {
      mean,
      median,
      seventyFifth,
      eightyFifth,
      ninetyFifth,
    };
  }

  // Get tier upgrade costs
  public getTierUpgradeCosts(
    currentTier: PotentialTier,
    desiredTier: PotentialTier,
    cubeType: CubeType,
    isDMT = false,
  ): GeometricStats {
    const tierRates = isDMT ? TIER_RATES_DMT : TIER_RATES;
    const totalStats: GeometricStats = {
      mean: 0,
      median: 0,
      seventyFifth: 0,
      eightyFifth: 0,
      ninetyFifth: 0,
    };

    for (let i = currentTier; i < desiredTier; i++) {
      const probability = tierRates[cubeType][i];
      if (!probability) {
        throw new Error(`No tier up rate found for ${cubeType} from tier ${i}`);
      }

      const stats = this.calculateGeometricStats(probability);
      totalStats.mean += Math.round(stats.mean);
      totalStats.median += Math.round(stats.median);
      totalStats.seventyFifth += Math.round(stats.seventyFifth);
      totalStats.eightyFifth += Math.round(stats.eightyFifth);
      totalStats.ninetyFifth += Math.round(stats.ninetyFifth);
    }

    return totalStats;
  }

  // Calculate cost statistics from cube count and probability
  public calculateCostStatistics(
    probability: number,
    cubeType: CubeType,
    itemLevel: number,
  ): {
    averageCubes: number;
    medianCubes: number;
    percentile75Cubes: number;
    averageCost: number;
    medianCost: number;
    percentile75Cost: number;
  } {
    if (probability <= 0) {
      throw new Error('Probability must be greater than 0');
    }

    const stats = this.calculateGeometricStats(probability);

    const averageCubes = stats.mean;
    const medianCubes = stats.median;
    const percentile75Cubes = stats.seventyFifth;

    const averageCost = this.calculateCubingCost(
      cubeType,
      itemLevel,
      averageCubes,
    );
    const medianCost = this.calculateCubingCost(
      cubeType,
      itemLevel,
      medianCubes,
    );
    const percentile75Cost = this.calculateCubingCost(
      cubeType,
      itemLevel,
      percentile75Cubes,
    );

    return {
      averageCubes,
      medianCubes,
      percentile75Cubes,
      averageCost,
      medianCost,
      percentile75Cost,
    };
  }

  // Calculate total cost including tier upgrades and potential achievement
  public calculateTotalCost(
    probability: number,
    cubeType: CubeType,
    itemLevel: number,
    currentTier?: PotentialTier,
    desiredTier?: PotentialTier,
    isDMT = false,
  ): {
    tierUpgradeCubes?: GeometricStats;
    potentialAchievementCubes: {
      averageCubes: number;
      medianCubes: number;
      percentile75Cubes: number;
    };
    totalCosts: {
      averageCost: number;
      medianCost: number;
      percentile75Cost: number;
    };
  } {
    let tierUpgradeCubes: GeometricStats | undefined;

    // Calculate tier upgrade costs if needed
    if (
      currentTier !== undefined &&
      desiredTier !== undefined &&
      currentTier < desiredTier
    ) {
      tierUpgradeCubes = this.getTierUpgradeCosts(
        currentTier,
        desiredTier,
        cubeType,
        isDMT,
      );
    }

    // Calculate potential achievement costs
    const potentialStats = this.calculateCostStatistics(
      probability,
      cubeType,
      itemLevel,
    );

    // Calculate total costs (tier upgrade + potential achievement)
    const tierUpgradeAvg = tierUpgradeCubes?.mean || 0;
    const tierUpgradeMedian = tierUpgradeCubes?.median || 0;
    const tierUpgrade75th = tierUpgradeCubes?.seventyFifth || 0;

    const totalAverageCubes = tierUpgradeAvg + potentialStats.averageCubes;
    const totalMedianCubes = tierUpgradeMedian + potentialStats.medianCubes;
    const total75thCubes = tierUpgrade75th + potentialStats.percentile75Cubes;

    const totalCosts = {
      averageCost: this.calculateCubingCost(
        cubeType,
        itemLevel,
        totalAverageCubes,
      ),
      medianCost: this.calculateCubingCost(
        cubeType,
        itemLevel,
        totalMedianCubes,
      ),
      percentile75Cost: this.calculateCubingCost(
        cubeType,
        itemLevel,
        total75thCubes,
      ),
    };

    return {
      tierUpgradeCubes,
      potentialAchievementCubes: {
        averageCubes: potentialStats.averageCubes,
        medianCubes: potentialStats.medianCubes,
        percentile75Cubes: potentialStats.percentile75Cubes,
      },
      totalCosts,
    };
  }
}
