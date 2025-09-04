import { Injectable } from '@nestjs/common';

export type ItemType = 'weapon' | 'gloves' | 'armor';

export interface StatGains {
  jobStat: number;
  visibleAtt: number;
  magicAtt: number;
  weaponAtt: number;
  hp: number;
  mp: number;
  def: number;
  totalValue: number;
}

@Injectable()
export class StarforceStatCalculationService {
  private readonly statWeights = {
    jobStat: 1, // Job stats are valuable
    visibleAtt: 5, // Attack power is premium
    magicAtt: 0, // Magic attack equivalent
    weaponAtt: 5, // Weapon attack on non-weapons
    hp: 0, // HP has minimal impact
    mp: 0, // MP even less
    def: 0, // Defense has some value
  };

  /**
   * Calculate total stat value for enhancing from one star level to another
   */
  calculateStatGains(
    fromStar: number,
    toStar: number,
    itemLevel: number,
    itemType: ItemType,
    baseAttack?: number,
  ): StatGains {
    const totalGains: StatGains = {
      jobStat: 0,
      visibleAtt: 0,
      magicAtt: 0,
      weaponAtt: 0,
      hp: 0,
      mp: 0,
      def: 0,
      totalValue: 0,
    };

    for (let star = fromStar; star < toStar; star++) {
      const starGains = this.getStatGainsForSingleStar(
        star,
        itemLevel,
        itemType,
        baseAttack,
      );
      totalGains.jobStat += starGains.jobStat;
      totalGains.visibleAtt += starGains.visibleAtt;
      totalGains.magicAtt += starGains.magicAtt;
      totalGains.weaponAtt += starGains.weaponAtt;
      totalGains.hp += starGains.hp;
      totalGains.mp += starGains.mp;
      totalGains.def += starGains.def;
    }

    // Calculate total weighted value
    totalGains.totalValue = this.calculateWeightedValue(totalGains);

    return totalGains;
  }

  /**
   * Get stat gains for a single star enhancement
   */
  private getStatGainsForSingleStar(
    starLevel: number,
    itemLevel: number,
    itemType: ItemType,
    baseAttack?: number,
  ): StatGains {
    const gains: StatGains = {
      jobStat: 0,
      visibleAtt: 0,
      magicAtt: 0,
      weaponAtt: 0,
      hp: 0,
      mp: 0,
      def: 0,
      totalValue: 0,
    };

    // 0★ → 14★ enhancements
    if (starLevel >= 0 && starLevel <= 14) {
      // Job Stat gains
      gains.jobStat = starLevel <= 4 ? 2 : 3;

      // Defense gains (armor only)
      if (itemType === 'armor') {
        gains.def = 5; // 5% def
      }

      // HP gains (armor only)
      if (itemType === 'armor') {
        if (starLevel <= 2) gains.hp = 5;
        else if (starLevel <= 4) gains.hp = 10;
        else if (starLevel <= 6) gains.hp = 15;
        else if (starLevel <= 8) gains.hp = 20;
        else gains.hp = 25;
      }

      // Weapon-specific gains (weapons get BOTH standard gains AND visible ATT)
      if (itemType === 'weapon') {
        // MP gains (in addition to job stat)
        if (starLevel <= 2) gains.mp = 5;
        else if (starLevel <= 4) gains.mp = 10;
        else if (starLevel <= 6) gains.mp = 15;
        else if (starLevel <= 8) gains.mp = 20;
        else gains.mp = 25;

        // Visible ATT gains (2% of base attack) - this is in ADDITION to job stat
        if (baseAttack) {
          gains.visibleAtt = baseAttack * 0.02; // 2% of base attack
        } else {
          // Fallback: estimate based on item level if no base attack provided
          const estimatedBaseAttack = itemLevel * 3.5; // Rough estimation
          gains.visibleAtt = estimatedBaseAttack * 0.02;
          console.warn(
            `Missing base_attack for weapon at level ${itemLevel}, using estimated value: ${estimatedBaseAttack}`,
          );
        }
      }

      // Gloves-specific gains
      if (
        itemType === 'gloves' &&
        (starLevel === 4 ||
          starLevel === 6 ||
          starLevel === 8 ||
          starLevel === 10 ||
          starLevel >= 12)
      ) {
        gains.visibleAtt = 1;
        gains.magicAtt = 1;
      }
    }

    // 15★+ enhancements
    else if (starLevel >= 15) {
      const highStarGains = this.getHighStarGains(
        starLevel + 1, // Pass target star, not starting star
        itemLevel,
        itemType,
      );
      gains.jobStat = highStarGains.visibleStat;
      gains.weaponAtt = highStarGains.weaponAtt;
      gains.magicAtt = highStarGains.magicAtt;
      gains.visibleAtt = highStarGains.visibleAtt;

      if (highStarGains.def) {
        gains.def = 5; // 5% def bonus
      }

      // IMPORTANT: Weapons should STILL get their MP bonuses at 15★+
      if (itemType === 'weapon') {
        // MP gains continue at 15★+ (max tier)
        gains.mp = 25;

        // NOTE: 2% base attack bonus ONLY applies to 0★→14★ enhancements
        // At 15★+, weapons only get the visible ATT from the high-star table
      }
    }

    return gains;
  }

  /**
   * Get item level tier for 15★+ calculations
   */
  private getItemLevelTier(itemLevel: number): string {
    if (itemLevel >= 128 && itemLevel <= 137) return '128-137';
    if (itemLevel >= 138 && itemLevel <= 149) return '138-149';
    if (itemLevel >= 150 && itemLevel <= 159) return '150-159';
    if (itemLevel >= 160 && itemLevel <= 199) return '160-199';
    if (itemLevel >= 200 && itemLevel <= 249) return '200-249';
    if (itemLevel === 250) return '250';
    return '128-137'; // Default fallback
  }

  /**
   * Get stat gains for 15★+ enhancements
   */
  private getHighStarGains(
    starLevel: number,
    itemLevel: number,
    itemType: ItemType,
  ) {
    const levelTier = this.getItemLevelTier(itemLevel);
    const gains = {
      visibleStat: 0,
      weaponAtt: 0,
      magicAtt: 0,
      visibleAtt: 0,
      def: false,
    };

    const levelTierStats: Record<
      string,
      { stat: number; nonWeaponAtt: number[]; weaponAtt: number[] }
    > = {
      '128-137': {
        stat: 7,
        nonWeaponAtt: [7, 8, 9, 10, 11],
        weaponAtt: [6, 7, 7, 8, 9],
      },
      '138-149': {
        stat: 9,
        nonWeaponAtt: [8, 9, 10, 11, 12, 13, 15, 17],
        weaponAtt: [7, 8, 8, 9, 10, 11, 12, 30],
      },
      '150-159': {
        stat: 11,
        nonWeaponAtt: [9, 10, 11, 12, 13, 14, 16, 18],
        weaponAtt: [8, 9, 9, 10, 11, 12, 13, 31],
      },
      '160-199': {
        stat: 13,
        nonWeaponAtt: [10, 11, 12, 13, 14, 15, 17, 19],
        weaponAtt: [9, 9, 10, 11, 12, 13, 14, 32],
      },
      '200-249': {
        stat: 15,
        nonWeaponAtt: [12, 13, 14, 15, 16, 17, 19, 21],
        weaponAtt: [13, 13, 14, 14, 15, 16, 17, 34],
      },
      '250': {
        stat: 17,
        nonWeaponAtt: [14, 15, 16, 17, 18, 19, 21, 23],
        weaponAtt: [0, 0, 0, 0, 0, 0, 0, 0],
      },
    };

    const tierData = levelTierStats[levelTier] || levelTierStats['128-137'];
    const starIndex = starLevel - 15; // 15★→16★ = index 0, 16★→17★ = index 1, etc.

    // Only calculate for stars up to 22★→23★ (index 7)
    if (starIndex >= 0 && starIndex < 8) {
      if (starLevel <= 21) {
        gains.visibleStat = tierData.stat;
      }

      if (itemType === 'armor') {
        gains.weaponAtt = tierData.nonWeaponAtt[starIndex] || 0;
        // Note: Armor only gets weaponAtt, not magicAtt (was double-counting before)
        gains.def = levelTier === '250';
      } else if (itemType === 'weapon') {
        gains.visibleAtt = tierData.weaponAtt[starIndex] || 0;
      }
      // Gloves don't get special 15★+ bonuses in this table
    }

    return gains;
  }

  /**
   * Calculate weighted value of stat gains
   */
  private calculateWeightedValue(gains: StatGains): number {
    return (
      gains.jobStat * this.statWeights.jobStat +
      gains.visibleAtt * this.statWeights.visibleAtt +
      gains.magicAtt * this.statWeights.magicAtt +
      gains.weaponAtt * this.statWeights.weaponAtt +
      gains.hp * this.statWeights.hp +
      gains.mp * this.statWeights.mp +
      gains.def * this.statWeights.def
    );
  }

  /**
   * Determine item type from item properties using database equipment type
   */
  determineItemType(item: any): ItemType {
    // Use the database type field directly with proper type checking
    if (!item || typeof item !== 'object') {
      console.warn('Item is null or not an object, defaulting to armor type');
      return 'armor';
    }

    // Try both 'type' (database field) and 'itemType' (DTO field)

    const equipmentType: string =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof item.type === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (item.type as string)
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          typeof item.itemType === 'string'
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            (item.itemType as string)
          : '';

    if (equipmentType) {
      switch (equipmentType.toLowerCase()) {
        case 'weapon':
          return 'weapon';
        case 'secondary':
          return 'weapon';
        case 'gloves':
          return 'gloves';
        default:
          return 'armor'; // All other equipment types default to armor
      }
    }

    // Fallback to armor if no type is provided
    console.warn(
      `Equipment missing type field, defaulting to armor: ${JSON.stringify(item)}`,
    );
    return 'armor';
  }
}
