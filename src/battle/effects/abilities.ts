/**
 * Ability Effects
 */

import { Dex } from '../../dex/dex';
import type { ActivePokemon, Boosts } from '../pokemon/types';
import type { BattleSide } from '../side/types';
import type { PRNG } from '../prng';
import type { StatusName } from '../../types';

/**
 * Callbacks for ability effects
 */
export interface AbilityCallbacks {
  log: (type: string, ...args: any[]) => void;
  boost: (pokemon: ActivePokemon, boosts: Partial<Boosts>, source?: ActivePokemon) => void;
  trySetStatus: (pokemon: ActivePokemon, status: StatusName, source?: ActivePokemon) => boolean;
}

/**
 * Run ability effects when a Pokemon switches in
 */
export function runAbilityOnSwitch(
  pokemon: ActivePokemon,
  opponent: BattleSide | null,
  callbacks: AbilityCallbacks
): void {
  const ability = Dex.abilities.get(pokemon.ability);
  if (!ability.exists) return;

  if (ability.id === 'intimidate') {
    // Lower opponent's attack
    if (opponent?.active[0] && !opponent.active[0].fainted) {
      callbacks.log('-ability', `${pokemon.side.id}a: ${pokemon.name}`, 'Intimidate');
      callbacks.boost(opponent.active[0], { atk: -1 }, pokemon);
    }
  }
}

/**
 * Run ability effects when contact is made
 */
export function runContactAbility(
  attacker: ActivePokemon,
  defender: ActivePokemon,
  prng: PRNG,
  callbacks: AbilityCallbacks
): void {
  const ability = Dex.abilities.get(defender.ability);
  if (!ability.exists) return;

  if (ability.id === 'static') {
    if (!attacker.status && prng.randomChance(30, 100)) {
      callbacks.trySetStatus(attacker, 'par', defender);
    }
  } else if (ability.id === 'poisonpoint') {
    if (!attacker.status && prng.randomChance(30, 100)) {
      callbacks.trySetStatus(attacker, 'psn', defender);
    }
  } else if (ability.id === 'flamebody') {
    if (!attacker.status && prng.randomChance(30, 100)) {
      callbacks.trySetStatus(attacker, 'brn', defender);
    }
  }
}
