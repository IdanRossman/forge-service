import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/services/supabase.service';
import { EquipmentItemDto } from './dto/equipment-item.dto';
import { CharacterEquipment } from './interfaces/character-equipment.interface';

@Injectable()
export class CharacterEquipmentService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllByCharacter(characterId: string): Promise<CharacterEquipment[]> {
    return this.supabaseService.getCharacterEquipment(characterId);
  }

  async findOneBySlot(
    characterId: string,
    slotName: string,
  ): Promise<CharacterEquipment> {
    const equipment = await this.supabaseService.getCharacterEquipmentBySlot(
      characterId,
      slotName,
    );

    if (!equipment) {
      throw new NotFoundException(
        `Equipment in slot ${slotName} for character ${characterId} not found`,
      );
    }

    return equipment;
  }

  async upsertItem(
    characterId: string,
    slotName: string,
    equipmentDto: Partial<EquipmentItemDto>,
  ): Promise<CharacterEquipment> {
    // Build the upsert data - merge with existing if updating
    const upsertData: Omit<
      CharacterEquipment,
      'id' | 'created_at' | 'updated_at'
    > = {
      character_id: characterId,
      slot_name: slotName,
      equipment_id: equipmentDto.equipment_id!,
      current_starforce: equipmentDto.current_starforce ?? 0,
      target_starforce: equipmentDto.target_starforce ?? 0,
      current_potential: equipmentDto.current_potential,
      target_potential: equipmentDto.target_potential,
    };

    return this.supabaseService.upsertCharacterEquipment(upsertData);
  }

  async bulkUpsert(
    characterId: string,
    equipmentList: EquipmentItemDto[],
  ): Promise<CharacterEquipment[]> {
    const mappedEquipment = equipmentList.map((item) => ({
      character_id: characterId,
      slot_name: item.slot_name,
      equipment_id: item.equipment_id,
      current_starforce: item.current_starforce ?? 0,
      target_starforce: item.target_starforce ?? 0,
      current_potential: item.current_potential,
      target_potential: item.target_potential,
    }));

    return this.supabaseService.bulkUpsertCharacterEquipment(mappedEquipment);
  }

  async unequip(characterId: string, slotName: string): Promise<void> {
    // Verify equipment exists
    await this.findOneBySlot(characterId, slotName);

    await this.supabaseService.deleteCharacterEquipment(characterId, slotName);
  }

  async unequipAll(characterId: string): Promise<void> {
    await this.supabaseService.deleteAllCharacterEquipment(characterId);
  }
}
