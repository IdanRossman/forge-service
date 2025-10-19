import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StarforceCostModule } from './starforce-cost';
import { PotentialCostModule } from './potential-cost';
import { DatabaseModule } from './database';
import { EquipmentModule } from './equipment/equipment.module';
import { TemplatesModule } from './templates/templates.module';
import { CharactersModule } from './characters/characters.module';
import { CharacterEquipmentModule } from './character-equipment/character-equipment.module';

@Module({
  imports: [
    DatabaseModule,
    StarforceCostModule,
    PotentialCostModule,
    EquipmentModule,
    TemplatesModule,
    CharactersModule,
    CharacterEquipmentModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
