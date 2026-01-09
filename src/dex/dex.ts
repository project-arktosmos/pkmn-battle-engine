/**
 * Dex - Pokemon Data Access Layer
 *
 * Provides access to all Pokemon game data including species, moves,
 * abilities, items, types, natures, conditions, and formats.
 */

import { DataAPI } from './data-api';
import { TypesAPI } from './types-api';
import { toID } from '../utils/id';
import { SpeciesData } from '../data/species';
import { MovesData } from '../data/moves';
import { AbilitiesData } from '../data/abilities';
import { ItemsData } from '../data/items';
import { NaturesData } from '../data/natures';
import { TypesData } from '../data/types';
import { ConditionsData } from '../data/conditions';
import { FormatsData } from '../data/formats';
import type {
  SpeciesData as SpeciesDataType,
  MoveData,
  AbilityData,
  ItemData,
  NatureData,
  TypeData,
  ConditionData,
  FormatData,
  TypeName,
  StatID,
  StatIDExceptHP,
} from '../types';

/**
 * Stats utility
 */
const StatsUtil = {
  ids(): StatID[] {
    return ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  },

  shortNames: {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe',
  } as Record<StatID, string>,

  getID(name: string): StatID | null {
    const lower = name.toLowerCase();
    const mapping: Record<string, StatID> = {
      hp: 'hp',
      atk: 'atk',
      attack: 'atk',
      def: 'def',
      defense: 'def',
      spa: 'spa',
      spatk: 'spa',
      specialattack: 'spa',
      spd: 'spd',
      spdef: 'spd',
      specialdefense: 'spd',
      spe: 'spe',
      speed: 'spe',
    };
    return mapping[lower] || null;
  },
};

/**
 * Main Dex class - singleton instance for accessing all Pokemon data
 */
class DexClass {
  readonly species = new DataAPI<SpeciesDataType>(SpeciesData, {
    num: 0,
    name: '',
    types: [],
    baseStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilities: { 0: '' },
    heightm: 0,
    weightkg: 0,
    color: '',
    eggGroups: [],
  });

  readonly moves = new DataAPI<MoveData>(MovesData, {
    num: 0,
    name: '',
    type: 'Normal' as TypeName,
    category: 'Physical',
    basePower: 0,
    accuracy: 100,
    pp: 0,
    priority: 0,
    target: 'normal',
    flags: {},
  });

  readonly abilities = new DataAPI<AbilityData>(AbilitiesData, {
    num: 0,
    name: '',
  });

  readonly items = new DataAPI<ItemData>(ItemsData, {
    num: 0,
    name: '',
  });

  readonly natures = new DataAPI<NatureData>(NaturesData, {
    name: '' as any,
  });

  readonly types = new TypesAPI(TypesData, {
    name: '' as TypeName,
    damageTaken: {},
  });

  readonly conditions = new DataAPI<ConditionData>(ConditionsData, {
    name: '',
  });

  readonly formats = new DataAPI<FormatData>(FormatsData, {
    name: '',
    mod: 'gen9',
  });

  readonly stats = StatsUtil;

  /**
   * Get type effectiveness.
   * Returns: 1 for super effective, 0 for neutral, -1 for not very effective
   */
  getEffectiveness(source: string, target: string | string[]): number {
    const targets = Array.isArray(target) ? target : [target];
    let total = 0;

    for (const t of targets) {
      const typeData = this.types.get(t);
      if (!typeData.exists) continue;

      const damageTaken = typeData.damageTaken[source];
      if (damageTaken === 1) {
        // Super effective
        total += 1;
      } else if (damageTaken === 2) {
        // Not very effective
        total -= 1;
      } else if (damageTaken === 3) {
        // Immune - return immediately
        return -Infinity;
      }
    }

    return total;
  }

  /**
   * Check if a type is immune to another.
   * Returns false if immune, true if can be hit.
   */
  getImmunity(source: string, target: string | string[]): boolean {
    const targets = Array.isArray(target) ? target : [target];

    for (const t of targets) {
      const typeData = this.types.get(t);
      if (!typeData.exists) continue;

      const damageTaken = typeData.damageTaken[source];
      if (damageTaken === 3) {
        return false; // Immune
      }
    }

    return true;
  }

  /**
   * Get a sanitized name (capitalize first letter of each word)
   */
  getName(name: string): string {
    if (!name) return '';
    return name
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

/**
 * The singleton Dex instance
 */
export const Dex = new DexClass();
