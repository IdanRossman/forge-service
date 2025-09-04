import { PotentialService } from './src/potential-cost/services/potential.service';
import { CubeRatesDataService } from './src/potential-cost/services/cube-rates-data.service';
import { PotentialCalculationService } from './src/potential-cost/services/potential-calculation.service';
import { PotentialCostService } from './src/potential-cost/services/potential-cost.service';
import { ItemType, PotentialTier, CubeType } from './src/potential-cost/contracts/potential-enums';

async function test() {
  const cubeRatesService = new CubeRatesDataService();
  const calculationService = new PotentialCalculationService();
  const costService = new PotentialCostService();
  const service = new PotentialService(calculationService, costService, cubeRatesService);
  
  console.log('=== Enhanced Item-Type Filtering Test ===');
  
  const testItems = [
    { type: ItemType.WEAPON, name: 'Weapon' },
    { type: ItemType.GLOVES, name: 'Gloves' },
    { type: ItemType.HAT, name: 'Hat' },
    { type: ItemType.SHOES, name: 'Shoes' },
    { type: ItemType.ACCESSORY, name: 'Accessory' }
  ];
  
  for (const item of testItems) {
    const options = service.getInputOptions({
      itemType: item.type,
      itemLevel: 200
    });
    console.log('\n' + item.name + ' available options:');
    console.log('Keys:', Object.keys(options.availableInputs).join(', '));
  }
}

test().catch(console.error);
