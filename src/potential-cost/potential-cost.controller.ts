import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  PotentialInputOptionsRequestDto,
  PotentialInputOptionsResponseDto,
  PotentialCalculationRequestDto,
  PotentialCalculationResponseDto,
  BulkPotentialCalculationRequestDto,
  BulkPotentialCalculationResponseDto,
  BulkPotentialCalculationWithIndividualCubesRequestDto,
  BulkPotentialCalculationWithIndividualCubesResponseDto,
  ItemType,
} from './contracts';
import { PotentialService } from './services';

@ApiTags('potential-cost')
@Controller('potential')
export class PotentialCostController {
  constructor(private readonly potentialService: PotentialService) {}

  @Get('input-options')
  @ApiOperation({
    summary: 'Get available input options for potential calculations',
    description:
      'Returns all available input categories with descriptions and maximum values',
  })
  @ApiQuery({
    name: 'itemType',
    type: String,
    description:
      'Type of equipment (client-friendly names like ring, pendant, weapon, shoes, etc.)',
    example: 'ring',
  })
  @ApiQuery({
    name: 'itemLevel',
    type: Number,
    description: 'Level of the item',
    example: 160,
  })
  @ApiResponse({
    status: 200,
    description: 'Available input options retrieved successfully',
    type: PotentialInputOptionsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  getInputOptions(
    @Query('itemType') itemType: string,
    @Query('itemLevel') itemLevel: number,
  ): PotentialInputOptionsResponseDto {
    try {
      const request: PotentialInputOptionsRequestDto = {
        itemType,
        itemLevel: Number(itemLevel),
      };

      return this.potentialService.getInputOptions(request);
    } catch (error) {
      throw new HttpException(
        `Failed to get input options: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate potential cost and probability',
    description:
      'Calculate the cost and probability of achieving desired potential lines',
  })
  @ApiResponse({
    status: 200,
    description: 'Potential calculation completed successfully',
    type: PotentialCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid calculation parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Calculation failed',
  })
  calculatePotential(
    @Body() request: PotentialCalculationRequestDto,
  ): PotentialCalculationResponseDto {
    try {
      return this.potentialService.calculatePotential(request);
    } catch (error) {
      if ((error as Error).message.includes('Impossible combination')) {
        throw new HttpException(
          (error as Error).message,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        `Calculation failed: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-calculate')
  @ApiOperation({
    summary: 'Calculate multiple potential scenarios',
    description:
      'Calculate costs and probabilities for multiple potential combinations',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk potential calculations completed successfully',
    type: BulkPotentialCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk calculation parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Bulk calculation failed',
  })
  calculateBulkPotential(
    @Body() request: BulkPotentialCalculationRequestDto,
  ): BulkPotentialCalculationResponseDto {
    try {
      const results = this.potentialService.calculateBulkPotential(request);

      return results;
    } catch (error) {
      throw new HttpException(
        `Bulk calculation failed: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk-calculate-individual-cubes')
  @ApiOperation({
    summary: 'Calculate multiple potential scenarios with individual cube types',
    description:
      'Calculate costs and probabilities for multiple potential combinations where each item can use a different cube type and DMT setting',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk potential calculations with individual cubes completed successfully',
    type: BulkPotentialCalculationWithIndividualCubesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk calculation parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Bulk calculation failed',
  })
  calculateBulkPotentialWithIndividualCubes(
    @Body() request: BulkPotentialCalculationWithIndividualCubesRequestDto,
  ): BulkPotentialCalculationWithIndividualCubesResponseDto {
    try {
      console.log('=== INDIVIDUAL CUBES CONTROLLER DEBUG ===');
      console.log('Raw request body:', JSON.stringify(request, null, 2));
      console.log('Request type:', typeof request);
      console.log('Items array:', request.items);
      console.log('Items length:', request.items?.length);
      
      if (request.items && request.items.length > 0) {
        console.log('First item:', JSON.stringify(request.items[0], null, 2));
        console.log('First item cubeType:', request.items[0].cubeType);
        console.log('First item cubeType type:', typeof request.items[0].cubeType);
      }
      console.log('==========================================');

      const results = this.potentialService.calculateBulkPotentialWithIndividualCubes(request);

      return results;
    } catch (error) {
      throw new HttpException(
        `Bulk calculation with individual cubes failed: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
