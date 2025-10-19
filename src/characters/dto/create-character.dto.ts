import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EquipmentItemDto } from '../../character-equipment/dto/equipment-item.dto';

export class CreateCharacterDto {
  @ApiProperty({ description: 'Character name', example: 'MyBishop' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Character job class',
    example: 'bishop',
  })
  @IsString()
  job: string;

  @ApiPropertyOptional({
    description: 'Character level (1-300)',
    example: 250,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  level?: number;

  @ApiPropertyOptional({
    description: 'Equipment to equip on character creation',
    type: [EquipmentItemDto],
    example: [
      {
        slot_name: 'weapon',
        equipment_id: 123,
        current_starforce: 17,
        target_starforce: 22,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  equipment?: EquipmentItemDto[];
}
