import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/services/supabase.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { Character } from './interfaces/character.interface';

@Injectable()
export class CharactersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    userId: string,
    createCharacterDto: CreateCharacterDto,
  ): Promise<Character> {
    const { equipment, ...characterData } = createCharacterDto;

    // Create character
    const character = await this.supabaseService.createCharacter({
      ...characterData,
      user_id: userId,
    });

    // If equipment provided, bulk upsert equipment
    if (equipment && equipment.length > 0) {
      const equipmentList = equipment.map((item) => ({
        character_id: character.id,
        slot_name: item.slot_name,
        equipment_id: item.equipment_id,
        current_starforce: item.current_starforce ?? 0,
        target_starforce: item.target_starforce ?? 0,
        current_potential: item.current_potential,
        target_potential: item.target_potential,
      }));

      await this.supabaseService.bulkUpsertCharacterEquipment(equipmentList);
    }

    return character;
  }

  async findAll(userId: string): Promise<Character[]> {
    return this.supabaseService.getAllCharacters(userId);
  }

  async findOne(id: string): Promise<Character> {
    const character = await this.supabaseService.getCharacterById(id);
    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }
    return character;
  }

  async update(
    id: string,
    updateCharacterDto: UpdateCharacterDto,
  ): Promise<Character> {
    // Verify character exists
    await this.findOne(id);

    return this.supabaseService.updateCharacter(id, updateCharacterDto);
  }

  async remove(id: string): Promise<void> {
    // Verify character exists
    await this.findOne(id);

    await this.supabaseService.deleteCharacter(id);
  }
}
