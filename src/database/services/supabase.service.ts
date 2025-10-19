/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getClassByJob } from '../../equipment/job-class-mapping';

export interface Equipment {
  id?: number;
  name: string;
  type: string;
  set?: string;
  job?: string[];
  class?: string;
  level?: number;
  base_attack?: number;
  starforceable?: boolean;
  maplestory_io_id?: string;
  storage_url?: string;
}

export interface EquipmentTemplate {
  id?: number;
  name: string;
  description?: string;
  hat_id?: number;
  top_id?: number;
  bottom_id?: number;
  weapon_id?: number;
  secondary_id?: number;
  gloves_id?: number;
  shoes_id?: number;
  cape_id?: number;
  shoulder_id?: number;
  belt_id?: number;
  face_accessory_id?: number;
  eye_accessory_id?: number;
  earring_id?: number;
  ring_1_id?: number;
  ring_2_id?: number;
  ring_3_id?: number;
  ring_4_id?: number;
  pendant_1_id?: number;
  pendant_2_id?: number;
  emblem_id?: number;
  badge_id?: number;
  heart_id?: number;
  pocket_id?: number;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  job: string;
  level?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CharacterEquipment {
  id: string;
  character_id: string;
  slot_name: string;
  equipment_id: number;
  current_starforce?: number;
  target_starforce?: number;
  current_potential?: string;
  target_potential?: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Equipment methods
  async getAllEquipment(): Promise<Equipment[]> {
    console.log('🔍 Fetching all equipment...');
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .order('name');

    console.log('📊 Supabase response:', { data, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Equipment data retrieved:', data?.length || 0, 'items');
    return (data as Equipment[]) || [];
  }

  async getEquipmentById(id: number): Promise<Equipment | null> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Equipment | null;
  }

  async getStarforceableEquipment(): Promise<Equipment[]> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('starforceable', true)
      .order('name');

    if (error) throw error;
    return (data as Equipment[]) || [];
  }

  // Get equipment by type
  async getEquipmentByType(type: string): Promise<Equipment[]> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('type', type)
      .order('name');

    if (error) throw error;
    return (data as Equipment[]) || [];
  }

  // Alternative method name for equipment by type
  async findEquipmentByType(type: string): Promise<Equipment[]> {
    return this.getEquipmentByType(type);
  }

  // Get equipment by job and type (filters by type and job compatibility)
  async getEquipmentByJobAndType(type: string, job: string) {
    const characterClass = getClassByJob(job);

    if (!characterClass) {
      throw new Error(`Invalid job: ${job}`);
    }
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('type', type)
      .or(
        `class.eq.common,and(class.eq.${characterClass},job.is.null),and(class.eq.${characterClass},job.eq.{}),job.cs.{${job}},and(class.eq.unique,job.cs.{${job}})`,
      )
      .order('level', { ascending: true });

    if (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }

    return data;
  }

  async createEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    const { data, error } = await this.supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create equipment');
    return data as Equipment;
  }

  async updateEquipment(
    id: number,
    equipment: Partial<Equipment>,
  ): Promise<Equipment> {
    const { data, error } = await this.supabase
      .from('equipment')
      .update(equipment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update equipment');
    return data as Equipment;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Equipment Template methods
  async getAllTemplates(): Promise<EquipmentTemplate[]> {
    const { data, error } = await this.supabase
      .from('equipment_template')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data as EquipmentTemplate[]) || [];
  }

  async getTemplateById(id: number): Promise<EquipmentTemplate | null> {
    const { data, error } = await this.supabase
      .from('equipment_template')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as EquipmentTemplate | null;
  }

  async createTemplate(
    template: Omit<EquipmentTemplate, 'id'>,
  ): Promise<EquipmentTemplate> {
    const { data, error } = await this.supabase
      .from('equipment_template')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create template');
    return data as EquipmentTemplate;
  }

  async updateTemplate(
    id: number,
    template: Partial<EquipmentTemplate>,
  ): Promise<EquipmentTemplate> {
    const { data, error } = await this.supabase
      .from('equipment_template')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update template');
    return data as EquipmentTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('equipment_template')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Search methods
  async searchEquipment(searchTerm: string): Promise<Equipment[]> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .or(
        `name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,slot.ilike.%${searchTerm}%`,
      )
      .order('name');

    if (error) throw error;
    return (data as Equipment[]) || [];
  }

  // Character methods
  async getAllCharacters(userId: string): Promise<Character[]> {
    const { data, error } = await this.supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Character[]) || [];
  }

  async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await this.supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Character | null;
  }

  async createCharacter(
    character: Omit<Character, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Character> {
    const { data, error } = await this.supabase
      .from('characters')
      .insert(character)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create character');
    return data as Character;
  }

  async updateCharacter(
    id: string,
    character: Partial<Omit<Character, 'id' | 'user_id'>>,
  ): Promise<Character> {
    const { data, error } = await this.supabase
      .from('characters')
      .update(character)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update character');
    return data as Character;
  }

  async deleteCharacter(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Character Equipment methods
  async getCharacterEquipment(
    characterId: string,
  ): Promise<CharacterEquipment[]> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .select(
        `
        *,
        equipment:equipment_id (
          id,
          name,
          type,
          set,
          job,
          class,
          level,
          base_attack,
          starforceable,
          maplestory_io_id,
          storage_url
        )
      `,
      )
      .eq('character_id', characterId)
      .order('slot_name');

    if (error) throw error;
    return (data as CharacterEquipment[]) || [];
  }

  async getCharacterEquipmentBySlot(
    characterId: string,
    slotName: string,
  ): Promise<CharacterEquipment | null> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .select(
        `
        *,
        equipment:equipment_id (
          id,
          name,
          type,
          set,
          job,
          class,
          level,
          base_attack,
          starforceable,
          maplestory_io_id,
          storage_url
        )
      `,
      )
      .eq('character_id', characterId)
      .eq('slot_name', slotName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as CharacterEquipment | null;
  }

  async createCharacterEquipment(
    equipment: Omit<CharacterEquipment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CharacterEquipment> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create character equipment');
    return data as CharacterEquipment;
  }

  async bulkCreateCharacterEquipment(
    equipmentList: Omit<
      CharacterEquipment,
      'id' | 'created_at' | 'updated_at'
    >[],
  ): Promise<CharacterEquipment[]> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .insert(equipmentList)
      .select();

    if (error) throw error;
    if (!data) throw new Error('Failed to bulk create character equipment');
    return data as CharacterEquipment[];
  }

  async upsertCharacterEquipment(
    equipment: Omit<CharacterEquipment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<CharacterEquipment> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .upsert(equipment, {
        onConflict: 'character_id,slot_name', // Unique constraint
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to upsert character equipment');
    return data as CharacterEquipment;
  }

  async bulkUpsertCharacterEquipment(
    equipmentList: Omit<
      CharacterEquipment,
      'id' | 'created_at' | 'updated_at'
    >[],
  ): Promise<CharacterEquipment[]> {
    const { data, error } = await this.supabase
      .from('character_equipment')
      .upsert(equipmentList, {
        onConflict: 'character_id,slot_name',
      })
      .select();

    if (error) throw error;
    if (!data) throw new Error('Failed to bulk upsert character equipment');
    return data as CharacterEquipment[];
  }

  async deleteCharacterEquipment(
    characterId: string,
    slotName: string,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('character_equipment')
      .delete()
      .eq('character_id', characterId)
      .eq('slot_name', slotName);

    if (error) throw error;
    return true;
  }

  async deleteAllCharacterEquipment(characterId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('character_equipment')
      .delete()
      .eq('character_id', characterId);

    if (error) throw error;
    return true;
  }
}
