import { PotentialService } from './src/potential-cost/services/potential.service';
import { PotentialCalculationService } from './src/potential-cost/services/potential-calculation.service';
import { PotentialCostService } from './src/potential-cost/services/potential-cost.service';
import { CubeRatesDataService } from './src/potential-cost/services/cube-rates-data.service';
import { ItemType } from './src/potential-cost/contracts/potential-enums';

// Test the input options endpoint
async function testInputOptions() {
  console.log('🧪 Testing Input Options Endpoint...');
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

    // Test parameters: Shoes level 200 legendary
    const request = {
      itemType: ItemType.SHOES,
      itemLevel: 200,
    };

    console.log('📋 Request Parameters:');
    console.log(`   Item Type: ${request.itemType}`);
    console.log(`   Item Level: ${request.itemLevel}`);
    console.log('');

    // Get input options
    console.log('🔍 Getting available input options...');
    const inputOptions = potentialService.getInputOptions(request);

    console.log('');
    console.log('📊 Available Input Options:');
    console.log('='.repeat(40));
    
    // Display all available inputs
    Object.entries(inputOptions.availableInputs).forEach(([key, option]) => {
      console.log(`🔸 ${key}:`);
      console.log(`   Description: ${option.description}`);
      console.log(`   Max Possible: ${option.maxPossible}`);
      console.log(`   Increment: ${option.increment}`);
      console.log('');
    });

    console.log('✅ Input options retrieved successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
    console.error(error.stack);
  }
}

// Run the test
testInputOptions();
