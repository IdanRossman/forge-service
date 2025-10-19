import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertEquipmentDto {
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
