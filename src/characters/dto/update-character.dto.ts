import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateCharacterDto {
  @ApiPropertyOptional({ description: 'Character name', example: 'MyBishop' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Character job class',
    example: 'bishop',
  })
  @IsOptional()
  @IsString()
  job?: string;

  @ApiPropertyOptional({
    description: 'Character level (1-300)',
    example: 250,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  level?: number;
}
