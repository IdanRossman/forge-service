import { Module } from '@nestjs/common';
import { StarforceCostService } from './services/starforce-cost.service';
import { StarforceCostController } from './starforce-cost.controller';

@Module({
  controllers: [StarforceCostController],
  providers: [StarforceCostService],
  exports: [StarforceCostService],
})
export class StarforceCostModule {}
