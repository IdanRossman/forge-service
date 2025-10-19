import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CharacterEquipmentService } from './character-equipment.service';
import { BulkEquipDto } from './dto/bulk-equip.dto';
import { UpsertEquipmentDto } from './dto/upsert-equipment.dto';

@ApiTags('Character Equipment')
@Controller('characters/:characterId/equipment')
export class CharacterEquipmentController {
  constructor(
    private readonly characterEquipmentService: CharacterEquipmentService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all equipment for a character',
    description: 'Returns all equipped items for the specified character',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of equipped items',
  })
  findAll(@Param('characterId') characterId: string) {
    return this.characterEquipmentService.findAllByCharacter(characterId);
  }

  @Get(':slotName')
  @ApiOperation({
    summary: 'Get equipment in specific slot',
    description: 'Returns the equipment equipped in the specified slot',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiParam({
    name: 'slotName',
    description: 'Equipment slot name (e.g., weapon, hat, ring1)',
  })
  @ApiResponse({ status: 200, description: 'Returns the equipped item' })
  @ApiResponse({ status: 404, description: 'Equipment not found in slot' })
  findOne(
    @Param('characterId') characterId: string,
    @Param('slotName') slotName: string,
  ) {
    return this.characterEquipmentService.findOneBySlot(characterId, slotName);
  }

  @Put(':slotName')
  @ApiOperation({
    summary: 'Equip or update item in slot (upsert)',
    description:
      'Equips an item in the specified slot. If slot already has equipment, it will be replaced/updated. This is an upsert operation.',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiParam({
    name: 'slotName',
    description: 'Equipment slot name (e.g., weapon, hat, ring1)',
  })
  @ApiResponse({
    status: 200,
    description: 'Item equipped/updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  upsertItem(
    @Param('characterId') characterId: string,
    @Param('slotName') slotName: string,
    @Body() upsertDto: UpsertEquipmentDto,
  ) {
    return this.characterEquipmentService.upsertItem(
      characterId,
      slotName,
      upsertDto,
    );
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk equip/update items (upsert)',
    description:
      'Equips or updates multiple items at once. Existing items in slots will be replaced. Useful for applying full loadouts.',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiResponse({
    status: 201,
    description: 'Items equipped/updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., duplicate slots)',
  })
  bulkUpsert(
    @Param('characterId') characterId: string,
    @Body() bulkEquipDto: BulkEquipDto,
  ) {
    return this.characterEquipmentService.bulkUpsert(
      characterId,
      bulkEquipDto.equipment,
    );
  }

  @Delete(':slotName')
  @ApiOperation({
    summary: 'Unequip item from slot',
    description: 'Removes the equipment from the specified slot',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiParam({ name: 'slotName', description: 'Equipment slot name' })
  @ApiResponse({ status: 200, description: 'Item unequipped successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found in slot' })
  async unequip(
    @Param('characterId') characterId: string,
    @Param('slotName') slotName: string,
  ) {
    await this.characterEquipmentService.unequip(characterId, slotName);
    return { message: 'Item unequipped successfully' };
  }

  @Delete()
  @ApiOperation({
    summary: 'Unequip all items',
    description: 'Removes all equipment from the character',
  })
  @ApiParam({ name: 'characterId', description: 'Character UUID' })
  @ApiResponse({
    status: 200,
    description: 'All items unequipped successfully',
  })
  async unequipAll(@Param('characterId') characterId: string) {
    await this.characterEquipmentService.unequipAll(characterId);
    return { message: 'All items unequipped successfully' };
  }
}
