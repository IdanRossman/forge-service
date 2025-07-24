import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enhanced starforce calculation request DTO
export class EnhancedStarforceCostRequestDto {
  @ApiProperty({
    description: 'Level of the item to be enhanced',
    example: 160,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Current star level of the item',
    example: 12,
    minimum: 0,
    maximum: 25,
  })
  fromStar: number;

  @ApiProperty({
    description: 'Target star level to enhance to',
    example: 17,
    minimum: 1,
    maximum: 25,
  })
  toStar: number;

  @ApiProperty({
    description: 'Whether this is an Interactive (Regular) server calculation',
    example: true,
    default: false,
  })
  isInteractive: boolean;

  @ApiPropertyOptional({
    description: 'Number of spare items available',
    example: 3,
    minimum: 0,
  })
  spareCount?: number;

  @ApiPropertyOptional({
    description: 'Cost per spare item in mesos',
    example: 500000000,
    minimum: 0,
  })
  spareCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost spent for luck analysis',
    example: 2500000000,
    minimum: 0,
  })
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Whether to use safeguard for risky star levels',
    example: true,
    default: false,
  })
  safeguardEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Event configurations to apply',
    type: 'object',
    properties: {
      thirtyOff: {
        type: 'boolean',
        description: '30% off enhancement cost event',
        example: true,
      },
      fiveTenFifteen: {
        type: 'boolean',
        description: '5/10/15 guaranteed success event',
        example: false,
      },
      starCatching: {
        type: 'boolean',
        description: 'Star catching event (+5% success rate)',
        example: true,
      },
      mvpDiscount: {
        type: 'number',
        description: 'MVP discount percentage (0-0.3)',
        minimum: 0,
        maximum: 0.3,
        example: 0.15,
      },
      yohiTapEvent: {
        type: 'boolean',
        description: '🍀 Legendary luck event (halves all costs)',
        example: false,
      },
    },
    example: {
      thirtyOff: true,
      starCatching: true,
      mvpDiscount: 0.15,
    },
  })
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: number;
    yohiTapEvent?: boolean;
  };
}

// Luck analysis result DTO
export class LuckAnalysisDto {
  @ApiProperty({
    description: 'Actual cost spent by the user',
    example: 2500000000,
  })
  actualCost: number;

  @ApiProperty({
    description: 'Percentile ranking (0-100)',
    example: 25.5,
  })
  percentile: number;

  @ApiProperty({
    description: 'Luck rating description',
    enum: ['Very Lucky', 'Lucky', 'Average', 'Unlucky', 'Very Unlucky'],
    example: 'Lucky',
  })
  luckRating: 'Very Lucky' | 'Lucky' | 'Average' | 'Unlucky' | 'Very Unlucky';

  @ApiProperty({
    description: 'Detailed description of luck level',
    example: 'Your cost was better than 75% of similar attempts',
  })
  description: string;

  @ApiProperty({
    description: 'Percentage of attempts that cost more',
    example: 74.5,
  })
  betterThanPercent: number;

  @ApiProperty({
    description: 'Percentage of attempts that cost less',
    example: 25.5,
  })
  worseThanPercent: number;

  @ApiProperty({
    description: 'Shareable luck summary message',
    example:
      '✨ Lucky starforcer! 2.5B cost puts you in the 25th percentile - nice!',
  })
  shareMessage: string;
}

// Enhanced response DTO with all new features
export class EnhancedStarforceCostResponseDto {
  @ApiProperty({
    description: 'Starting star level',
    example: 12,
  })
  fromStar: number;

  @ApiProperty({
    description: 'Target star level',
    example: 17,
  })
  toStar: number;

  @ApiProperty({
    description: 'Item level used in calculation',
    example: 160,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Whether calculation was for Interactive server',
    example: true,
  })
  isInteractive: boolean;

  @ApiProperty({
    description: 'Average total cost in mesos',
    example: 2500000000,
  })
  averageCost: number;

  @ApiProperty({
    description: 'Median total cost in mesos',
    example: 2200000000,
  })
  medianCost: number;

  @ApiProperty({
    description: '75th percentile cost (conservative estimate)',
    example: 3200000000,
  })
  percentile75Cost: number;

  @ApiProperty({
    description: 'Number of simulation trials performed',
    example: 1000,
  })
  trials: number;

  @ApiProperty({
    description: 'Cost distribution statistics',
    type: 'object',
    properties: {
      min: { type: 'number', description: 'Minimum cost observed' },
      max: { type: 'number', description: 'Maximum cost observed' },
      standardDeviation: {
        type: 'number',
        description: 'Standard deviation of costs',
      },
    },
  })
  costDistribution: {
    min: number;
    max: number;
    standardDeviation: number;
  };

  @ApiPropertyOptional({
    description: 'Average spare items needed (if spare calculations enabled)',
    example: 2.5,
  })
  averageSpareCount?: number;

  @ApiPropertyOptional({
    description: 'Median spare items needed (if spare calculations enabled)',
    example: 2,
  })
  medianSpareCount?: number;

  @ApiPropertyOptional({
    description:
      '75th percentile spare items needed (if spare calculations enabled)',
    example: 4,
  })
  percentile75SpareCount?: number;

  @ApiPropertyOptional({
    description:
      'Total investment including spare items (if spare calculations enabled)',
    example: 4000000000,
  })
  totalInvestment?: number;

  @ApiPropertyOptional({
    description: 'Luck analysis (if actualCost provided)',
    type: LuckAnalysisDto,
  })
  luckAnalysis?: LuckAnalysisDto;
}

// Individual item calculation for bulk requests
export class BulkItemCalculationDto {
  @ApiProperty({
    description: 'Level of the item to be enhanced',
    example: 160,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Current star level of the item',
    example: 12,
    minimum: 0,
    maximum: 25,
  })
  fromStar: number;

  @ApiProperty({
    description: 'Target star level to enhance to',
    example: 17,
    minimum: 1,
    maximum: 25,
  })
  toStar: number;

  @ApiPropertyOptional({
    description: 'Whether to use safeguard for this specific item',
    example: true,
    default: false,
  })
  safeguardEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Number of spare items available for this item',
    example: 3,
    minimum: 0,
  })
  spareCount?: number;

  @ApiPropertyOptional({
    description: 'Cost per spare item in mesos for this item',
    example: 500000000,
    minimum: 0,
  })
  spareCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost spent on this item for luck analysis',
    example: 2500000000,
    minimum: 0,
  })
  actualCost?: number;

  @ApiPropertyOptional({
    description:
      'Optional label for this item (e.g., "Weapon", "Top", "Bottom")',
    example: 'Arcane Umbra Weapon',
  })
  itemName?: string;
}

// Bulk calculation DTOs
export class BulkEnhancedStarforceRequestDto {
  @ApiProperty({
    description: 'Whether this is an Interactive (Regular) server calculation',
    example: true,
    default: false,
  })
  isInteractive: boolean;

  @ApiProperty({
    description: 'Server-wide event configurations that apply to all items',
    type: 'object',
    properties: {
      thirtyOff: {
        type: 'boolean',
        description: '30% off enhancement cost event',
        example: true,
      },
      fiveTenFifteen: {
        type: 'boolean',
        description: '5/10/15 guaranteed success event',
        example: false,
      },
      starCatching: {
        type: 'boolean',
        description: 'Star catching event (+5% success rate)',
        example: true,
      },
      mvpDiscount: {
        type: 'number',
        description: 'MVP discount percentage (0-0.3)',
        minimum: 0,
        maximum: 0.3,
        example: 0.15,
      },
    },
    example: {
      thirtyOff: true,
      starCatching: true,
      mvpDiscount: 0.15,
    },
  })
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: number;
  };

  @ApiProperty({
    description: 'Array of items to calculate starforce costs for',
    type: [BulkItemCalculationDto],
    example: [
      {
        itemLevel: 200,
        fromStar: 12,
        toStar: 17,
        safeguardEnabled: false,
        itemName: 'Arcane Umbra Weapon',
      },
      {
        itemLevel: 200,
        fromStar: 15,
        toStar: 22,
        safeguardEnabled: true,
        spareCount: 3,
        spareCost: 800000000,
        itemName: 'Arcane Umbra Armor',
      },
    ],
  })
  items: BulkItemCalculationDto[];
}

export class BulkEnhancedStarforceResponseDto {
  @ApiProperty({
    description: 'Array of enhanced starforce calculation results',
    type: [EnhancedStarforceCostResponseDto],
  })
  results: EnhancedStarforceCostResponseDto[];

  @ApiProperty({
    description: 'Summary of all calculations',
    type: 'object',
    properties: {
      totalExpectedCost: {
        type: 'number',
        description: 'Sum of all average costs',
      },
      totalMedianCost: {
        type: 'number',
        description: 'Sum of all median costs',
      },
      totalConservativeCost: {
        type: 'number',
        description: 'Sum of all 75th percentile costs',
      },
      totalExpectedBooms: {
        type: 'number',
        description: 'Sum of all expected boom counts',
      },
      totalCalculations: {
        type: 'number',
        description: 'Number of calculations performed',
      },
      worstCaseScenario: {
        type: 'number',
        description: 'Sum of all maximum costs',
      },
      bestCaseScenario: {
        type: 'number',
        description: 'Sum of all minimum costs',
      },
    },
  })
  summary: {
    totalExpectedCost: number;
    totalMedianCost: number;
    totalConservativeCost: number;
    totalExpectedBooms: number;
    totalCalculations: number;
    worstCaseScenario: number;
    bestCaseScenario: number;
  };
}
