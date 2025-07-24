import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/services/supabase.service';
import { getClassByJob } from '../equipment/job-class-mapping';

export interface TemplateEquipmentResult {
  slot_name: string;
  id: number;
  name: string;
  type: string;
  set: string;
  level: number;
  starforceable: boolean;
  storage_url: string;
  class: string;
  job: string[];
  current_starforce?: number;
  target_starforce?: number;
}

export interface TemplateSlot {
  slot_name: string;
  set_id: number;
  set_name: string;
  base_type: string;
}

@Injectable()
export class TemplateService {
  private tableWarningShown = false;

  private readonly SLOT_MAPPINGS = {
    hat: 'hat_set_id',
    top: 'top_set_id',
    bottom: 'bottom_set_id',
    weapon: 'weapon_set_id',
    secondary: 'secondary_set_id',
    gloves: 'gloves_set_id',
    shoes: 'shoes_set_id',
    cape: 'cape_set_id',
    shoulder: 'shoulder_set_id',
    belt: 'belt_set_id',
    face: 'face_accessory_set_id',
    eye: 'eye_accessory_set_id',
    earrings: 'earring_set_id',
    ring1: 'ring_1_set_id',
    ring2: 'ring_2_set_id',
    ring3: 'ring_3_set_id',
    ring4: 'ring_4_set_id',
    pendant1: 'pendant_1_set_id',
    pendant2: 'pendant_2_set_id',
    emblem: 'emblem_set_id',
    badge: 'badge_set_id',
    heart: 'heart_set_id',
    pocket: 'pocket_set_id',
  };

  constructor(private supabaseService: SupabaseService) {}

  async getTemplateEquipment(
    templateId: number,
    job: string = 'bishop',
  ): Promise<TemplateEquipmentResult[]> {
    // 1. Get template data with set information
    const template = await this.getTemplateWithSets(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // 2. Get active slots (slots with set_ids)
    const activeSlots = this.getActiveSlots(template);

    if (activeSlots.length === 0) {
      return [];
    }

    // 3. Get equipment for each slot in parallel
    const equipmentPromises = activeSlots.map((slot) =>
      this.getEquipmentForSlot(slot, job, templateId),
    );

    const equipmentResults = await Promise.all(equipmentPromises);

    // 4. Filter out nulls and return results
    return equipmentResults.filter(Boolean) as TemplateEquipmentResult[];
  }

  private async getTemplateWithSets(templateId: number) {
    // Use the existing SupabaseService method that has proper RLS context
    const template = await this.supabaseService.getTemplateById(templateId);

    if (!template) {
      return null;
    }

    // Get all unique set IDs from the template
    const setIds = new Set<number>();
    Object.entries(this.SLOT_MAPPINGS).forEach(([, setIdField]) => {
      const setId = template[setIdField];
      if (setId) {
        setIds.add(setId);
      }
    });

    if (setIds.size === 0) {
      return template;
    }

    // Fetch all sets in one query using direct client (sets table might not have RLS)
    const { data: sets, error: setsError } = await this.supabaseService.client
      .from('sets')
      .select('id, set')
      .in('id', Array.from(setIds));

    if (setsError) {
      console.error('Error fetching sets:', setsError);
      throw setsError;
    }

    // Create a map of set ID to set data
    const setMap = new Map();
    sets?.forEach((set) => {
      setMap.set(set.id, set);
    });

    // Attach set data to template
    const templateWithSets = { ...template };
    Object.entries(this.SLOT_MAPPINGS).forEach(([slotName, setIdField]) => {
      const setId = template[setIdField];
      if (setId && setMap.has(setId)) {
        templateWithSets[`${slotName}_set`] = setMap.get(setId);
      }
    });

    return templateWithSets;
  }

  private getActiveSlots(template: any): TemplateSlot[] {
    const activeSlots: TemplateSlot[] = [];

    for (const [slotName, setIdField] of Object.entries(this.SLOT_MAPPINGS)) {
      const setData = template[`${slotName}_set`];
      if (setData?.set && setData?.id) {
        activeSlots.push({
          slot_name: slotName,
          set_id: setData.id,
          set_name: setData.set,
          base_type: this.getBaseType(slotName),
        });
      }
    }

    return activeSlots;
  }

  private getBaseType(slotName: string): string {
    if (slotName.startsWith('ring')) return 'ring';
    if (slotName.startsWith('pendant')) return 'pendant';
    return slotName;
  }

  private async getEquipmentForSlot(
    slot: TemplateSlot,
    job: string,
    templateId: number,
  ): Promise<TemplateEquipmentResult | null> {
    try {
      // Get best equipment for this slot
      const equipment = await this.getBestEquipmentForSlot(
        slot.set_name,
        slot.base_type,
        job,
      );
      if (!equipment) {
        console.warn(
          `No equipment found for slot: ${slot.slot_name}, set: ${slot.set_name}, type: ${slot.base_type}, job: ${job}`,
        );
        return null;
      }

      // Get template info for this slot
      const templateInfo = await this.getTemplateInfo(
        templateId,
        slot.slot_name,
      );

      return {
        slot_name: slot.slot_name,
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        set: equipment.set,
        level: equipment.level || 0,
        starforceable: equipment.starforceable || false,
        storage_url: equipment.storage_url || '',
        class: equipment.class || '',
        job: equipment.job || [],
        current_starforce: templateInfo?.current_starforce ?? 0,
        target_starforce: templateInfo?.target_starforce ?? 0,
      };
    } catch (error) {
      console.error(
        `Error getting equipment for slot ${slot.slot_name}:`,
        error,
      );
      return null;
    }
  }

  private async getBestEquipmentForSlot(
    setName: string,
    equipmentType: string,
    job: string,
  ) {
    const characterClass = getClassByJob(job);

    if (!characterClass) {
      throw new Error(`Invalid job: ${job}`);
    }

    // Use the same logic as your existing getEquipmentByJobAndType method
    const { data, error } = await this.supabaseService.client
      .from('equipment')
      .select('*')
      .eq('set', setName)
      .eq('type', equipmentType)
      .or(
        `class.eq.common,and(class.eq.${characterClass},job.is.null),and(class.eq.${characterClass},job.cs.{${job}}),and(class.eq.unique,job.cs.{${job}})`,
      )
      .order('class', { ascending: false }) // Prioritize unique > class-specific > common
      .order('level', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching equipment for slot:', error);
      throw error;
    }

    return data?.[0];
  }

  private async getTemplateInfo(templateId: number, slotName: string) {
    const { data, error } = await this.supabaseService.client
      .from('equipment_template_info')
      .select('current_starforce, target_starforce')
      .eq('template_id', templateId)
      .eq('slot_name', slotName)
      .single();

    if (error) {
      // No record found - this is expected and normal
      if (error.code === 'PGRST116') {
        return null;
      }
      // Table doesn't exist - warn once on first occurrence
      if (error.code === '42P01') {
        if (!this.tableWarningShown) {
          console.warn(
            '⚠️  equipment_template_info table does not exist. Starforce values will default to 0.',
          );
          this.tableWarningShown = true;
        }
        return null;
      }
      // Other errors
      console.error('Error fetching template info:', error);
      return null;
    }

    return data;
  }

  // Helper method to get all sets used in a template
  async getTemplateSets(templateId: number): Promise<string[]> {
    const template = await this.getTemplateWithSets(templateId);
    if (!template) return [];

    const activeSlots = this.getActiveSlots(template);
    return [...new Set(activeSlots.map((slot) => slot.set_name))];
  }

  // Helper method to validate template completeness
  async validateTemplate(
    templateId: number,
    job: string,
  ): Promise<{ valid: boolean; missingSlots: string[] }> {
    const activeSlots = await this.getActiveSlots(
      await this.getTemplateWithSets(templateId),
    );
    const missingSlots: string[] = [];

    for (const slot of activeSlots) {
      const equipment = await this.getBestEquipmentForSlot(
        slot.set_name,
        slot.base_type,
        job,
      );
      if (!equipment) {
        missingSlots.push(slot.slot_name);
      }
    }

    return {
      valid: missingSlots.length === 0,
      missingSlots,
    };
  }
}
