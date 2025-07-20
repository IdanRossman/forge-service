import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Equipment {
  id?: number;
  name: string;
  type: string;
  slot: string;
  set?: string;
  job?: string;
  class?: string;
  level: number;
  base_attack?: number;
  starforceable?: boolean;
  max_stars?: number;
  superior?: boolean;
  maplestory_io_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentTemplate {
  id?: number;
  name: string;
  description?: string;
  default_template?: boolean;
  is_public?: boolean;
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
  created_at?: string;
  updated_at?: string;
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

  async getAllEquipment(): Promise<Equipment[]> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getEquipmentById(id: number): Promise<Equipment | null> {
    const { data, error } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    const { data, error } = await this.supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllTemplates(): Promise<EquipmentTemplate[]> {
    const { data, error } = await this.supabase
      .from('equipment_template')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
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
    return data;
  }
}
