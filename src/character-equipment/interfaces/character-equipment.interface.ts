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

export enum EquipmentSlot {
  HAT = 'hat',
  TOP = 'top',
  BOTTOM = 'bottom',
  WEAPON = 'weapon',
  SECONDARY = 'secondary',
  GLOVES = 'gloves',
  SHOES = 'shoes',
  CAPE = 'cape',
  SHOULDER = 'shoulder',
  BELT = 'belt',
  FACE_ACCESSORY = 'face_accessory',
  EYE_ACCESSORY = 'eye_accessory',
  EARRING = 'earring',
  RING_1 = 'ring1',
  RING_2 = 'ring2',
  RING_3 = 'ring3',
  RING_4 = 'ring4',
  PENDANT_1 = 'pendant1',
  PENDANT_2 = 'pendant2',
  EMBLEM = 'emblem',
  BADGE = 'badge',
  HEART = 'heart',
  POCKET = 'pocket',
}
