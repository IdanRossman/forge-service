import { Injectable } from '@nestjs/common';
import {
  PotentialTier,
  CubeType,
  ItemType,
  PotentialCategory,
  CalculationType,
  TIER_NUMBER_TO_TEXT,
  MAX_CATEGORY_COUNT,
  LEVEL_AFFECTED_CATEGORIES,
} from '../contracts/potential-enums';
import { PotentialInput } from '../contracts/potential-calculation.dto';

// Type definitions matching the JavaScript structure
export type CubeLineData = [string, number, number]; // [category, value, rate]
export type OutcomeData = [CubeLineData, CubeLineData, CubeLineData]; // Three lines

export interface CubeData {
  first_line: CubeLineData[];
  second_line: CubeLineData[];
  third_line: CubeLineData[];
}

// Input category mapping - matches the JavaScript INPUT_CATEGORY_MAP
const INPUT_CATEGORY_MAP: Record<keyof PotentialInput, PotentialCategory[]> = {
  percStat: [PotentialCategory.STR_PERC, PotentialCategory.ALLSTATS_PERC],
  lineStat: [PotentialCategory.STR_PERC, PotentialCategory.ALLSTATS_PERC],
  percAllStat: [
    PotentialCategory.ALLSTATS_PERC,
    PotentialCategory.STR_PERC,
    PotentialCategory.DEX_PERC,
    PotentialCategory.LUK_PERC,
  ],
  lineAllStat: [PotentialCategory.ALLSTATS_PERC],
  percHp: [PotentialCategory.MAXHP_PERC],
  lineHp: [PotentialCategory.MAXHP_PERC],
  percAtt: [PotentialCategory.ATT_PERC],
  lineAtt: [PotentialCategory.ATT_PERC],
  percBoss: [PotentialCategory.BOSSDMG_PERC],
  lineBoss: [PotentialCategory.BOSSDMG_PERC],
  lineIed: [PotentialCategory.IED_PERC],
  lineCritDamage: [PotentialCategory.CRITDMG_PERC],
  lineMeso: [PotentialCategory.MESO_PERC],
  lineDrop: [PotentialCategory.DROP_PERC],
  lineMesoOrDrop: [PotentialCategory.DROP_PERC, PotentialCategory.MESO_PERC],
  secCooldown: [PotentialCategory.CDR_TIME],
  lineAutoSteal: [PotentialCategory.AUTOSTEAL_PERC],
  lineAttOrBoss: [PotentialCategory.ATT_PERC, PotentialCategory.BOSSDMG_PERC],
  lineAttOrBossOrIed: [
    PotentialCategory.ATT_PERC,
    PotentialCategory.BOSSDMG_PERC,
    PotentialCategory.IED_PERC,
  ],
  lineBossOrIed: [PotentialCategory.BOSSDMG_PERC, PotentialCategory.IED_PERC],
};

@Injectable()
export class PotentialCalculationService {
  // Convert item type for cube data access (matches JavaScript convertItemType)
  private convertItemType(itemType: ItemType): string {
    // Map ItemType enum to cube data keys
    switch (itemType) {
      case ItemType.ACCESSORY:
      case ItemType.PENDANT:
      case ItemType.RING:
      case ItemType.EARRINGS:
      case ItemType.EYE:
      case ItemType.FACE:
        return 'ring';

      case ItemType.BADGE:
        return 'heart';

      case ItemType.ARMOR:
        return 'top';

      case ItemType.HAT:
        return 'hat';

      case ItemType.TOP:
        return 'top';

      case ItemType.BOTTOM:
        return 'bottom';

      case ItemType.SHOES:
        return 'shoes';

      case ItemType.GLOVES:
        return 'gloves';

      case ItemType.CAPE:
        return 'cape';

      case ItemType.SHOULDER:
        return 'shoulder';

      case ItemType.BELT:
        return 'belt';

      case ItemType.WEAPON:
        return 'weapon';

      case ItemType.SECONDARY:
        return 'secondary';

      case ItemType.EMBLEM:
        return 'emblem';

      case ItemType.HEART:
        return 'heart';

      default:
        return itemType.toLowerCase();
    }
  }

  // Check if a category is a special line
  private isSpecialLine(category: string): boolean {
    return Object.keys(MAX_CATEGORY_COUNT).includes(category);
  }

  // Calculate total for a specific category in an outcome
  private calculateTotal(
    outcome: OutcomeData,
    desiredCategory: PotentialCategory,
    calcType: CalculationType = CalculationType.LINE,
  ): number {
    let actualVal = 0;
    for (const line of outcome) {
      const [category, val] = line;
      if (category === desiredCategory.toString()) {
        if (calcType === CalculationType.VALUE) {
          actualVal += val;
        } else if (calcType === CalculationType.LINE) {
          actualVal += 1;
        }
      }
    }
    return actualVal;
  }

  // Check percentage all stat requirement (special calculation)
  private checkPercAllStat(outcome: OutcomeData, requiredVal: number): boolean {
    let actualVal = 0;
    for (const line of outcome) {
      const [category, val] = line;
      if (category === PotentialCategory.ALLSTATS_PERC.toString()) {
        actualVal += val;
      } else if (
        [
          PotentialCategory.STR_PERC.toString(),
          PotentialCategory.DEX_PERC.toString(),
          PotentialCategory.LUK_PERC.toString(),
        ].includes(category)
      ) {
        actualVal += val / 3;
      }
    }
    return actualVal >= requiredVal;
  }

  // Outcome match function map - matches JavaScript OUTCOME_MATCH_FUNCTION_MAP
  private getOutcomeMatchFunctions(): Record<
    keyof PotentialInput,
    (outcome: OutcomeData, requiredVal: number) => boolean
  > {
    return {
      percStat: (outcome, requiredVal) =>
        this.calculateTotal(
          outcome,
          PotentialCategory.STR_PERC,
          CalculationType.VALUE,
        ) +
          this.calculateTotal(
            outcome,
            PotentialCategory.ALLSTATS_PERC,
            CalculationType.VALUE,
          ) >=
        requiredVal,
      lineStat: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.STR_PERC) +
          this.calculateTotal(outcome, PotentialCategory.ALLSTATS_PERC) >=
        requiredVal,
      percAllStat: (outcome, requiredVal) =>
        this.checkPercAllStat(outcome, requiredVal),
      lineAllStat: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.ALLSTATS_PERC) >=
        requiredVal,
      percHp: (outcome, requiredVal) =>
        this.calculateTotal(
          outcome,
          PotentialCategory.MAXHP_PERC,
          CalculationType.VALUE,
        ) >= requiredVal,
      lineHp: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.MAXHP_PERC) >=
        requiredVal,
      percAtt: (outcome, requiredVal) =>
        this.calculateTotal(
          outcome,
          PotentialCategory.ATT_PERC,
          CalculationType.VALUE,
        ) >= requiredVal,
      lineAtt: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.ATT_PERC) >= requiredVal,
      percBoss: (outcome, requiredVal) =>
        this.calculateTotal(
          outcome,
          PotentialCategory.BOSSDMG_PERC,
          CalculationType.VALUE,
        ) >= requiredVal,
      lineBoss: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.BOSSDMG_PERC) >=
        requiredVal,
      lineIed: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.IED_PERC) >= requiredVal,
      lineCritDamage: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.CRITDMG_PERC) >=
        requiredVal,
      lineMeso: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.MESO_PERC) >=
        requiredVal,
      lineDrop: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.DROP_PERC) >=
        requiredVal,
      lineMesoOrDrop: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.MESO_PERC) +
          this.calculateTotal(outcome, PotentialCategory.DROP_PERC) >=
        requiredVal,
      secCooldown: (outcome, requiredVal) =>
        this.calculateTotal(
          outcome,
          PotentialCategory.CDR_TIME,
          CalculationType.VALUE,
        ) >= requiredVal,
      lineAutoSteal: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.AUTOSTEAL_PERC) >=
        requiredVal,
      lineAttOrBoss: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.ATT_PERC) +
          this.calculateTotal(outcome, PotentialCategory.BOSSDMG_PERC) >=
        requiredVal,
      lineAttOrBossOrIed: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.ATT_PERC) +
          this.calculateTotal(outcome, PotentialCategory.BOSSDMG_PERC) +
          this.calculateTotal(outcome, PotentialCategory.IED_PERC) >=
        requiredVal,
      lineBossOrIed: (outcome, requiredVal) =>
        this.calculateTotal(outcome, PotentialCategory.BOSSDMG_PERC) +
          this.calculateTotal(outcome, PotentialCategory.IED_PERC) >=
        requiredVal,
    };
  }

  // Generate useful categories based on input
  private getUsefulCategories(
    probabilityInput: PotentialInput,
  ): PotentialCategory[] {
    let usefulCategories: PotentialCategory[] = [];
    for (const field in INPUT_CATEGORY_MAP) {
      if (probabilityInput[field as keyof PotentialInput] > 0) {
        usefulCategories = usefulCategories.concat(
          INPUT_CATEGORY_MAP[field as keyof PotentialInput],
        );
      }
    }
    return Array.from(new Set(usefulCategories));
  }

  // Consolidate rates to group irrelevant lines as junk
  private getConsolidatedRates(
    ratesList: CubeLineData[],
    usefulCategories: PotentialCategory[],
  ): CubeLineData[] {
    const consolidatedRates: CubeLineData[] = [];
    let junkRate = 0.0;
    const junkCategories: string[] = [];

    for (const item of ratesList) {
      const [category, val, rate] = item;

      if (
        usefulCategories.includes(category as PotentialCategory) ||
        this.isSpecialLine(category)
      ) {
        consolidatedRates.push(item);
      } else if (category === PotentialCategory.JUNK) {
        junkRate += rate;
        if (Array.isArray(val)) {
          junkCategories.push(...val);
        } else {
          junkCategories.push(`${val}`);
        }
      } else {
        junkRate += rate;
        junkCategories.push(`${category} (${val})`);
      }
    }

    consolidatedRates.push([
      PotentialCategory.JUNK,
      junkCategories.length,
      junkRate,
    ]);
    return consolidatedRates;
  }

  // Check if outcome satisfies input requirements
  private satisfiesInput(
    outcome: OutcomeData,
    probabilityInput: PotentialInput,
  ): boolean {
    const matchFunctions = this.getOutcomeMatchFunctions();
    for (const field in probabilityInput) {
      const key = field as keyof PotentialInput;
      if (probabilityInput[key] > 0) {
        if (!matchFunctions[key](outcome, probabilityInput[key])) {
          return false;
        }
      }
    }
    return true;
  }

  // Calculate adjusted rate for a line considering special line restrictions
  private getAdjustedRate(
    currentLine: CubeLineData,
    previousLines: CubeLineData[],
    currentPool: CubeLineData[],
  ): number {
    const [currentCategory] = currentLine;
    const currentRate = currentLine[2];

    // First line never has adjusted rates
    if (previousLines.length === 0) {
      return currentRate;
    }

    // Determine special categories that reached their limit
    const toBeRemoved: string[] = [];
    const prevSpecialLinesCount: Record<string, number> = {};

    for (const [cat] of previousLines) {
      if (this.isSpecialLine(cat)) {
        prevSpecialLinesCount[cat] = (prevSpecialLinesCount[cat] || 0) + 1;
      }
    }

    // Check if this outcome is valid and determine what to remove
    for (const [spCat, count] of Object.entries(prevSpecialLinesCount)) {
      const maxCount = MAX_CATEGORY_COUNT[spCat];
      if (
        count > maxCount ||
        (spCat === currentCategory && count + 1 > maxCount)
      ) {
        return 0; // Invalid outcome
      } else if (count === maxCount) {
        toBeRemoved.push(spCat);
      }
    }

    // Calculate adjusted total rate
    let adjustedTotal = 100;
    let adjustedFlag = false;

    for (const [cat, , rate] of currentPool) {
      if (toBeRemoved.includes(cat)) {
        adjustedTotal -= rate;
        adjustedFlag = true;
      }
    }

    return adjustedFlag ? (currentRate / adjustedTotal) * 100 : currentRate;
  }

  // Calculate rate for a specific outcome
  private calculateRate(
    outcome: OutcomeData,
    consolidatedCubeData: CubeData,
  ): number {
    const adjustedRates = [
      this.getAdjustedRate(outcome[0], [], consolidatedCubeData.first_line),
      this.getAdjustedRate(
        outcome[1],
        [outcome[0]],
        consolidatedCubeData.second_line,
      ),
      this.getAdjustedRate(
        outcome[2],
        [outcome[0], outcome[1]],
        consolidatedCubeData.third_line,
      ),
    ];

    let chance = 100;
    for (const rate of adjustedRates) {
      chance = chance * (rate / 100);
    }

    return chance;
  }

  // Convert cube data for item level adjustments (lvl 160+)
  private convertCubeDataForLevel(
    cubeData: CubeData,
    itemLevel: number,
  ): CubeData {
    if (itemLevel < 160) {
      return cubeData;
    }

    const adjustedCubeData: CubeData = {
      first_line: [],
      second_line: [],
      third_line: [],
    };

    for (const line of ['first_line', 'second_line', 'third_line'] as const) {
      adjustedCubeData[line] = [];
      for (const [cat, val, rate] of cubeData[line]) {
        let adjustedVal = val;

        // Adjust value if this is an affected category
        if (LEVEL_AFFECTED_CATEGORIES.map((c) => c.toString()).includes(cat)) {
          adjustedVal += 1;
        }

        adjustedCubeData[line].push([cat, adjustedVal, rate]);
      }
    }

    return adjustedCubeData;
  }

  // Main probability calculation method - matches JavaScript getProbability
  public calculateProbability(
    desiredTier: PotentialTier,
    probabilityInput: PotentialInput,
    itemType: ItemType,
    cubeType: CubeType,
    itemLevel: number,
    cubeRatesData: any, // We'll inject the cube rates data
  ): number {
    console.log('=== DEBUG calculateProbability ===');
    console.log('desiredTier:', desiredTier);
    console.log('itemType:', itemType);
    console.log('cubeType:', cubeType);
    console.log('probabilityInput:', probabilityInput);

    // Convert input for cube data access
    const tier = TIER_NUMBER_TO_TEXT[desiredTier];
    const itemLabel = this.convertItemType(itemType);

    console.log('tier:', tier);
    console.log('itemLabel:', itemLabel);
    console.log('cubeRatesData keys:', Object.keys(cubeRatesData || {}));

    if (cubeRatesData?.lvl120to200) {
      console.log('lvl120to200 keys:', Object.keys(cubeRatesData.lvl120to200));
      if (cubeRatesData.lvl120to200[itemLabel]) {
        console.log(
          `${itemLabel} keys:`,
          Object.keys(cubeRatesData.lvl120to200[itemLabel]),
        );
        if (cubeRatesData.lvl120to200[itemLabel][cubeType]) {
          console.log(
            `${itemLabel}.${cubeType} keys:`,
            Object.keys(cubeRatesData.lvl120to200[itemLabel][cubeType]),
          );
          if (cubeRatesData.lvl120to200[itemLabel][cubeType][tier]) {
            console.log(
              `${itemLabel}.${cubeType}.${tier} keys:`,
              Object.keys(cubeRatesData.lvl120to200[itemLabel][cubeType][tier]),
            );
          }
        }
      }
    }

    // Get cube data
    const rawCubeData: CubeData = {
      first_line:
        cubeRatesData.lvl120to200[itemLabel][cubeType][tier].first_line,
      second_line:
        cubeRatesData.lvl120to200[itemLabel][cubeType][tier].second_line,
      third_line:
        cubeRatesData.lvl120to200[itemLabel][cubeType][tier].third_line,
    };

    // Apply level adjustments
    const cubeData = this.convertCubeDataForLevel(rawCubeData, itemLevel);

    // Generate consolidated cube data
    const usefulCategories = this.getUsefulCategories(probabilityInput);
    const consolidatedCubeData: CubeData = {
      first_line: this.getConsolidatedRates(
        cubeData.first_line,
        usefulCategories,
      ),
      second_line: this.getConsolidatedRates(
        cubeData.second_line,
        usefulCategories,
      ),
      third_line: this.getConsolidatedRates(
        cubeData.third_line,
        usefulCategories,
      ),
    };

    // Calculate probability by checking all outcomes
    let totalChance = 0;

    for (const line1 of consolidatedCubeData.first_line) {
      for (const line2 of consolidatedCubeData.second_line) {
        for (const line3 of consolidatedCubeData.third_line) {
          const outcome: OutcomeData = [line1, line2, line3];
          if (this.satisfiesInput(outcome, probabilityInput)) {
            const result = this.calculateRate(outcome, consolidatedCubeData);
            totalChance += result;
          }
        }
      }
    }

    return totalChance / 100; // Return as probability (0-1)
  }
}
