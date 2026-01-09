/**
 * Status Condition Effects
 */

import type { StatusName } from '../../types';
import type { ActivePokemon } from '../pokemon/types';
import type { PRNG } from '../prng';

/**
 * Log callback type for status messages
 */
export type StatusLogger = (type: string, pokemon: ActivePokemon, status: string, extra?: string) => void;

/**
 * Try to set a status condition on a Pokemon
 */
export function trySetStatus(
  pokemon: ActivePokemon,
  status: StatusName,
  prng: PRNG,
  log: StatusLogger
): boolean {
  if (pokemon.fainted || pokemon.status) return false;

  // Type immunities
  if (status === 'brn' && pokemon.types.includes('Fire')) return false;
  if ((status === 'psn' || status === 'tox') &&
      (pokemon.types.includes('Poison') || pokemon.types.includes('Steel'))) return false;
  if (status === 'par' && pokemon.types.includes('Electric')) return false;
  if (status === 'frz' && pokemon.types.includes('Ice')) return false;

  pokemon.status = status;
  pokemon.statusData = {};

  if (status === 'slp') {
    pokemon.statusData.time = prng.random(2, 5);
  } else if (status === 'tox') {
    pokemon.statusData.time = 1;
  }

  log('status', pokemon, status);
  return true;
}

/**
 * Add a volatile status to a Pokemon
 */
export function addVolatile(
  pokemon: ActivePokemon,
  volatile: string,
  source: ActivePokemon | undefined,
  log: StatusLogger
): boolean {
  if (pokemon.fainted) return false;
  if (pokemon.volatiles[volatile]) return false;

  pokemon.volatiles[volatile] = { source: source?.name };
  log('start', pokemon, volatile);
  return true;
}
