/**
 * Pokemon Creation
 */

import { Dex } from '../../dex/dex';
import { toID } from '../../utils/id';
import { calculateStats } from './stats';
import type { PokemonSet } from '../../types';
import type { ActivePokemon } from './types';
import type { BattleSide } from '../side/types';

/**
 * Create an ActivePokemon from a PokemonSet
 */
export function createPokemon(set: PokemonSet, side: BattleSide, position: number): ActivePokemon {
  const species = Dex.species.get(set.species);
  const level = set.level || 100;

  // Calculate stats
  const stats = calculateStats(species.baseStats, set.evs, set.ivs, level, set.nature);

  // Get moves with PP
  const moveSlots = set.moves.map(moveName => {
    const move = Dex.moves.get(moveName);
    return {
      id: move.exists ? move.id : toID(moveName),
      pp: move.exists ? move.pp : 0,
      maxpp: move.exists ? move.pp : 0,
      disabled: false,
    };
  });

  return {
    name: set.name || species.name,
    species: species.name,
    level,
    hp: stats.hp,
    maxhp: stats.hp,
    status: '',
    statusData: {},
    types: species.exists ? [...species.types] : ['Normal'],
    ability: set.ability || (species.exists ? species.abilities['0'] : ''),
    item: set.item || '',
    moves: set.moves,
    baseStats: species.exists ? { ...species.baseStats } : { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
    stats,
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 },
    isActive: false,
    fainted: false,
    position,
    side,
    moveSlots,
    volatiles: {},
    set,
  };
}

/**
 * Convert Pokemon to side info format for requests
 */
export function pokemonToSideInfo(pokemon: ActivePokemon): any {
  return {
    ident: `${pokemon.side.id}: ${pokemon.name}`,
    details: `${pokemon.species}, L${pokemon.level}${pokemon.set.gender ? ', ' + pokemon.set.gender : ''}`,
    condition: pokemon.fainted ? '0 fnt' : `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ' ' + pokemon.status : ''}`,
    active: pokemon.isActive,
    stats: {
      atk: pokemon.stats.atk,
      def: pokemon.stats.def,
      spa: pokemon.stats.spa,
      spd: pokemon.stats.spd,
      spe: pokemon.stats.spe,
    },
    moves: pokemon.moves.map(m => toID(m)),
    baseAbility: toID(pokemon.ability),
    item: toID(pokemon.item),
    pokeball: 'pokeball',
  };
}
