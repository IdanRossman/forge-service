import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@ApiTags('Characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new character',
    description:
      'Creates a new character for the authenticated user. Optionally include equipment to equip on creation.',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID (temporary until auth is implemented)',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Character created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Headers('x-user-id') userId: string,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID header is required');
    }
    return this.charactersService.create(userId, createCharacterDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all characters for user',
    description: 'Returns all characters owned by the authenticated user',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID (temporary until auth is implemented)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of characters',
  })
  findAll(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID header is required');
    }
    return this.charactersService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get character by ID' })
  @ApiParam({ name: 'id', description: 'Character UUID' })
  @ApiResponse({ status: 200, description: 'Returns the character' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update character' })
  @ApiParam({ name: 'id', description: 'Character UUID' })
  @ApiResponse({ status: 200, description: 'Character updated successfully' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete character',
    description:
      'Deletes a character and all associated equipment (cascade delete)',
  })
  @ApiParam({ name: 'id', description: 'Character UUID' })
  @ApiResponse({ status: 200, description: 'Character deleted successfully' })
  @ApiResponse({ status: 404, description: 'Character not found' })
  async remove(@Param('id') id: string) {
    await this.charactersService.remove(id);
    return { message: 'Character deleted successfully' };
  }
}
