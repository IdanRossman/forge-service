import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SupabaseService,
  Equipment,
} from '../database/services/supabase.service';
import { isValidJob } from './job-class-mapping';

@ApiTags('Equipment')
@Controller('Equipment')
export class EquipmentController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment, optionally filtered by type' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by equipment type (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all equipment or equipment of specified type.',
  })
  async getAllEquipment(@Query('type') type?: string): Promise<Equipment[]> {
    if (type) {
      // Use the existing method in a filtered way
      const allEquipment = await this.supabaseService.getAllEquipment();
      return allEquipment.filter((equipment) => equipment.type === type);
    }
    return this.supabaseService.getAllEquipment();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Return equipment by ID.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  async getEquipmentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Equipment | null> {
    return this.supabaseService.getEquipmentById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createEquipment(
    @Body() equipment: Omit<Equipment, 'id'>,
  ): Promise<Equipment> {
    return this.supabaseService.createEquipment(equipment);
  }

  @Get('type/:type/job/:job')
  @ApiOperation({
    summary: 'Get equipment by type filtered by job',
    description:
      'Returns equipment of a specific type that can be used by the specified job (includes common and class-specific items)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return equipment for the specified type and job.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid type or job specified.',
  })
  async getEquipmentByTypeAndJob(
    @Param('type') type: string,
    @Param('job') job: string,
  ): Promise<Equipment[]> {
    if (!isValidJob(job)) {
      throw new BadRequestException(`Invalid job: ${job}`);
    }

    return this.supabaseService.getEquipmentByJobAndType(type, job);
  }
}
