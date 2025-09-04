import { PotentialCalculationService } from './src/potential-cost/services/potential-calculation.service';
import { PotentialCostService } from './src/potential-cost/services/potential-cost.service';
import { PotentialService } from './src/potential-cost/services/potential.service';
import { CubeRatesDataService } from './src/potential-cost/services/cube-rates-data.service';
import {
  PotentialTier,
  CubeType,
  ItemType,
} from './src/potential-cost/contracts/potential-enums';
import { PotentialInput } from './src/potential-cost/contracts/potential-calculation.dto';

// Test function
async function testPotentialCalculation() {
  console.log('🧪 Testing Potential Calculation...');
  console.log('='.repeat(50));

  try {
    // Initialize services
    const cubeRatesDataService = new CubeRatesDataService();
    const calculationService = new PotentialCalculationService();
    const costService = new PotentialCostService();
    const potentialService = new PotentialService(
      calculationService,
      costService,
      cubeRatesDataService,
    );

    // Test parameters: Item Type Shoes, red cubes, legendary tier, 21% Stat
    const testRequest = {
      desiredTier: PotentialTier.LEGENDARY,
      probabilityInput: {
        percStat: 21, // At least 21% stat
        lineStat: 0,
        percAllStat: 0,
        lineAllStat: 0,
        percHp: 0,
        lineHp: 0,
        percAtt: 0,
        lineAtt: 0,
        percBoss: 0,
        lineBoss: 0,
        lineIed: 0,
        lineCritDamage: 0,
        lineMeso: 0,
        lineDrop: 0,
        lineMesoOrDrop: 0,
        secCooldown: 0,
        lineAutoSteal: 0,
        lineAttOrBoss: 0,
        lineAttOrBossOrIed: 0,
        lineBossOrIed: 0,
      },
      itemType: ItemType.SHOES,
      cubeType: CubeType.RED,
      itemLevel: 200,
      currentTier: PotentialTier.LEGENDARY, // Already at legendary tier
      isDMT: false,
    };

    console.log('📋 Test Parameters:');
    console.log(`   Item Type: ${testRequest.itemType}`);
    console.log(`   Item Level: ${testRequest.itemLevel}`);
    console.log(`   Cube Type: ${testRequest.cubeType}`);
    console.log(`   Current Tier: ${testRequest.currentTier} (legendary - already at target tier)`);
    console.log(`   Desired Tier: ${testRequest.desiredTier} (legendary)`);
    console.log(`   Goal: At least 21% stat (potential achievement only)`);
    console.log('');

    // Test the calculation
    console.log('🔬 Running calculation...');
    const result = potentialService.calculatePotential(testRequest);

    console.log('');
    console.log('📊 Results:');
    console.log('='.repeat(30));
    console.log(`   Probability: ${(result.probability * 100).toFixed(4)}%`);
    console.log(`   Average Cubes: ${result.averageCubes.toFixed(1)}`);
    console.log(`   Median Cubes: ${result.medianCubes}`);
    console.log(`   75th Percentile Cubes: ${result.percentile75Cubes}`);
    console.log(`   Average Cost: ${result.averageCost.toLocaleString()} mesos`);
    console.log(`   Median Cost: ${result.medianCost.toLocaleString()} mesos`);
    console.log(`   75th Percentile Cost: ${result.percentile75Cost.toLocaleString()} mesos`);

    console.log('');
    console.log('✅ Test completed successfully!');

    // Test input options as well
    console.log('');
    console.log('📋 Testing Input Options...');
    const inputOptions = potentialService.getInputOptions({
      itemType: ItemType.SHOES,
      itemLevel: 200,
    });

    console.log(`   Available inputs for ${inputOptions.itemType} (level ${inputOptions.itemLevel}):`);
    console.log(`   - percStat: max ${inputOptions.availableInputs.percStat.maxPossible}%`);
    console.log(`   - lineStat: max ${inputOptions.availableInputs.lineStat.maxPossible} lines`);
    console.log(`   - percAtt: max ${inputOptions.availableInputs.percAtt.maxPossible}%`);
    console.log(`   - lineAtt: max ${inputOptions.availableInputs.lineAtt.maxPossible} lines`);

    console.log('');
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Run the test
testPotentialCalculation();
