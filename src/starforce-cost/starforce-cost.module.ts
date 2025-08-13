import { Module } from '@nestjs/common';
import { StarforceCostService } from './services/starforce-cost.service';
import { StarforceOptimizationService } from './services/starforce-optimization.service';
import { StarforceCostController } from './starforce-cost.controller';
import { StarForceCalculationService } from './services/starforce-calculation.service';
import { StarforceStatCalculationService } from './services/starforce-stat-calculation.service';
import { LuckAnalysisService } from './services/luck-analysis.service';
import { LegacyStarforceStrategy } from './strategies';
import { NewKmsStarforceStrategy } from './strategies/new-kms-starforce.strategy';

@Module({
  controllers: [StarforceCostController],
  providers: [
    StarforceCostService,
    StarforceOptimizationService,
    StarForceCalculationService,
    StarforceStatCalculationService,
    LuckAnalysisService,
    LegacyStarforceStrategy,
    NewKmsStarforceStrategy,
  ],
  exports: [
    StarforceCostService,
    StarforceOptimizationService,
    StarForceCalculationService,
    StarforceStatCalculationService,
    LuckAnalysisService,
  ],
})
export class StarforceCostModule {}
