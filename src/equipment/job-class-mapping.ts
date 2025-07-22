export enum MapleClass {
  WARRIOR = 'warrior',
  MAGE = 'magician',
  BOWMAN = 'bowman',
  THIEF = 'thief',
  PIRATE = 'pirate',
}

const JOB_TO_CLASS_MAP: Record<string, MapleClass> = {
  // Warrior jobs
  paladin: MapleClass.WARRIOR,
  hero: MapleClass.WARRIOR,
  'dark-knight': MapleClass.WARRIOR,
  'dawn-warrior': MapleClass.WARRIOR,
  mihile: MapleClass.WARRIOR,
  aran: MapleClass.WARRIOR,
  blaster: MapleClass.WARRIOR,
  'demon-slayer': MapleClass.WARRIOR,
  'demon-avenger': MapleClass.WARRIOR,
  kaiser: MapleClass.WARRIOR,
  hayato: MapleClass.WARRIOR,
  zero: MapleClass.WARRIOR,
  adele: MapleClass.WARRIOR,

  // Mage jobs
  'archmage-fire-poison': MapleClass.MAGE,
  'archmage-ice-lightning': MapleClass.MAGE,
  bishop: MapleClass.MAGE,
  'blaze-wizard': MapleClass.MAGE,
  luminous: MapleClass.MAGE,
  evan: MapleClass.MAGE,
  'battle-mage': MapleClass.MAGE,
  kanna: MapleClass.MAGE,
  lynn: MapleClass.MAGE,
  kinesis: MapleClass.MAGE,
  illium: MapleClass.MAGE,
  lara: MapleClass.MAGE,
  sia: MapleClass.MAGE,

  // Archer jobs
  bowmaster: MapleClass.BOWMAN,
  marksman: MapleClass.BOWMAN,
  pathfinder: MapleClass.BOWMAN,
  'wind-archer': MapleClass.BOWMAN,
  'wild-hunter': MapleClass.BOWMAN,
  mercedes: MapleClass.BOWMAN,
  kain: MapleClass.BOWMAN,

  // Thief jobs
  'night-lord': MapleClass.THIEF,
  shadower: MapleClass.THIEF,
  'dual-blade': MapleClass.THIEF,
  xenon: MapleClass.THIEF,
  phantom: MapleClass.THIEF,
  cadena: MapleClass.THIEF,
  hoyoung: MapleClass.THIEF,
  khali: MapleClass.THIEF,

  // Pirate jobs
  buccaneer: MapleClass.PIRATE,
  corsair: MapleClass.PIRATE,
  cannoneer: MapleClass.PIRATE,
  'thunder-breaker': MapleClass.PIRATE,
  shade: MapleClass.PIRATE,
  mechanic: MapleClass.PIRATE,
  'angelic-buster': MapleClass.PIRATE,
  ark: MapleClass.PIRATE,
  'mo-xuan': MapleClass.PIRATE,
};

/**
 * Gets the MapleStory class for a given job name
 * @param job The job name (case-insensitive)
 * @returns The corresponding MapleClass or null if job is invalid
 */
export function getClassByJob(job: string): MapleClass | null {
  return JOB_TO_CLASS_MAP[job.toLowerCase()] || null;
}

/**
 * Checks if a job name is valid
 * @param job The job name to validate (case-insensitive)
 * @returns True if the job is valid, false otherwise
 */
export function isValidJob(job: string): boolean {
  return job.toLowerCase() in JOB_TO_CLASS_MAP;
}
