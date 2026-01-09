/**
 * Damage Calculation
 */

import { Dex } from '../../dex/dex';
import { PRNG } from '../prng';
import type { ActivePokemon } from '../pokemon/types';
import type { MoveData } from '../../types';

/**
 * Calculate damage for a move
 */
export function calculateDamage(
  attacker: ActivePokemon,
  defender: ActivePokemon,
  move: MoveData,
  prng: PRNG
): number {
  const level = attacker.level;
  const basePower = move.basePower;

  // Get attack and defense stats
  const isPhysical = move.category === 'Physical';
  let attack = isPhysical ? attacker.stats.atk : attacker.stats.spa;
  let defense = isPhysical ? defender.stats.def : defender.stats.spd;

  // Apply boosts
  const atkBoost = isPhysical ? attacker.boosts.atk : attacker.boosts.spa;
  const defBoost = isPhysical ? defender.boosts.def : defender.boosts.spd;

  if (atkBoost > 0) {
    attack = Math.floor(attack * (2 + atkBoost) / 2);
  } else if (atkBoost < 0) {
    attack = Math.floor(attack * 2 / (2 - atkBoost));
  }

  if (defBoost > 0) {
    defense = Math.floor(defense * (2 + defBoost) / 2);
  } else if (defBoost < 0) {
    defense = Math.floor(defense * 2 / (2 - defBoost));
  }

  // Burn halves physical attack
  if (isPhysical && attacker.status === 'brn') {
    attack = Math.floor(attack / 2);
  }

  // Damage formula
  let damage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * basePower * attack / defense) / 50) + 2;

  // STAB
  if (attacker.types.includes(move.type)) {
    damage = Math.floor(damage * 1.5);
  }

  // Type effectiveness
  const effectiveness = Dex.getEffectiveness(move.type, defender.types);
  if (effectiveness > 0) {
    damage = Math.floor(damage * Math.pow(2, effectiveness));
  } else if (effectiveness < 0 && effectiveness !== -Infinity) {
    damage = Math.floor(damage / Math.pow(2, -effectiveness));
  }

  // Random factor (85-100%)
  const randomFactor = prng.random(85, 101);
  damage = Math.floor(damage * randomFactor / 100);

  return Math.max(1, damage);
}
