/**
 * Pokemon Types - Interfaces for Pokemon in battle
 */

import type { StatsTable, TypeName, StatusName, PokemonSet } from '../../types';
import type { BattleSide } from '../side/types';

/**
 * An active Pokemon in battle
 */
export interface ActivePokemon {
  name: string;
  species: string;
  level: number;
  hp: number;
  maxhp: number;
  status: StatusName;
  statusData: { time?: number; source?: string };
  types: TypeName[];
  ability: string;
  item: string;
  moves: string[];
  baseStats: StatsTable;
  stats: StatsTable;
  boosts: {
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
    accuracy: number;
    evasion: number;
  };
  isActive: boolean;
  fainted: boolean;
  position: number;
  side: BattleSide;
  moveSlots: Array<{ id: string; pp: number; maxpp: number; disabled: boolean }>;
  volatiles: Record<string, { duration?: number; source?: string }>;
  /** Original set data */
  set: PokemonSet;
}

/**
 * Boosts type alias for convenience
 */
export type Boosts = ActivePokemon['boosts'];
