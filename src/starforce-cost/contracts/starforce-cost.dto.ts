import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StarforcePerStarStatsDto {
  @ApiProperty({
    description: 'Star level',
    example: 15,
  })
  star: number;

  @ApiProperty({
    description: 'Success rate percentage for this star',
    example: 30.0,
  })
  successRate: number;

  @ApiProperty({
    description: 'Item destruction rate percentage for this star',
    example: 2.1,
  })
  boomRate: number;

  @ApiProperty({
    description: 'Enhancement cost for this star level',
    example: 150000000,
  })
  cost: number;

  @ApiPropertyOptional({
    description: 'Rate of maintaining current star level',
    example: 67.9,
  })
  maintainRate?: number;

  @ApiPropertyOptional({
    description: 'Rate of decreasing star level',
    example: 0.0,
  })
  decreaseRate?: number;
}

export class StarforceCostRequestDto {
  @ApiProperty({
    description: 'Level of the item to be enhanced',
    example: 150,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Current star level of the item',
    example: 0,
    minimum: 0,
    maximum: 25,
  })
  currentStars: number;

  @ApiProperty({
    description: 'Target star level to enhance to',
    example: 17,
    minimum: 1,
    maximum: 25,
  })
  targetStars: number;

  @ApiPropertyOptional({
    description: 'Type of item being enhanced',
    enum: ['regular', 'superior'],
    default: 'regular',
  })
  itemType?: 'regular' | 'superior';

  @ApiPropertyOptional({
    description: 'Server type for rate calculations',
    enum: ['gms', 'kms', 'msea'],
    default: 'gms',
  })
  server?: 'gms' | 'kms' | 'msea';

  @ApiPropertyOptional({
    description: 'Event configurations to apply',
    type: 'object',
    properties: {
      thirtyOff: {
        type: 'boolean',
        description: '30% off enhancement cost event',
      },
      fiveTenFifteen: {
        type: 'boolean',
        description: '5/10/15 guaranteed success event',
      },
      starCatching: {
        type: 'boolean',
        description: 'Star catching event (+5% success rate)',
      },
      mvpDiscount: {
        type: 'number',
        description: 'MVP discount percentage (0-0.3)',
        minimum: 0,
        maximum: 0.3,
      },
      yohiTapEvent: {
        type: 'boolean',
        description: '🍀 Legendary luck event (halves all costs)',
      },
    },
  })
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: number;
    yohiTapEvent?: boolean;
  };

  @ApiPropertyOptional({
    description:
      'Whether to use safeguard (prevents destruction for stars 15-16)',
    default: false,
  })
  safeguardEnabled?: boolean;
}

export class StarforceCostResponseDto {
  @ApiProperty({
    description: 'Current star level',
    example: 0,
  })
  currentLevel: number;

  @ApiProperty({
    description: 'Target star level',
    example: 17,
  })
  targetLevel: number;

  @ApiProperty({
    description: 'Average total cost in mesos',
    example: 2500000000,
  })
  averageCost: number;

  @ApiProperty({
    description: 'Average number of item destructions expected',
    example: 1.2,
  })
  averageBooms: number;

  @ApiProperty({
    description: 'Overall success rate percentage',
    example: 85.5,
  })
  successRate: number;

  @ApiProperty({
    description: 'Item destruction rate percentage',
    example: 15.2,
  })
  boomRate: number;

  @ApiProperty({
    description: 'Average cost per enhancement attempt',
    example: 125000000,
  })
  costPerAttempt: number;

  @ApiProperty({
    description: 'Detailed statistics for each star level',
    type: [StarforcePerStarStatsDto],
  })
  perStarStats: StarforcePerStarStatsDto[];

  @ApiProperty({
    description: 'Enhancement recommendations and tips',
    example: [
      'Consider using Safeguard for stars 15-16 to prevent destruction.',
      'Expected 1.2 booms - prepare 2 spare items.',
    ],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Number of spare items recommended',
    example: 2,
  })
  sparesNeeded: number;
}

export class StarforceAttemptDto {
  @ApiProperty({
    description: 'Starting star level',
    example: 15,
  })
  fromStars: number;

  @ApiProperty({
    description: 'Target star level',
    example: 16,
  })
  toStars: number;

  @ApiProperty({
    description: 'Cost for this enhancement attempt',
    example: 150000000,
  })
  cost: number;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 30.0,
  })
  successRate: number;

  @ApiPropertyOptional({
    description: 'Item destruction rate percentage',
    example: 2.1,
  })
  destructionRate?: number;

  @ApiPropertyOptional({
    description: 'Additional safeguard cost',
    example: 150000000,
  })
  safeguardCost?: number;
}
