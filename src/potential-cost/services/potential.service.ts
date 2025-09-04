import { Injectable } from '@nestjs/common';
import {
  PotentialInput,
  InputOption,
  PotentialInputOptionsRequestDto,
  PotentialInputOptionsResponseDto,
  PotentialCalculationRequestDto,
  PotentialCalculationResponseDto,
  BulkPotentialCalculationRequestDto,
  BulkPotentialCalculationResponseDto,
  BulkPotentialItemResponseDto,
  BulkPotentialCalculationWithIndividualCubesRequestDto,
  BulkPotentialCalculationWithIndividualCubesResponseDto,
  BulkPotentialItemWithCubeResponseDto,
  DropdownOptionGroup,
} from '../contracts/potential-calculation.dto';
import { ItemType, PotentialTier } from '../contracts/potential-enums';
import { PotentialCalculationService } from './potential-calculation.service';
import { PotentialCostService } from './potential-cost.service';
import { CubeRatesDataService } from './cube-rates-data.service';

@Injectable()
export class PotentialService {
  constructor(
    private readonly calculationService: PotentialCalculationService,
    private readonly costService: PotentialCostService,
    private readonly cubeRatesDataService: CubeRatesDataService,
  ) {}

  // Get available input options for potential calculations
  public getInputOptions(
    request: PotentialInputOptionsRequestDto,
  ): PotentialInputOptionsResponseDto {
    const { itemType: clientItemType, itemLevel } = request;

    // Map client item type to backend ItemType
    const itemType = this.mapClientItemType(clientItemType);

    // Define available input categories with their descriptions and limits
    // These match the JavaScript emptyInputObject structure
    const allInputs: Record<keyof PotentialInput, InputOption> = {
      percStat: {
        description: 'At least this much % stat including % allstat lines',
        maxPossible: this.getMaxPossibleValue('percStat', itemType, itemLevel),
        increment: 1,
      },
      lineStat: {
        description:
          'At least this many lines of % stat including allstat lines',
        maxPossible: 3,
        increment: 1,
      },
      percAllStat: {
        description:
          'At least this much % all stat including 1/3rd of % STR, DEX, and LUK',
        maxPossible: this.getMaxPossibleValue(
          'percAllStat',
          itemType,
          itemLevel,
        ),
        increment: 1,
      },
      lineAllStat: {
        description:
          'At least this many lines of % all stat (does not include individual stats)',
        maxPossible: 3,
        increment: 1,
      },
      percHp: {
        description: 'At least this much % HP',
        maxPossible: this.getMaxPossibleValue('percHp', itemType, itemLevel),
        increment: 1,
      },
      lineHp: {
        description: 'At least this many lines of % HP',
        maxPossible: 3,
        increment: 1,
      },
      percAtt: {
        description: 'At least this much % attack',
        maxPossible: this.getMaxPossibleValue('percAtt', itemType, itemLevel),
        increment: 1,
      },
      lineAtt: {
        description: 'At least this many lines of % attack',
        maxPossible: 3,
        increment: 1,
      },
      percBoss: {
        description: 'At least this much % boss damage',
        maxPossible: this.getMaxPossibleValue('percBoss', itemType, itemLevel),
        increment: 1,
      },
      lineBoss: {
        description: 'At least this many lines of % boss damage',
        maxPossible: 3,
        increment: 1,
      },
      lineIed: {
        description: 'At least this many lines of ignore enemy defense',
        maxPossible: 3,
        increment: 1,
      },
      lineCritDamage: {
        description: 'At least this many lines of critical damage',
        maxPossible: 3,
        increment: 1,
      },
      lineMeso: {
        description: 'At least this many lines of meso',
        maxPossible: 3,
        increment: 1,
      },
      lineDrop: {
        description: 'At least this many lines of drop rate',
        maxPossible: 3,
        increment: 1,
      },
      lineMesoOrDrop: {
        description: 'At least this many lines of meso OR drop rate',
        maxPossible: 3,
        increment: 1,
      },
      secCooldown: {
        description: 'At least this many seconds of cooldown reduction',
        maxPossible: this.getMaxPossibleValue(
          'secCooldown',
          itemType,
          itemLevel,
        ),
        increment: 1,
      },
      lineAutoSteal: {
        description: 'At least this many lines of auto steal',
        maxPossible: 3,
        increment: 1,
      },
      lineAttOrBoss: {
        description: 'At least this many lines of attack OR boss damage',
        maxPossible: 3,
        increment: 1,
      },
      lineAttOrBossOrIed: {
        description:
          'At least this many lines of attack OR boss damage OR ignore enemy defense',
        maxPossible: 3,
        increment: 1,
      },
      lineBossOrIed: {
        description:
          'At least this many lines of boss damage OR ignore enemy defense',
        maxPossible: 3,
        increment: 1,
      },
    };

    // Generate dropdown options based on item type
    const dropdownOptions = this.generateDropdownOptions(
      itemType,
      itemLevel,
      PotentialTier.LEGENDARY, // Default to legendary for now
    );

    return {
      itemType,
      itemLevel,
      dropdownOptions,
    };
  }

  // Filter input options based on item type
  // Based on the JavaScript reference UI logic for updateDesiredStatsOptions()
  private filterInputsByItemType(
    allInputs: Record<keyof PotentialInput, InputOption>,
    itemType: ItemType,
  ): Record<keyof PotentialInput, InputOption> {
    const filteredInputs: Partial<Record<keyof PotentialInput, InputOption>> =
      {};

    // Helper function to add specific inputs
    const addInputs = (inputKeys: string[]) => {
      inputKeys.forEach((key) => {
        if (allInputs[key as keyof PotentialInput]) {
          filteredInputs[key as keyof PotentialInput] =
            allInputs[key as keyof PotentialInput];
        }
      });
    };

    // Common stat lines for armor pieces (non-weapon items)
    const commonArmorStats = [
      'percStat',
      'lineStat',
      'percAllStat',
      'lineAllStat',
      'percHp',
      'lineHp',
    ];

    switch (itemType) {
      case ItemType.WEAPON:
      case ItemType.SECONDARY:
        // Weapons and secondaries: attack-focused options
        addInputs([
          'percAtt',
          'lineAtt',
          'percBoss',
          'lineBoss',
          'lineIed',
          'lineAttOrBoss',
          'lineAttOrBossOrIed',
          'lineBossOrIed',
        ]);
        break;

      case ItemType.GLOVES:
        // Gloves: stat lines + crit damage + auto steal
        addInputs([...commonArmorStats, 'lineCritDamage', 'lineAutoSteal']);
        break;

      case ItemType.HAT:
        // Hats: stat lines + cooldown reduction
        addInputs([...commonArmorStats, 'secCooldown']);
        break;

      case ItemType.ACCESSORY:
      case ItemType.RING:
      case ItemType.PENDANT:
        // Accessories: stat lines + meso/drop (legendary only)
        addInputs([
          ...commonArmorStats,
          'lineMeso',
          'lineDrop',
          'lineMesoOrDrop',
        ]);
        break;

      case ItemType.SHOES:
      case ItemType.BELT:
      case ItemType.SHOULDER:
      case ItemType.CAPE:
      case ItemType.ARMOR:
        // Standard armor pieces: only stat lines (no utility options)
        addInputs(commonArmorStats);
        break;

      case ItemType.HEART:
      case ItemType.BADGE:
        // Hearts and badges: mainly stat lines
        addInputs(commonArmorStats);
        break;

      default:
        // For unknown types, include all options as fallback
        Object.keys(allInputs).forEach((key) => {
          filteredInputs[key as keyof PotentialInput] =
            allInputs[key as keyof PotentialInput];
        });
        break;
    }

    return filteredInputs as Record<keyof PotentialInput, InputOption>;
  }

  // Calculate maximum possible value for percentage-based inputs
  private getMaxPossibleValue(
    inputType: keyof PotentialInput,
    itemType: ItemType,
    itemLevel: number,
  ): number {
    // These are rough estimates based on legendary tier maximums
    // Level 160+ items get +1% per line for stat-based categories

    switch (inputType) {
      case 'percStat':
        // 3 lines of 12% base + 1% level bonus per line = 3 × 13% = 39%
        return itemLevel >= 160 ? 39 : 36;
      case 'percAllStat':
        // All stat lines: prime = 10%, regular = 7%, max = 3 × 10% = 30%
        return 30;
      case 'percHp':
        // HP% can go higher on certain items (3 × 12% = 36% base)
        return itemLevel >= 160 ? 39 : 36;
      case 'percAtt':
        // Attack% is premium, usually lower max values (3 × 12% = 36% base)
        return itemLevel >= 160 ? 39 : 36;
      case 'percBoss':
        // Boss damage can go up to ~40% (no level bonus for boss damage)
        return 40;
      case 'secCooldown':
        // Cooldown reduction in seconds, usually 1-2 per line
        return 6;
      default:
        return 50; // Safe default
    }
  }

  // Main calculation method
  public calculatePotential(
    request: PotentialCalculationRequestDto,
  ): PotentialCalculationResponseDto {
    console.log('=== DEBUG calculatePotential ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    
    const {
      itemType: clientItemType,
      cubeType,
      itemLevel,
      isDMT = false,
    } = request;
    
    console.log('Extracted cubeType:', cubeType);
    console.log('Extracted cubeType type:', typeof cubeType);

    // Map client item type to backend ItemType
    const itemType = this.mapClientItemType(clientItemType);

    // Parse input from selectedOption only (simplified approach)
    const probabilityInput = this.parseDisplayText(request.selectedOption);

    try {
      // Get cube rates data from injected service
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cubeRatesData = this.cubeRatesDataService.getCubeRates();

      // Calculate probability using the core calculation service
      const probability = this.calculationService.calculateProbability(
        PotentialTier.LEGENDARY, // Always legendary
        probabilityInput,
        itemType,
        cubeType,
        itemLevel,
        cubeRatesData,
      );

      if (probability <= 0) {
        throw new Error('Impossible combination - probability is 0');
      }

      // Calculate costs (no tier upgrade costs, just legendary rerolling)
      const costResults = this.costService.calculateTotalCost(
        probability,
        cubeType,
        itemLevel,
        undefined, // No current tier (already legendary)
        undefined, // No desired tier (already legendary)
        isDMT,
      );

      return {
        probability,
        averageCubes: costResults.potentialAchievementCubes.averageCubes,
        medianCubes: costResults.potentialAchievementCubes.medianCubes,
        percentile75Cubes:
          costResults.potentialAchievementCubes.percentile75Cubes,
        averageCost: costResults.totalCosts.averageCost,
        medianCost: costResults.totalCosts.medianCost,
        percentile75Cost: costResults.totalCosts.percentile75Cost,
        inputParameters: {
          selectedOption: request.selectedOption,
          itemType,
          cubeType,
          itemLevel,
          isDMT,
        },
      };
    } catch (error) {
      throw new Error(`Calculation failed: ${(error as Error).message}`);
    }
  }

  // Bulk calculation method
  public calculateBulkPotential(
    request: BulkPotentialCalculationRequestDto,
  ): BulkPotentialCalculationResponseDto {
    const { cubeType, isDMT, items } = request;
    const results: BulkPotentialItemResponseDto[] = [];
    let totalAverageCost = 0;
    let totalMedianCost = 0;
    let totalAverageCubes = 0;

    for (const item of items) {
      try {
        // Build calculation request for each item
        const calculationRequest: PotentialCalculationRequestDto = {
          selectedOption: item.selectedOption,
          itemType: item.itemType, // Client-friendly name
          cubeType,
          itemLevel: item.itemLevel,
          isDMT,
        };

        const result = this.calculatePotential(calculationRequest);
        
        results.push({
          itemType: item.itemType,
          itemLevel: item.itemLevel,
          selectedOption: item.selectedOption,
          itemName: item.itemName,
          result,
          error: null,
        });

        // Add to totals
        totalAverageCost += result.averageCost;
        totalMedianCost += result.medianCost;
        totalAverageCubes += result.averageCubes;
      } catch (error) {
        // For bulk calculations, include error information
        results.push({
          itemType: item.itemType,
          itemLevel: item.itemLevel,
          selectedOption: item.selectedOption,
          itemName: item.itemName,
          result: null,
          error: (error as Error).message,
        });
        
        console.error(
          `Bulk calculation failed for item ${item.itemName || 'unnamed'}: ${(error as Error).message}`,
        );
      }
    }

    return {
      results,
      summary: {
        totalAverageCost,
        totalMedianCost,
        totalAverageCubes,
        itemCount: results.length,
      },
    };
  }

  // Bulk calculation method with individual cube types per item
  public calculateBulkPotentialWithIndividualCubes(
    request: BulkPotentialCalculationWithIndividualCubesRequestDto,
  ): BulkPotentialCalculationWithIndividualCubesResponseDto {
    console.log('=== DEBUG service calculateBulkPotentialWithIndividualCubes ===');
    console.log('Full request:', JSON.stringify(request, null, 2));
    
    const { items } = request;
    const results: BulkPotentialItemWithCubeResponseDto[] = [];
    let totalAverageCost = 0;
    let totalMedianCost = 0;
    let totalAverageCubes = 0;

    for (const item of items) {
      console.log('=== DEBUG processing item ===');
      console.log('Item:', JSON.stringify(item, null, 2));
      console.log('cubeType value:', item.cubeType);
      console.log('cubeType type:', typeof item.cubeType);
      
      try {
        // Ensure cubeType is properly set
        if (!item.cubeType) {
          throw new Error(`Missing cubeType for item: ${item.itemName || 'unnamed'}`);
        }
        
        // Build calculation request for each item with its own cube type
        const calculationRequest: PotentialCalculationRequestDto = {
          selectedOption: item.selectedOption,
          itemType: item.itemType, // Client-friendly name
          cubeType: item.cubeType, // Each item has its own cube type
          itemLevel: item.itemLevel,
          isDMT: item.isDMT || false, // Each item can have its own DMT setting
        };

        const result = this.calculatePotential(calculationRequest);
        
        results.push({
          itemType: item.itemType,
          itemLevel: item.itemLevel,
          selectedOption: item.selectedOption,
          cubeType: item.cubeType,
          isDMT: item.isDMT,
          itemName: item.itemName,
          result,
          error: undefined,
        });

        // Add to totals
        totalAverageCost += result.averageCost;
        totalMedianCost += result.medianCost;
        totalAverageCubes += result.averageCubes;
      } catch (error) {
        // For bulk calculations, include error information
        results.push({
          itemType: item.itemType,
          itemLevel: item.itemLevel,
          selectedOption: item.selectedOption,
          cubeType: item.cubeType,
          isDMT: item.isDMT,
          itemName: item.itemName,
          result: undefined,
          error: (error as Error).message,
        });
        
        console.error(
          `Bulk calculation with individual cubes failed for item ${item.itemName || 'unnamed'}: ${(error as Error).message}`,
        );
      }
    }

    return {
      results,
      summary: {
        totalAverageCost,
        totalMedianCost,
        totalAverageCubes,
        itemCount: results.length,
      },
    };
  }

  // Helper method to create empty potential input
  public createEmptyPotentialInput(): PotentialInput {
    return {
      percStat: 0,
      lineStat: 0,
      percAllStat: 0,
      lineAllStat: 0,
      percHp: 0,
      lineHp: 0,
      percAtt: 0,
      lineAtt: 0,
      percBoss: 0,
      lineBoss: 0,
      lineIed: 0,
      lineCritDamage: 0,
      lineMeso: 0,
      lineDrop: 0,
      lineMesoOrDrop: 0,
      secCooldown: 0,
      lineAutoSteal: 0,
      lineAttOrBoss: 0,
      lineAttOrBossOrIed: 0,
      lineBossOrIed: 0,
    };
  }

  // Parse display text back to PotentialInput (reverse of dropdown generation)
  private parseDisplayText(displayText: string): PotentialInput {
    const defaultInput = {
      percStat: 0,
      lineStat: 0,
      percAllStat: 0,
      lineAllStat: 0,
      percHp: 0,
      lineHp: 0,
      percAtt: 0,
      lineAtt: 0,
      percBoss: 0,
      lineBoss: 0,
      lineIed: 0,
      lineCritDamage: 0,
      lineMeso: 0,
      lineDrop: 0,
      lineMesoOrDrop: 0,
      secCooldown: 0,
      lineAutoSteal: 0,
      lineAttOrBoss: 0,
      lineAttOrBossOrIed: 0,
      lineBossOrIed: 0,
    };

    // Parse percentage-based patterns
    
    // Attack patterns: "21%+ Attack", "24%+ Attack", etc.
    const attackMatch = displayText.match(/^(\d+)%\+\s+Attack$/);
    if (attackMatch) {
      return { ...defaultInput, percAtt: parseInt(attackMatch[1], 10) };
    }

    // Boss patterns: "30%+ Boss", "35%+ Boss", etc.
    const bossMatch = displayText.match(/^(\d+)%\+\s+Boss$/);
    if (bossMatch) {
      return { ...defaultInput, percBoss: parseInt(bossMatch[1], 10) };
    }

    // Stat patterns: "21%+ Stat", "27%+ Stat", etc.
    const statMatch = displayText.match(/^(\d+)%\+\s+Stat$/);
    if (statMatch) {
      return { ...defaultInput, percStat: parseInt(statMatch[1], 10) };
    }

    // Line-based patterns

    // Attack lines: "1 Line Attack%", "2 Line Attack%", etc.
    const lineAttackMatch = displayText.match(/^(\d+)\s+Line\s+Attack%$/);
    if (lineAttackMatch) {
      return { ...defaultInput, lineAtt: parseInt(lineAttackMatch[1], 10) };
    }

    // Boss lines: "1 Line Boss%", "2 Line Boss%", etc.
    const lineBossMatch = displayText.match(/^(\d+)\s+Line\s+Boss%$/);
    if (lineBossMatch) {
      return { ...defaultInput, lineBoss: parseInt(lineBossMatch[1], 10) };
    }

    // IED lines: "1 Line IED", "2 Line IED", etc.
    const lineIedMatch = displayText.match(/^(\d+)\s+Line\s+IED$/);
    if (lineIedMatch) {
      return { ...defaultInput, lineIed: parseInt(lineIedMatch[1], 10) };
    }

    // Crit damage lines: "1 Line Crit Dmg%", "2 Line Crit Dmg%", etc.
    const lineCritMatch = displayText.match(/^(\d+)\s+Line\s+Crit\s+Dmg%$/);
    if (lineCritMatch) {
      return { ...defaultInput, lineCritDamage: parseInt(lineCritMatch[1], 10) };
    }

    // Meso lines: "1 Line Mesos Obtained%", etc.
    const lineMesoMatch = displayText.match(/^(\d+)\s+Line\s+Mesos\s+Obtained%$/);
    if (lineMesoMatch) {
      return { ...defaultInput, lineMeso: parseInt(lineMesoMatch[1], 10) };
    }

    // Drop lines: "1 Line Item Drop%", "3 Line Drop%", etc.
    const lineDropMatch = displayText.match(/^(\d+)\s+Line\s+(Item\s+)?Drop%$/);
    if (lineDropMatch) {
      return { ...defaultInput, lineDrop: parseInt(lineDropMatch[1], 10) };
    }

    // Combination OR patterns

    // Attack or Boss: "1 Line Attack% or Boss%", etc.
    const lineAttOrBossMatch = displayText.match(/^(\d+)\s+Line\s+Attack%\s+or\s+Boss%$/);
    if (lineAttOrBossMatch) {
      return { ...defaultInput, lineAttOrBoss: parseInt(lineAttOrBossMatch[1], 10) };
    }

    // Attack, Boss, or IED: "1 Line Attack% or Boss% or IED", etc.
    const lineAttOrBossOrIedMatch = displayText.match(/^(\d+)\s+Line\s+Attack%\s+or\s+Boss%\s+or\s+IED$/);
    if (lineAttOrBossOrIedMatch) {
      return { ...defaultInput, lineAttOrBossOrIed: parseInt(lineAttOrBossOrIedMatch[1], 10) };
    }

    // Meso or Drop: "1 Line of Item Drop% or Mesos Obtained%", "2 Lines Involving Item Drop% or Mesos Obtained%", etc.
    const lineMesoOrDropMatch = displayText.match(/^(\d+)\s+Lines?\s+.*?(Item\s+Drop%|Mesos\s+Obtained%)/);
    if (lineMesoOrDropMatch) {
      return { ...defaultInput, lineMesoOrDrop: parseInt(lineMesoOrDropMatch[1], 10) };
    }

    // Cooldown patterns: "-2sec+ CD Reduction", "-3sec+ CD Reduction", etc.
    const cooldownMatch = displayText.match(/^-(\d+)sec\+\s+CD\s+Reduction$/);
    if (cooldownMatch) {
      return { ...defaultInput, secCooldown: parseInt(cooldownMatch[1], 10) };
    }

    // Complex combination patterns

    // Attack + Boss combinations: "21%+ Attack and 30%+ Boss", etc.
    const attackBossMatch = displayText.match(/^(\d+)%\+\s+Attack\s+and\s+(\d+)%\+\s+Boss$/);
    if (attackBossMatch) {
      return {
        ...defaultInput,
        percAtt: parseInt(attackBossMatch[1], 10),
        percBoss: parseInt(attackBossMatch[2], 10),
      };
    }

    // Attack + IED combinations: "21%+ Attack and IED", etc.
    const attackIedMatch = displayText.match(/^(\d+)%\+\s+Attack\s+and\s+IED$/);
    if (attackIedMatch) {
      return {
        ...defaultInput,
        percAtt: parseInt(attackIedMatch[1], 10),
        lineIed: 1,
      };
    }

    // Line Attack + Line Boss: "1 Line Attack% + 1 Line Boss%", etc.
    const lineAttBossMatch = displayText.match(/^(\d+)\s+Line\s+Attack%\s+\+\s+(\d+)\s+Line\s+Boss%$/);
    if (lineAttBossMatch) {
      return {
        ...defaultInput,
        lineAtt: parseInt(lineAttBossMatch[1], 10),
        lineBoss: parseInt(lineAttBossMatch[2], 10),
      };
    }

    // Crit + Stat combinations: "1 Line Crit Dmg% and 1 line Stat", etc.
    const critStatMatch = displayText.match(/^(\d+)\s+Line\s+Crit\s+Dmg%\s+and\s+(\d+)\s+line\s+Stat$/);
    if (critStatMatch) {
      return {
        ...defaultInput,
        lineCritDamage: parseInt(critStatMatch[1], 10),
        lineStat: parseInt(critStatMatch[2], 10),
      };
    }

    // Meso + Stat combinations: "1 Line Mesos Obtained% and 1 line Stat", etc.
    const mesoStatMatch = displayText.match(/^1\s+Line\s+Mesos\s+Obtained%\s+and\s+1\s+line\s+Stat$/);
    if (mesoStatMatch) {
      return { ...defaultInput, lineMeso: 1, lineStat: 1 };
    }

    // Drop + Stat combinations: "1 Line Item Drop% and 1 line Stat", etc.
    const dropStatMatch = displayText.match(/^1\s+Line\s+Item\s+Drop%\s+and\s+1\s+line\s+Stat$/);
    if (dropStatMatch) {
      return { ...defaultInput, lineDrop: 1, lineStat: 1 };
    }

    // Meso/Drop + Stat: "1 Line of (Item Drop% or Mesos Obtained%) with 1 line Stat"
    if (displayText === '1 Line of (Item Drop% or Mesos Obtained%) with 1 line Stat') {
      return { ...defaultInput, lineMesoOrDrop: 1, lineStat: 1 };
    }

    // Cooldown + Stat combinations: "-2sec+ CD Reduction and 1 Line Stat", etc.
    const cooldownStatMatch = displayText.match(/^-(\d+)sec\+\s+CD\s+Reduction\s+and\s+(\d+)\s+Line\s+Stat$/);
    if (cooldownStatMatch) {
      return {
        ...defaultInput,
        secCooldown: parseInt(cooldownStatMatch[1], 10),
        lineStat: parseInt(cooldownStatMatch[2], 10),
      };
    }

    // Attack + Useful lines combinations: "1 Line attack with 1 Line Attack% or Boss% or IED", etc.
    const attackUsefulMatch = displayText.match(/^(\d+)\s+Line\s+attack\s+with\s+(\d+)\s+Line\s+Attack%/);
    if (attackUsefulMatch) {
      return {
        ...defaultInput,
        lineAtt: parseInt(attackUsefulMatch[1], 10),
        lineAttOrBossOrIed: parseInt(attackUsefulMatch[2], 10),
      };
    }

    throw new Error(`Unable to parse display text: "${displayText}"`);
  }

  // Map client equipment names to backend ItemType categories
  private mapClientItemType(clientItemType: string): ItemType {
    const lowercaseType = clientItemType.toLowerCase();

    // Check for equipment types that don't have potentials
    if (lowercaseType === 'pocket') {
      throw new Error(
        'Pocket items do not have potentials and cannot be enhanced',
      );
    }

    const itemTypeMapping: Record<string, ItemType> = {
      // Accessories
      ring: ItemType.RING,
      pendant: ItemType.PENDANT,
      earring: ItemType.ACCESSORY, // Earrings use generic accessory
      earrings: ItemType.ACCESSORY, // Database uses plural form
      eye: ItemType.ACCESSORY, // Eye accessory
      face: ItemType.ACCESSORY, // Face accessory

      // Armor pieces
      hat: ItemType.HAT,
      top: ItemType.ARMOR,
      bottom: ItemType.ARMOR,
      overall: ItemType.ARMOR,
      shoes: ItemType.SHOES,
      gloves: ItemType.GLOVES,
      cape: ItemType.CAPE,
      shoulder: ItemType.SHOULDER,
      belt: ItemType.BELT,

      // Weapons and others
      weapon: ItemType.WEAPON,
      secondary: ItemType.SECONDARY,
      heart: ItemType.HEART,
      badge: ItemType.BADGE,
      emblem: ItemType.EMBLEM, // Emblems get attack options like weapons

      // Direct mappings (already correct)
      accessory: ItemType.ACCESSORY,
      armor: ItemType.ARMOR,
    };

    const mappedType = itemTypeMapping[lowercaseType];
    if (!mappedType) {
      throw new Error(`Unknown item type: ${clientItemType}`);
    }

    return mappedType;
  }

  // Generate dropdown options based on JavaScript reference logic
  private generateDropdownOptions(
    itemType: ItemType,
    itemLevel: number,
    desiredTier: PotentialTier,
  ): DropdownOptionGroup[] {
    const options: DropdownOptionGroup[] = [];

    // Helper functions from JavaScript reference
    const getPrimeLineValue = (
      level: number,
      tier: number,
      type: string = 'normal',
    ): number => {
      const levelBonus = level >= 160 ? 1 : 0;
      const base = type === 'allStat' ? 0 : 3;
      return base + 3 * tier + levelBonus;
    };

    const get3LAtkOptionAmounts = (prime: number): number[] => {
      const ppp = prime * 3;
      const ppn = ppp - 3;
      const pnn = ppp - 6;
      return [pnn, ppn, ppp].filter((x) => x > 0);
    };

    const get3LStatOptionAmounts = (prime: number): number[] => {
      const ppp = prime * 3;
      const pna = ppp - 9;
      const paa = ppp - 12;
      const aaa = ppp - 15;
      const idkman = ppp - 18;
      const nonAllStatOptions = get3LAtkOptionAmounts(prime);
      return [idkman, aaa, paa, pna, ...nonAllStatOptions].filter((x) => x > 0);
    };

    const get2LAtkOptionAmounts = (prime: number): number[] => {
      const pp = prime * 2;
      const pn = pp - 3;
      const nn = pp - 6;
      return [nn, pn, pp];
    };

    // Generate options based on item type (following JavaScript updateDesiredStatsOptions logic)
    if (itemType === ItemType.WEAPON || itemType === ItemType.SECONDARY || itemType === ItemType.EMBLEM) {
      // Weapons get attack options (addCommonWSEOptions)
      const prime = getPrimeLineValue(itemLevel, desiredTier);
      const threeLineOptionAmounts = get3LAtkOptionAmounts(prime);
      const twoLineOptionAmounts = get2LAtkOptionAmounts(prime);
      const attackOptionsAmounts = [...twoLineOptionAmounts, ...threeLineOptionAmounts];

      // Attack percentage options
      options.push({
        label: 'Attack',
        options: attackOptionsAmounts.map((val) => ({
          value: `percAtt+${val}`,
          displayText: `${val}%+ Attack`,
        })),
      });

      // Attack with IED combination options
      options.push({
        label: 'Attack With 1 Line of IED',
        options: twoLineOptionAmounts.map((val) => ({
          value: `lineIed+1&percAtt+${val}`,
          displayText: `${val}%+ Attack and IED`,
        })),
      });

      // Hide boss for emblem or epic tier
      const showBoss = itemType !== ItemType.EMBLEM && desiredTier >= PotentialTier.UNIQUE;
      const shortAnyText = `(Attack${showBoss ? '/Boss' : ''}/IED)`;
      const longAnyText = `Attack% ${showBoss ? 'or Boss% ' : ''}or IED`;

      // Any useful lines (Attack/Boss/IED)
      options.push({
        label: `Any Useful Lines ${shortAnyText}`,
        options: [
          {
            value: 'lineAttOrBossOrIed+1',
            displayText: `1 Line ${longAnyText}`,
          },
          {
            value: 'lineAttOrBossOrIed+2',
            displayText: `2 Line ${longAnyText}`,
          },
          {
            value: 'lineAttOrBossOrIed+3',
            displayText: `3 Line ${longAnyText}`,
          },
        ],
      });

      // Attack + Any useful lines combinations
      options.push({
        label: 'Attack + Any Useful Lines',
        options: [
          {
            value: 'lineAtt+1&lineAttOrBossOrIed+2',
            displayText: `1 Line attack with 1 Line ${longAnyText}`,
          },
          {
            value: 'lineAtt+1&lineAttOrBossOrIed+3',
            displayText: `1 Line attack with 2 Line ${longAnyText}`,
          },
          {
            value: 'lineAtt+2&lineAttOrBossOrIed+3',
            displayText: `2 Line attack with 1 Line ${longAnyText}`,
          },
        ],
      });

      // Add SE-specific options (not for emblem)
      if (itemType !== ItemType.EMBLEM && desiredTier >= PotentialTier.UNIQUE) {
        const [_, pn, pp] = get2LAtkOptionAmounts(prime);

        // Attack and Boss damage combinations
        options.push({
          label: 'Attack and Boss Damage',
          options: [
            {
              value: 'lineAtt+1&lineBoss+1',
              displayText: '1 Line Attack% + 1 Line Boss%',
            },
            {
              value: 'lineAtt+1&lineBoss+2',
              displayText: '1 Line Attack% + 2 Line Boss%',
            },
            {
              value: 'lineAtt+2&lineBoss+1',
              displayText: '2 Line Attack% + 1 Line Boss%',
            },
            {
              value: `percAtt+${pn}&percBoss+30`,
              displayText: `${pn}%+ Attack and 30%+ Boss`,
            },
            ...(desiredTier === PotentialTier.LEGENDARY ? [
              {
                value: `percAtt+${pn}&percBoss+35`,
                displayText: `${pn}%+ Attack and 35%+ Boss`,
              },
              {
                value: `percAtt+${pn}&percBoss+40`,
                displayText: `${pn}%+ Attack and 40%+ Boss`,
              },
            ] : []),
            {
              value: `percAtt+${pp}&percBoss+30`,
              displayText: `${pp}%+ Attack and 30%+ Boss`,
            },
          ],
        });

        // Attack or Boss damage
        options.push({
          label: 'Attack or Boss Damage',
          options: [
            {
              value: 'lineAttOrBoss+1',
              displayText: '1 Line Attack% or Boss%',
            },
            {
              value: 'lineAttOrBoss+2',
              displayText: '2 Line Attack% or Boss%',
            },
            {
              value: 'lineAttOrBoss+3',
              displayText: '3 Line Attack% or Boss%',
            },
          ],
        });
      }
    } else {
      // Non-weapons get stat options (addNormalStatOptions)
      const primeLineValue = getPrimeLineValue(itemLevel, desiredTier, 'normal');
      const statAmounts = get3LStatOptionAmounts(primeLineValue);

      options.push({
        label: 'Stat',
        options: statAmounts.map((val) => ({
          value: `percStat+${val}`,
          displayText: `${val}%+ Stat`,
        })),
      });
    }

    // Add item-specific options
    if (itemType === ItemType.GLOVES && desiredTier === PotentialTier.LEGENDARY) {
      // Crit damage options
      options.push({
        label: 'Crit Damage',
        options: [
          { value: 'lineCritDamage+1', displayText: '1 Line Crit Dmg%' },
          { value: 'lineCritDamage+2', displayText: '2 Line Crit Dmg%' },
          { value: 'lineCritDamage+3', displayText: '3 Line Crit Dmg%' },
          { value: 'lineCritDamage+1&lineStat+1', displayText: '1 Line Crit Dmg% and 1 line Stat' },
          { value: 'lineCritDamage+1&lineStat+2', displayText: '1 Line Crit Dmg% and 2 line Stat' },
          { value: 'lineCritDamage+2&lineStat+1', displayText: '2 Line Crit Dmg% and 1 line Stat' },
        ],
      });
    }

    if ((itemType === ItemType.ACCESSORY || itemType === ItemType.RING || itemType === ItemType.PENDANT) && desiredTier === PotentialTier.LEGENDARY) {
      // Drop/Meso options
      options.push({
        label: 'Drop/Meso',
        options: [
          { value: 'lineMeso+1', displayText: '1 Line Mesos Obtained%' },
          { value: 'lineDrop+1', displayText: '1 Line Item Drop%' },
          { value: 'lineMesoOrDrop+1', displayText: '1 Line of Item Drop% or Mesos Obtained%' },
          { value: 'lineMeso+2', displayText: '2 Line Mesos Obtained%' },
          { value: 'lineDrop+2', displayText: '2 Line Item Drop%' },
          { value: 'lineMesoOrDrop+2', displayText: '2 Lines Involving Item Drop% or Mesos Obtained%' },
          { value: 'lineMeso+3', displayText: '3 Line Mesos Obtained%' },
          { value: 'lineDrop+3', displayText: '3 Line Drop%' },
          { value: 'lineMeso+1&lineStat+1', displayText: '1 Line Mesos Obtained% and 1 line Stat' },
          { value: 'lineDrop+1&lineStat+1', displayText: '1 Line Item Drop% and 1 line Stat' },
          { value: 'lineMesoOrDrop+1&lineStat+1', displayText: '1 Line of (Item Drop% or Mesos Obtained%) with 1 line Stat' },
        ],
      });
    }

    if (itemType === ItemType.HAT && desiredTier === PotentialTier.LEGENDARY) {
      // Cooldown reduction options
      options.push({
        label: 'Cooldown',
        options: [
          { value: 'secCooldown+2', displayText: '-2sec+ CD Reduction' },
          { value: 'secCooldown+3', displayText: '-3sec+ CD Reduction' },
          { value: 'secCooldown+4', displayText: '-4sec+ CD Reduction' },
          { value: 'secCooldown+5', displayText: '-5sec+ CD Reduction' },
          { value: 'secCooldown+6', displayText: '-6sec+ CD Reduction' },
          { value: 'secCooldown+2&lineStat+1', displayText: '-2sec+ CD Reduction and 1 Line Stat' },
          { value: 'secCooldown+2&lineStat+2', displayText: '-2sec+ CD Reduction and 2 Line Stat' },
          { value: 'secCooldown+3&lineStat+1', displayText: '-3sec+ CD Reduction and 1 Line Stat' },
          { value: 'secCooldown+4&lineStat+1', displayText: '-4sec+ CD Reduction and 1 Line Stat' },
        ],
      });
    }

    return options;
  }
}
