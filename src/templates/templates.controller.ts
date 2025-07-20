import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SupabaseService,
  EquipmentTemplate,
} from '../database/services/supabase.service';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly supabaseService: SupabaseService) {}

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
}
