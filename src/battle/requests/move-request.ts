/**
 * Move Request Creation
 */

import { Dex } from '../../dex/dex';
import { pokemonToSideInfo } from '../pokemon/create';
import type { ActivePokemon } from '../pokemon/types';
import type { BattleSide } from '../side/types';

/**
 * Create a move request for a side
 */
export function createMoveRequest(side: BattleSide): any {
  const active = side.active[0]!;

  return {
    requestType: 'move',
    active: [{
      moves: active.moveSlots.map((slot, i) => {
        const move = Dex.moves.get(active.moves[i]);
        return {
          move: move.exists ? move.name : active.moves[i],
          id: slot.id,
          pp: slot.pp,
          maxpp: slot.maxpp,
          target: move.exists ? move.target : 'normal',
          disabled: slot.disabled || slot.pp === 0,
        };
      }),
      trapped: !!active.volatiles['trapped'],
    }],
    side: {
      name: side.name,
      id: side.id,
      pokemon: side.pokemon.map(p => pokemonToSideInfo(p)),
    },
  };
}
