import { Module } from '@nestjs/common';
import { CharacterEquipmentService } from './character-equipment.service';
import { CharacterEquipmentController } from './character-equipment.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CharacterEquipmentController],
  providers: [CharacterEquipmentService],
  exports: [CharacterEquipmentService],
})
export class CharacterEquipmentModule {}
