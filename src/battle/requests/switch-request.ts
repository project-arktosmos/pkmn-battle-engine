/**
 * Switch Request Creation
 */

import { pokemonToSideInfo } from '../pokemon/create';
import type { BattleSide } from '../side/types';

/**
 * Create a switch request for a side (when Pokemon has fainted)
 */
export function createSwitchRequest(side: BattleSide): any {
  return {
    requestType: 'switch',
    forceSwitch: [true],
    side: {
      name: side.name,
      id: side.id,
      pokemon: side.pokemon.map(p => pokemonToSideInfo(p)),
    },
  };
}
