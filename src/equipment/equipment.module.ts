import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EquipmentController],
})
export class EquipmentModule {}
