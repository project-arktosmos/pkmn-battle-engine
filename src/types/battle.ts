/**
 * Battle-specific type definitions
 */

import type { PRNGSeed } from './index';
import type { PokemonSet } from './index';

/**
 * Options for creating a battle
 */
export interface BattleOptions {
  formatid?: string;
  seed?: PRNGSeed;
  send?: (type: string, data: string | string[]) => void;
  debug?: boolean;
}

/**
 * Options for setting a player
 */
export interface PlayerOptions {
  name?: string;
  team?: string | PokemonSet[];
}
