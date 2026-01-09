/**
 * End of Turn Effects
 */

import type { ActivePokemon } from '../pokemon/types';
import type { BattleSide } from '../side/types';

/**
 * Damage callback for end-of-turn effects
 */
export type DamageCallback = (pokemon: ActivePokemon, amount: number, reason: string) => void;

/**
 * Run end of turn effects for all active Pokemon
 */
export function runEndOfTurn(
  sides: BattleSide[],
  damage: DamageCallback
): void {
  for (const side of sides) {
    if (!side) continue;

    const active = side.active[0];
    if (!active || active.fainted) continue;

    // Burn damage
    if (active.status === 'brn') {
      const dmg = Math.max(1, Math.floor(active.maxhp / 16));
      damage(active, dmg, '[from] brn');
    }

    // Poison damage
    if (active.status === 'psn') {
      const dmg = Math.max(1, Math.floor(active.maxhp / 8));
      damage(active, dmg, '[from] psn');
    }

    // Toxic damage
    if (active.status === 'tox') {
      const multiplier = active.statusData.time || 1;
      const dmg = Math.max(1, Math.floor(active.maxhp * multiplier / 16));
      damage(active, dmg, '[from] psn');
      active.statusData.time = Math.min(15, multiplier + 1);
    }
  }

  // Update fainted tracking
  for (const side of sides) {
    if (!side) continue;
    side.faintedLastTurn = side.faintedThisTurn;
    side.faintedThisTurn = false;
  }
}
