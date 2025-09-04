// Potential calculation enums and constants
// Ported from JavaScript potential calculator

export enum PotentialTier {
  RARE = 0,
  EPIC = 1,
  UNIQUE = 2,
  LEGENDARY = 3,
}

export enum CubeType {
  OCCULT = 'occult',
  MASTER = 'master',
  MEISTER = 'meister',
  RED = 'red',
  BLACK = 'black',
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  HEART = 'heart',
  BADGE = 'badge',
  SECONDARY = 'secondary',
  RING = 'ring',
  PENDANT = 'pendant',
  BELT = 'belt',
  SHOULDER = 'shoulder',
  GLOVES = 'gloves',
  SHOES = 'shoes',
  CAPE = 'cape',
  HAT = 'hat',
  // Additional specific equipment types from database
  EARRINGS = 'earrings',
  EMBLEM = 'emblem',
  EYE = 'eye',
  FACE = 'face',
  POCKET = 'pocket',
  TOP = 'top',
  BOTTOM = 'bottom',
}

// Categories from the JavaScript CATEGORY object
export enum PotentialCategory {
  STR_PERC = 'STR %',
  DEX_PERC = 'DEX %',
  INT_PERC = 'INT %',
  LUK_PERC = 'LUK %',
  MAXHP_PERC = 'Max HP %',
  MAXMP_PERC = 'Max MP %',
  ALLSTATS_PERC = 'All Stats %',
  ATT_PERC = 'ATT %',
  MATT_PERC = 'MATT %',
  BOSSDMG_PERC = 'Boss Damage',
  IED_PERC = 'Ignore Enemy Defense %',
  MESO_PERC = 'Meso Amount %',
  DROP_PERC = 'Item Drop Rate %',
  AUTOSTEAL_PERC = 'Chance to auto steal %',
  CRITDMG_PERC = 'Critical Damage %',
  CDR_TIME = 'Skill Cooldown Reduction',
  JUNK = 'Junk',

  // Special lines for probability adjustment calculations
  DECENT_SKILL = 'Decent Skill',
  INVINCIBLE_PERC = 'Chance of being invincible for seconds when hit',
  INVINCIBLE_TIME = 'Increase invincibility time after being hit',
  IGNOREDMG_PERC = 'Chance to ignore % damage when hit',
}

// Calculation types
export enum CalculationType {
  LINE = 0,
  VALUE = 1,
}

// Tier number to text mapping
export const TIER_NUMBER_TO_TEXT: Record<number, string> = {
  3: 'legendary',
  2: 'unique',
  1: 'epic',
  0: 'rare',
};

// Maximum category counts for special lines
export const MAX_CATEGORY_COUNT: Record<string, number> = {
  [PotentialCategory.DECENT_SKILL]: 1,
  [PotentialCategory.INVINCIBLE_TIME]: 1,
  [PotentialCategory.IED_PERC]: 3,
  [PotentialCategory.BOSSDMG_PERC]: 3,
  [PotentialCategory.DROP_PERC]: 3,
  [PotentialCategory.IGNOREDMG_PERC]: 2,
  [PotentialCategory.INVINCIBLE_PERC]: 2,
};

// Categories affected by item level adjustments (lvl 160+)
export const LEVEL_AFFECTED_CATEGORIES = [
  PotentialCategory.STR_PERC,
  PotentialCategory.LUK_PERC,
  PotentialCategory.DEX_PERC,
  PotentialCategory.INT_PERC,
  PotentialCategory.ALLSTATS_PERC,
  PotentialCategory.ATT_PERC,
  PotentialCategory.MATT_PERC,
  PotentialCategory.MAXHP_PERC,
];
