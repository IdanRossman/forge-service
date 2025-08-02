import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { StarforceCostService } from './services/starforce-cost.service';
import { StarforceOptimizationService } from './services/starforce-optimization.service';
import {
  BulkEnhancedStarforceRequestDto,
  BulkEnhancedStarforceResponseDto,
  EnhancedStarforceCostRequestDto,
  EnhancedStarforceCostResponseDto,
  StarforceOptimizationRequestDto,
  StarforceOptimizationResponseDto,
} from './contracts';

@ApiTags('Starforce')
@Controller('Starforce')
export class StarforceCostController {
  constructor(
    private readonly starforceCostService: StarforceCostService,
    private readonly starforceOptimizationService: StarforceOptimizationService,
  ) {}

  @Post('calculate-bulk')
  @ApiOperation({
    summary: 'Calculate Starforce Costs for Multiple Items (Main Endpoint)',
    description:
      'The primary endpoint for calculating starforce costs. Handles multiple equipment items with shared server events (30% off, star catching, etc.) and individual item settings (safeguard per item). Perfect for calculating entire equipment sets with realistic event scenarios.',
  })
  @ApiBody({
    type: BulkEnhancedStarforceRequestDto,
    description:
      'Bulk calculation with shared server events and individual item settings',
    examples: {
      fullEquipmentSet: {
        summary: '🎯 Complete Equipment Set (Recommended)',
        description:
          'Calculate costs for a full equipment set with 30% off event and star catching active for all items, with individual safeguard choices',
        value: {
          isInteractive: true,
          events: {
            thirtyOff: true,
            starCatching: true,
            mvpDiscount: 0.15,
          },
          items: [
            {
              itemLevel: 200,
              fromStar: 15,
              toStar: 22,
              safeguardEnabled: true,
              spareCount: 3,
              spareCost: 800000000,
              itemName: 'Arcane Umbra Weapon',
            },
            {
              itemLevel: 200,
              fromStar: 12,
              toStar: 17,
              safeguardEnabled: false,
              spareCount: 2,
              spareCost: 600000000,
              itemName: 'Arcane Umbra Top',
            },
            {
              itemLevel: 200,
              fromStar: 12,
              toStar: 17,
              safeguardEnabled: false,
              spareCount: 2,
              spareCost: 600000000,
              itemName: 'Arcane Umbra Bottom',
            },
            {
              itemLevel: 160,
              fromStar: 10,
              toStar: 17,
              safeguardEnabled: false,
              spareCount: 1,
              spareCost: 400000000,
              itemName: 'Superior Gollux Ring',
            },
          ],
        },
      },
      fiveTenFifteenEvent: {
        summary: '🌟 5/10/15 Event Active',
        description:
          'Equipment set calculation during 5/10/15 guaranteed success event',
        value: {
          isInteractive: true,
          events: {
            fiveTenFifteen: true,
            starCatching: true,
          },
          items: [
            {
              itemLevel: 160,
              fromStar: 0,
              toStar: 15,
              safeguardEnabled: false,
              itemName: 'New Equipment to 15★',
            },
            {
              itemLevel: 200,
              fromStar: 15,
              toStar: 17,
              safeguardEnabled: true,
              itemName: 'Push to 17★',
            },
          ],
        },
      },
      luckAnalysisSet: {
        summary: '📊 Luck Analysis for Multiple Items',
        description: 'Analyze your luck on multiple items you already enhanced',
        value: {
          isInteractive: true,
          events: {
            starCatching: true,
          },
          items: [
            {
              itemLevel: 160,
              fromStar: 12,
              toStar: 17,
              safeguardEnabled: true,
              actualCost: 1200000000,
              itemName: 'Main Weapon (Lucky)',
            },
            {
              itemLevel: 160,
              fromStar: 12,
              toStar: 17,
              safeguardEnabled: false,
              actualCost: 2800000000,
              itemName: 'Secondary Weapon (Unlucky)',
            },
            {
              itemLevel: 200,
              fromStar: 15,
              toStar: 22,
              safeguardEnabled: true,
              actualCost: 25000000000,
              itemName: 'Armor (Average)',
            },
          ],
        },
      },
      noEventsConservative: {
        summary: '🛡️ Conservative No-Event Calculation',
        description:
          'Calculate costs without any events for worst-case planning',
        value: {
          isInteractive: true,
          events: {},
          items: [
            {
              itemLevel: 200,
              fromStar: 17,
              toStar: 22,
              safeguardEnabled: true,
              spareCount: 5,
              spareCost: 1000000000,
              itemName: 'High-Risk Enhancement',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk calculations completed successfully',
    type: BulkEnhancedStarforceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid calculation parameters',
  })
  calculateBulk(
    @Body() request: BulkEnhancedStarforceRequestDto,
  ): BulkEnhancedStarforceResponseDto {
    return this.starforceCostService.calculateBulkStarforceCost(request);
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate Single Item Starforce Cost',
    description:
      'Calculate the expected cost and statistics for a single item. For multiple items, use /calculate-bulk instead.',
  })
  @ApiBody({
    type: EnhancedStarforceCostRequestDto,
    description: 'Single item calculation parameters',
    examples: {
      basicCalculation: {
        summary: 'Basic 12★ to 17★ calculation',
        value: {
          itemLevel: 160,
          fromStar: 12,
          toStar: 17,
          isInteractive: true,
          safeguardEnabled: false,
          events: {
            starCatching: true,
          },
        },
      },
      withLuckAnalysis: {
        summary: 'With luck analysis',
        value: {
          itemLevel: 160,
          fromStar: 12,
          toStar: 17,
          isInteractive: true,
          actualCost: 1200000000,
          safeguardEnabled: true,
          events: {
            starCatching: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Enhancement cost calculation completed successfully',
    type: EnhancedStarforceCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  calculateCost(
    @Body() request: EnhancedStarforceCostRequestDto,
  ): EnhancedStarforceCostResponseDto {
    return this.starforceCostService.calculateEnhancedStarforceCost(request);
  }

  @Post('optimize')
  @ApiOperation({
    summary: 'Optimize Starforce Strategy Within Budget',
    description:
      'Calculate the optimal starforcing sequence to maximize stars gained within a specific meso budget. Uses cost efficiency analysis to prioritize the most cost-effective enhancements first.',
  })
  @ApiBody({
    description: 'Budget-constrained optimization parameters',
    examples: {
      budgetOptimization: {
        summary: '💰 Budget Optimization Example',
        description: 'Maximize stars gained with 5B meso budget',
        value: {
          availableMeso: 5000000000,
          isInteractive: false,
          events: {
            fiveTenFifteen: true,
            thirtyOff: true,
          },
          items: [
            {
              itemLevel: 200,
              fromStar: 15,
              toStar: 19,
              spareCount: 2,
              spareCost: 500000000,
              itemName: 'Absolab Weapon',
              safeguardEnabled: true,
            },
            {
              itemLevel: 200,
              fromStar: 14,
              toStar: 18,
              spareCount: 3,
              spareCost: 500000000,
              itemName: 'Absolab Armor',
              safeguardEnabled: true,
            },
          ],
        },
      },
      conservativeBudget: {
        summary: '🛡️ Conservative Budget Planning',
        description: 'Limited budget with risk-aware recommendations',
        value: {
          availableMeso: 2000000000,
          isInteractive: true,
          events: {
            starCatching: true,
          },
          items: [
            {
              itemLevel: 160,
              fromStar: 12,
              toStar: 17,
              spareCount: 1,
              spareCost: 300000000,
              itemName: 'Superior Ring',
              safeguardEnabled: false,
            },
            {
              itemLevel: 160,
              fromStar: 10,
              toStar: 15,
              spareCount: 0,
              spareCost: 300000000,
              itemName: 'Secondary Weapon',
              safeguardEnabled: false,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Optimization strategy calculated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid optimization parameters',
  })
  optimizeStarforce(
    @Body() request: StarforceOptimizationRequestDto,
  ): StarforceOptimizationResponseDto {
    return this.starforceOptimizationService.calculateOptimalStarforceStrategy(request);
  }
}
