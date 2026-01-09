/**
 * Side Types - Interfaces for battle sides (players)
 */

import type { SideID } from '../../types';
import type { ActivePokemon } from '../pokemon/types';

/**
 * A side (player) in battle
 */
export interface BattleSide {
  id: SideID;
  name: string;
  pokemon: ActivePokemon[];
  active: (ActivePokemon | null)[];
  request: any;
  choice: { actions: string[]; done: boolean };
  faintedThisTurn: boolean;
  faintedLastTurn: boolean;
}
