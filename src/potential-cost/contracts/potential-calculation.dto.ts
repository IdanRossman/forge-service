import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CubeType, ItemType } from './potential-enums';

// Internal interface for calculations (not exposed in API)
export interface PotentialInput {
  percStat: number;
  lineStat: number;
  percAllStat: number;
  lineAllStat: number;
  percHp: number;
  lineHp: number;
  percAtt: number;
  lineAtt: number;
  percBoss: number;
  lineBoss: number;
  lineIed: number;
  lineCritDamage: number;
  lineMeso: number;
  lineDrop: number;
  lineMesoOrDrop: number;
  secCooldown: number;
  lineAutoSteal: number;
  lineAttOrBoss: number;
  lineAttOrBossOrIed: number;
  lineBossOrIed: number;
}

// Internal interface for input options (not exposed in API)
export interface InputOption {
  description: string;
  maxPossible: number;
  increment: number;
}

// Dropdown option for frontend display
export interface DropdownOption {
  value: string; // e.g., "percStat+21" or "lineMeso+1&lineStat+1"
  displayText: string; // e.g., "21%+ Stat" or "1 Line Mesos Obtained% and 1 line Stat"
}

// Grouped dropdown options
export interface DropdownOptionGroup {
  label: string; // e.g., "Stat", "Drop/Meso", "Attack"
  options: DropdownOption[];
}

// Input options request DTO
export class PotentialInputOptionsRequestDto {
  @ApiProperty({
    description:
      'Type of equipment (client-friendly names like ring, pendant, weapon, shoes, etc.)',
    example: 'ring',
  })
  itemType: string; // Client sends friendly names like 'ring', 'pendant'

  @ApiProperty({
    description: 'Level of the item',
    example: 160,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;
}

// Input options response DTO
export class PotentialInputOptionsResponseDto {
  @ApiProperty({
    description: 'Type of item',
    enum: ItemType,
  })
  itemType: ItemType;

  @ApiProperty({
    description: 'Level of the item',
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Dropdown options grouped by category for frontend display',
    type: [Object],
  })
  dropdownOptions: DropdownOptionGroup[];
}

// Potential calculation request DTO
export class PotentialCalculationRequestDto {
  @ApiProperty({
    description:
      'Display text from dropdown selection (e.g., "21%+ Stat", "1 Line Attack% or Boss% or IED")',
    example: '21%+ Stat',
  })
  selectedOption: string;

  @ApiProperty({
    description:
      'Type of equipment (client-friendly names like ring, pendant, weapon, shoes, etc.)',
    example: 'ring',
  })
  itemType: string; // Client sends friendly names like 'ring', 'pendant'

  @ApiProperty({
    description: 'Type of cube to use',
    enum: CubeType,
    example: CubeType.RED,
  })
  cubeType: CubeType;

  @ApiProperty({
    description: 'Level of the item',
    example: 160,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiPropertyOptional({
    description: 'Whether DMT (Double Miracle Time) event is active',
    example: false,
    default: false,
  })
  isDMT?: boolean;
}

// Potential calculation response DTO
export class PotentialCalculationResponseDto {
  @ApiProperty({
    description: 'Probability of achieving the desired potential (0-1)',
    example: 0.0234,
  })
  probability: number;

  @ApiProperty({
    description: 'Average number of cubes needed',
    example: 42.7,
  })
  averageCubes: number;

  @ApiProperty({
    description: 'Median number of cubes needed',
    example: 29,
  })
  medianCubes: number;

  @ApiProperty({
    description: '75th percentile number of cubes needed',
    example: 67,
  })
  percentile75Cubes: number;

  @ApiProperty({
    description: 'Average total cost in mesos',
    example: 512400000,
  })
  averageCost: number;

  @ApiProperty({
    description: 'Median total cost in mesos',
    example: 348000000,
  })
  medianCost: number;

  @ApiProperty({
    description: '75th percentile total cost in mesos',
    example: 804000000,
  })
  percentile75Cost: number;

  @ApiProperty({
    description: 'Input parameters used for calculation',
  })
  inputParameters: {
    selectedOption: string;
    itemType: ItemType;
    cubeType: CubeType;
    itemLevel: number;
    isDMT?: boolean;
  };
}

// Individual item for bulk calculation
export class BulkPotentialItemDto {
  @ApiProperty({
    description:
      'Type of equipment (client-friendly names like ring, pendant, weapon, etc.)',
    example: 'ring',
  })
  itemType: string; // Client sends friendly names like 'ring', 'pendant'

  @ApiProperty({
    description: 'Level of the item',
    example: 200,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Display text from dropdown selection',
    example: '21%+ Stat',
  })
  selectedOption: string;

  @ApiPropertyOptional({
    description: 'Optional name for display purposes',
    example: 'Arcane Umbra Ring',
  })
  itemName?: string;
}

// Bulk calculation request DTO
export class BulkPotentialCalculationRequestDto {
  @ApiProperty({
    description: 'Type of cube to use for all items',
    enum: CubeType,
    example: CubeType.RED,
  })
  cubeType: CubeType;

  @ApiPropertyOptional({
    description:
      'Whether DMT (Double Miracle Time) event is active for all items',
    example: false,
    default: false,
  })
  isDMT?: boolean;

  @ApiProperty({
    description: 'Array of items to calculate',
    type: [BulkPotentialItemDto],
    example: [
      {
        itemType: 'ring',
        itemLevel: 200,
        selectedOption: '21%+ Stat',
        itemName: 'Superior Gollux Ring',
      },
      {
        itemType: 'pendant',
        itemLevel: 200,
        selectedOption: '12%+ Stat',
        itemName: 'Superior Gollux Pendant',
      },
      {
        itemType: 'weapon',
        itemLevel: 200,
        selectedOption: '21%+ Stat',
        itemName: 'Arcane Umbra Weapon',
      },
    ],
  })
  items: BulkPotentialItemDto[];
}

// Individual item for bulk calculation with individual cube type
export class BulkPotentialItemWithCubeDto {
  @ApiProperty({
    description:
      'Type of equipment (client-friendly names like ring, pendant, weapon, etc.)',
    example: 'ring',
  })
  itemType: string; // Client sends friendly names like 'ring', 'pendant'

  @ApiProperty({
    description: 'Level of the item',
    example: 200,
    minimum: 1,
    maximum: 300,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Display text from dropdown selection',
    example: '21%+ Stat',
  })
  selectedOption: string;

  @ApiProperty({
    description:
      'Type of cube to use for this specific item. Use null for smart optimization (auto-select cheapest cube type).',
    enum: CubeType,
    example: CubeType.RED,
    nullable: true,
  })
  cubeType: CubeType | null;

  @ApiPropertyOptional({
    description:
      'Whether DMT (Double Miracle Time) event is active for this item',
    example: false,
    default: false,
  })
  isDMT?: boolean;

  @ApiPropertyOptional({
    description: 'Optional name for display purposes',
    example: 'Arcane Umbra Ring',
  })
  itemName?: string;
}

// Bulk calculation request DTO with individual cube types
export class BulkPotentialCalculationWithIndividualCubesRequestDto {
  @ApiProperty({
    description: 'Array of items to calculate, each with its own cube type',
    type: [BulkPotentialItemWithCubeDto],
    example: [
      {
        itemType: 'ring',
        itemLevel: 200,
        selectedOption: '21%+ Stat',
        cubeType: 'red',
        isDMT: false,
        itemName: 'Superior Gollux Ring',
      },
      {
        itemType: 'pendant',
        itemLevel: 200,
        selectedOption: '12%+ Stat',
        cubeType: 'black',
        isDMT: true,
        itemName: 'Superior Gollux Pendant',
      },
      {
        itemType: 'weapon',
        itemLevel: 200,
        selectedOption: '21%+ Attack',
        cubeType: 'meister',
        isDMT: false,
        itemName: 'Arcane Umbra Weapon',
      },
    ],
  })
  items: BulkPotentialItemWithCubeDto[];
}

// Bulk calculation response DTO
// Bulk calculation response DTO
export class BulkPotentialItemResponseDto {
  @ApiProperty({
    description: 'Type of equipment',
    example: 'ring',
  })
  itemType: string;

  @ApiProperty({
    description: 'Level of the item',
    example: 200,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Selected option for this item',
    example: '21%+ Stat',
  })
  selectedOption: string;

  @ApiPropertyOptional({
    description: 'Optional name for display purposes',
    example: 'Superior Gollux Ring',
  })
  itemName?: string;

  @ApiProperty({
    description: 'Calculation result for this item',
    type: PotentialCalculationResponseDto,
    nullable: true,
  })
  result: PotentialCalculationResponseDto | null;

  @ApiProperty({
    description: 'Error message if calculation failed',
    nullable: true,
    example: null,
  })
  error: string | null;
}

export class BulkPotentialCalculationResponseDto {
  @ApiProperty({
    description: 'Array of potential calculation results',
    type: [BulkPotentialItemResponseDto],
  })
  results: BulkPotentialItemResponseDto[];

  @ApiProperty({
    description: 'Summary statistics for all calculations',
    type: 'object',
    properties: {
      totalAverageCost: {
        type: 'number',
        description: 'Total average cost for all items',
        example: 2500000000,
      },
      totalMedianCost: {
        type: 'number',
        description: 'Total median cost for all items',
        example: 1800000000,
      },
      totalAverageCubes: {
        type: 'number',
        description: 'Total average cubes needed for all items',
        example: 185,
      },
      itemCount: {
        type: 'number',
        description: 'Number of items calculated',
        example: 3,
      },
    },
  })
  summary: {
    totalAverageCost: number;
    totalMedianCost: number;
    totalAverageCubes: number;
    itemCount: number;
  };
}

// Individual item response for bulk calculation with individual cube types
export class BulkPotentialItemWithCubeResponseDto {
  @ApiProperty({
    description: 'Type of equipment',
    example: 'ring',
  })
  itemType: string;

  @ApiProperty({
    description: 'Level of the item',
    example: 200,
  })
  itemLevel: number;

  @ApiProperty({
    description: 'Selected option for this item',
    example: '21%+ Stat',
  })
  selectedOption: string;

  @ApiProperty({
    description: 'Cube type used for this item',
    enum: CubeType,
    example: CubeType.RED,
  })
  cubeType: CubeType;

  @ApiPropertyOptional({
    description: 'Whether DMT was active for this item',
    example: false,
  })
  isDMT?: boolean;

  @ApiPropertyOptional({
    description: 'Optional name for display purposes',
    example: 'Superior Gollux Ring',
  })
  itemName?: string;

  @ApiPropertyOptional({
    description: 'Calculation result if successful',
    type: () => PotentialCalculationResponseDto,
  })
  result?: PotentialCalculationResponseDto;

  @ApiPropertyOptional({
    description: 'Error message if calculation failed',
    example: 'Invalid cube type for this item level',
  })
  error?: string;
}

// Bulk calculation response DTO with individual cube types
export class BulkPotentialCalculationWithIndividualCubesResponseDto {
  @ApiProperty({
    description: 'Array of calculation results for each item',
    type: [BulkPotentialItemWithCubeResponseDto],
  })
  results: BulkPotentialItemWithCubeResponseDto[];

  @ApiProperty({
    description: 'Summary statistics for all items',
    example: {
      totalAverageCost: 2500000000,
      totalMedianCost: 1800000000,
      totalAverageCubes: 185,
      itemCount: 3,
    },
  })
  summary: {
    totalAverageCost: number;
    totalMedianCost: number;
    totalAverageCubes: number;
    itemCount: number;
  };
}
