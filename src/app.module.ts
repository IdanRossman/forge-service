import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StarforceCostModule } from './starforce-cost';
import { PotentialCostModule } from './potential-cost';
import { DatabaseModule } from './database';
import { EquipmentModule } from './equipment/equipment.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    DatabaseModule,
    StarforceCostModule,
    PotentialCostModule,
    EquipmentModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
