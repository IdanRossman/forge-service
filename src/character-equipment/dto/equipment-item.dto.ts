import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { EquipmentSlot } from '../interfaces/character-equipment.interface';

export class EquipmentItemDto {
  @ApiProperty({
    description: 'Equipment slot name',
    enum: EquipmentSlot,
    example: 'weapon',
  })
  @IsEnum(EquipmentSlot)
  slot_name: EquipmentSlot;

  @ApiProperty({
    description: 'Equipment ID from equipment catalog',
    example: 123,
  })
  @IsInt()
  equipment_id: number;

  @ApiPropertyOptional({
    description: 'Current starforce level (0-25)',
    example: 17,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(25)
  current_starforce?: number;

  @ApiPropertyOptional({
    description: 'Target starforce level (0-25)',
    example: 22,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(25)
  target_starforce?: number;

  @ApiPropertyOptional({
    description: 'Current potential stat lines',
    example: '+33% boss damage, +9% STR',
  })
  @IsOptional()
  @IsString()
  current_potential?: string;

  @ApiPropertyOptional({
    description: 'Target potential stat lines',
    example: '+40% boss damage, +12% STR, +9% all stats',
  })
  @IsOptional()
  @IsString()
  target_potential?: string;
}
