import { Module } from '@nestjs/common';
import { StarforceCostService } from './services/starforce-cost.service';
import { StarforceOptimizationService } from './services/starforce-optimization.service';
import { StarforceCostController } from './starforce-cost.controller';
import { StarForceCalculationService } from './services/starforce-calculation.service';
import { LuckAnalysisService } from './services/luck-analysis.service';

@Module({
  controllers: [StarforceCostController],
  providers: [
    StarforceCostService,
    StarforceOptimizationService,
    StarForceCalculationService,
    LuckAnalysisService,
  ],
  exports: [
    StarforceCostService,
    StarforceOptimizationService,
    StarForceCalculationService,
    LuckAnalysisService,
  ],
})
export class StarforceCostModule {}
