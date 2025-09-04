import { Module } from '@nestjs/common';
import { PotentialCostController } from './potential-cost.controller';
import {
  PotentialService,
  PotentialCalculationService,
  PotentialCostService,
  CubeRatesDataService,
} from './services';

@Module({
  controllers: [PotentialCostController],
  providers: [
    PotentialService,
    PotentialCalculationService,
    PotentialCostService,
    CubeRatesDataService,
  ],
  exports: [
    PotentialService,
    PotentialCalculationService,
    PotentialCostService,
    CubeRatesDataService,
  ],
})
export class PotentialCostModule {}
