import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { StarforceCostService } from './services/starforce-cost.service';
import {
  StarforceCostRequestDto,
  StarforceCostResponseDto,
  BulkStarforceRequestDto,
  BulkStarforceResponseDto,
} from './contracts';

@ApiTags('Starforce')
@Controller('Starforce')
export class StarforceCostController {
  constructor(private readonly starforceCostService: StarforceCostService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate Starforce Enhancement Cost',
    description:
      "Calculate the expected cost and statistics for starforcing an item from current stars to target stars. Uses Monte Carlo simulation with Brandon\\'s proven calculator logic.",
  })
  @ApiBody({
    type: StarforceCostRequestDto,
    description: 'Enhancement parameters and event configurations',
    examples: {
      basicCalculation: {
        summary: 'Basic 0★ to 17★ calculation',
        value: {
          itemLevel: 150,
          currentStars: 0,
          targetStars: 17,
          server: 'gms',
          safeguardEnabled: false,
          events: {
            starCatching: true,
          },
        },
      },
      highStarWithEvents: {
        summary: '15★ to 22★ with events and safeguard',
        value: {
          itemLevel: 200,
          currentStars: 15,
          targetStars: 22,
          server: 'gms',
          safeguardEnabled: true,
          events: {
            thirtyOff: true,
            starCatching: true,
            mvpDiscount: 0.15,
          },
        },
      },
      yohiLuck: {
        summary: "With Yohi\\'s legendary luck event",
        value: {
          itemLevel: 160,
          currentStars: 12,
          targetStars: 17,
          server: 'gms',
          safeguardEnabled: true,
          events: {
            yohiTapEvent: true,
            starCatching: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Enhancement cost calculation completed successfully',
    type: StarforceCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Current stars must be less than target stars',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  calculateCost(
    @Body() request: StarforceCostRequestDto,
  ): StarforceCostResponseDto {
    return this.starforceCostService.calculateStarforceCost(request);
  }

  @Post('simulate')
  @ApiOperation({
    summary: 'Advanced Starforce Simulation',
    description:
      'Perform advanced starforce simulation with extended trial options. This endpoint provides the same calculation as /calculate but allows for future extension with custom trial counts.',
  })
  @ApiBody({
    type: StarforceCostRequestDto,
    description: 'Enhancement parameters for simulation',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation completed successfully',
    type: StarforceCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid simulation parameters',
  })
  simulateEnhancement(
    @Body()
    request: StarforceCostRequestDto & {
      trials?: number;
    },
  ): StarforceCostResponseDto {
    // For simulation endpoint, we can add additional trial count if needed
    return this.starforceCostService.calculateStarforceCost(request);
  }

  @Post('calculate-bulk')
  @ApiOperation({
    summary: 'Calculate Starforce Costs for Multiple Items',
    description:
      'Calculate the expected costs and statistics for multiple equipment items at once. Perfect for calculating entire equipment sets or comparing different enhancement paths.',
  })
  @ApiBody({
    type: BulkStarforceRequestDto,
    description: 'Array of enhancement calculations',
    examples: {
      equipmentSet: {
        summary: 'Calculate costs for a full equipment set',
        value: {
          calculations: [
            {
              itemLevel: 200,
              currentStars: 12,
              targetStars: 17,
              server: 'gms',
              safeguardEnabled: false,
              events: { starCatching: true },
            },
            {
              itemLevel: 200,
              currentStars: 15,
              targetStars: 22,
              server: 'gms',
              safeguardEnabled: true,
              events: { feverTime: true, shiningStarforce: true },
            },
            {
              itemLevel: 160,
              currentStars: 10,
              targetStars: 17,
              server: 'gms',
              safeguardEnabled: false,
              events: {},
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk calculations completed successfully',
    type: BulkStarforceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid calculation parameters',
  })
  calculateBulk(
    @Body() request: BulkStarforceRequestDto,
  ): BulkStarforceResponseDto {
    return this.starforceCostService.calculateBulk(request.calculations);
  }
}
