import { Module } from '@nestjs/common';
import { StarforceCostService } from './services/starforce-cost.service';
import { StarforceCostController } from './starforce-cost.controller';
import { StarForceCalculationService } from './services/starforce-calculation.service';
import { LuckAnalysisService } from './services/luck-analysis.service';

@Module({
  controllers: [StarforceCostController],
  providers: [
    StarforceCostService,
    StarForceCalculationService,
    LuckAnalysisService,
  ],
  exports: [
    StarforceCostService,
    StarForceCalculationService,
    LuckAnalysisService,
  ],
})
export class StarforceCostModule {}
