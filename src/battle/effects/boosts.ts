/**
 * Stat Boost Effects
 */

import type { ActivePokemon, Boosts } from '../pokemon/types';

/**
 * Log callback type for recording boost messages
 */
export type BoostLogger = (type: 'boost' | 'unboost', pokemon: ActivePokemon, stat: string, amount: number) => void;

/**
 * Apply stat boosts to a Pokemon
 */
export function applyBoosts(
  pokemon: ActivePokemon,
  boosts: Partial<Boosts>,
  log: BoostLogger
): boolean {
  let success = false;

  for (const [stat, amount] of Object.entries(boosts) as Array<[keyof Boosts, number]>) {
    if (!amount) continue;

    const oldBoost = pokemon.boosts[stat];
    let newBoost = oldBoost + amount;

    // Clamp to [-6, 6]
    newBoost = Math.max(-6, Math.min(6, newBoost));

    if (newBoost === oldBoost) {
      // Can't go any higher/lower
      continue;
    }

    pokemon.boosts[stat] = newBoost;
    success = true;

    if (amount > 0) {
      log('boost', pokemon, stat, Math.abs(amount));
    } else {
      log('unboost', pokemon, stat, Math.abs(amount));
    }
  }

  return success;
}
