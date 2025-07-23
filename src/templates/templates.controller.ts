import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  SupabaseService,
  EquipmentTemplate,
} from '../database/services/supabase.service';
import { TemplateService, TemplateEquipmentResult } from './template.service';

@ApiTags('Templates')
@Controller('Templates')
export class TemplatesController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly templateService: TemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment templates' })
  @ApiResponse({ status: 200, description: 'Return all templates.' })
  async getAllTemplates(): Promise<EquipmentTemplate[]> {
    return this.supabaseService.getAllTemplates();
  }

  @Post()
  @ApiOperation({ summary: 'Create new equipment template' })
  @ApiResponse({ status: 201, description: 'Template created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createTemplate(
    @Body() template: Omit<EquipmentTemplate, 'id'>,
  ): Promise<EquipmentTemplate> {
    return this.supabaseService.createTemplate(template);
  }

  @Get(':id/equipment')
  @ApiOperation({ summary: 'Get equipment for a template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiQuery({ name: 'job', required: false, description: 'Job class (default: bishop)' })
  @ApiResponse({ status: 200, description: 'Return template equipment.' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  async getTemplateEquipment(
    @Param('id') id: string,
    @Query('job') job: string = 'bishop',
  ): Promise<TemplateEquipmentResult[]> {
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) {
      throw new Error('Invalid template ID');
    }
    return this.templateService.getTemplateEquipment(templateId, job);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate template completeness' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiQuery({ name: 'job', required: false, description: 'Job class (default: bishop)' })
  @ApiResponse({ status: 200, description: 'Return validation result.' })
  async validateTemplate(
    @Param('id') id: string,
    @Query('job') job: string = 'bishop',
  ): Promise<{valid: boolean, missingSlots: string[]}> {
    const templateId = parseInt(id, 10);
    if (isNaN(templateId)) {
      throw new Error('Invalid template ID');
    }
    return this.templateService.validateTemplate(templateId, job);
  }
}
