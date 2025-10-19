import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EquipmentItemDto } from './equipment-item.dto';

export class BulkEquipDto {
  @ApiProperty({
    description: 'Array of equipment items to equip',
    type: [EquipmentItemDto],
    example: [
      {
        slot_name: 'weapon',
        equipment_id: 123,
        current_starforce: 17,
        target_starforce: 22,
      },
      {
        slot_name: 'hat',
        equipment_id: 456,
        current_starforce: 22,
        target_starforce: 22,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  equipment: EquipmentItemDto[];
}
