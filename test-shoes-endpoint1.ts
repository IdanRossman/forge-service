import { PotentialService } from './src/potential-cost/services/potential.service';
import { CubeRatesDataService } from './src/potential-cost/services/cube-rates-data.service';
import { PotentialCalculationService } from './src/potential-cost/services/potential-calculation.service';
import { PotentialCostService } from './src/potential-cost/services/potential-cost.service';
import { ItemType } from './src/potential-cost/contracts/potential-enums';

async function test() {
  const cubeRatesService = new CubeRatesDataService();
  const calculationService = new PotentialCalculationService();
  const costService = new PotentialCostService();
  const service = new PotentialService(calculationService, costService, cubeRatesService);
  
  console.log('=== Endpoint 1: Get Input Options for Shoes Level 200 Legendary ===');
  
  const result = service.getInputOptions({
    itemType: ItemType.SHOES,
    itemLevel: 200
  });
  
  console.log('Available input options for shoes:');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
