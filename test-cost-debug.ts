import { PotentialCostService } from './src/potential-cost/services/potential-cost.service';
import { CubeType, PotentialTier } from './src/potential-cost/contracts/potential-enums';

// Detailed cost breakdown test
const costService = new PotentialCostService();

console.log('🔍 Debug: Complete Cost Breakdown');
console.log('='.repeat(50));

// Test parameters from our legendary test
const cubeType = CubeType.RED;
const itemLevel = 200;
const currentTier = PotentialTier.RARE;
const desiredTier = PotentialTier.LEGENDARY;
const probability = 0.026425; // From our test result

console.log(`Cube Type: ${cubeType}`);
console.log(`Item Level: ${itemLevel}`);
console.log(`Current Tier: ${currentTier} (rare)`);
console.log(`Desired Tier: ${desiredTier} (legendary)`);
console.log(`Probability: ${(probability * 100).toFixed(4)}%`);
console.log('');

// 1. Calculate tier upgrade costs
console.log('1️⃣ TIER UPGRADE COSTS');
console.log('-'.repeat(30));
const tierUpgradeCosts = costService.getTierUpgradeCosts(
  currentTier,
  desiredTier,
  cubeType,
  false
);

console.log(`Tier upgrade cubes needed:`);
console.log(`- Average: ${tierUpgradeCosts.mean} cubes`);
console.log(`- Median: ${tierUpgradeCosts.median} cubes`);
console.log(`- 75th Percentile: ${tierUpgradeCosts.seventyFifth} cubes`);
console.log('');

// 2. Calculate potential achievement costs
console.log('2️⃣ POTENTIAL ACHIEVEMENT COSTS');
console.log('-'.repeat(30));
const potentialStats = costService.calculateCostStatistics(
  probability,
  cubeType,
  itemLevel
);

console.log(`Potential achievement cubes needed:`);
console.log(`- Average: ${potentialStats.averageCubes} cubes`);
console.log(`- Median: ${potentialStats.medianCubes} cubes`);
console.log(`- 75th Percentile: ${potentialStats.percentile75Cubes} cubes`);
console.log('');

// 3. Calculate total
console.log('3️⃣ TOTAL COSTS');
console.log('-'.repeat(30));
const totalAverageCubes = tierUpgradeCosts.mean + potentialStats.averageCubes;
const totalMedianCubes = tierUpgradeCosts.median + potentialStats.medianCubes;
const total75thCubes = tierUpgradeCosts.seventyFifth + potentialStats.percentile75Cubes;

const costPerCube = costService.getCubeCost(cubeType) + 
  (costService.getRevealCostConstant(itemLevel) * itemLevel ** 2);

console.log(`Total cubes needed:`);
console.log(`- Average: ${totalAverageCubes} cubes`);
console.log(`- Median: ${totalMedianCubes} cubes`);
console.log(`- 75th Percentile: ${total75thCubes} cubes`);
console.log('');

console.log(`Cost per cube: ${costPerCube.toLocaleString()} mesos`);
console.log('');

console.log(`Total costs:`);
console.log(`- Average: ${(totalAverageCubes * costPerCube).toLocaleString()} mesos`);
console.log(`- Median: ${(totalMedianCubes * costPerCube).toLocaleString()} mesos`);
console.log(`- 75th Percentile: ${(total75thCubes * costPerCube).toLocaleString()} mesos`);
