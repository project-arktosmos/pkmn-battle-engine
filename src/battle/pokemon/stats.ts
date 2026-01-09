/**
 * Pokemon Stats Calculation
 */

import { Dex } from '../../dex/dex';
import type { StatsTable } from '../../types';

/**
 * Calculate stats from base stats, EVs, IVs, level, and nature
 */
export function calculateStats(
  baseStats: StatsTable,
  evs: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  ivs: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  level: number,
  nature?: string
): StatsTable {
  const natureData = nature ? Dex.natures.get(nature) : null;

  const calcStat = (stat: keyof StatsTable): number => {
    const base = baseStats[stat] || 100;
    const ev = evs[stat] || 0;
    const iv = ivs[stat] ?? 31;

    if (stat === 'hp') {
      // HP formula
      if (base === 1) return 1; // Shedinja
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    }

    // Other stats formula
    let value = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;

    // Nature modifier
    if (natureData?.exists) {
      if (natureData.plus === stat) value = Math.floor(value * 1.1);
      if (natureData.minus === stat) value = Math.floor(value * 0.9);
    }

    return value;
  };

  return {
    hp: calcStat('hp'),
    atk: calcStat('atk'),
    def: calcStat('def'),
    spa: calcStat('spa'),
    spd: calcStat('spd'),
    spe: calcStat('spe'),
  };
}

/**
 * Get effective speed including boosts and paralysis
 */
export function getEffectiveSpeed(
  baseSpe: number,
  boost: number,
  isParalyzed: boolean
): number {
  let speed = baseSpe;

  // Apply boost
  if (boost > 0) {
    speed = Math.floor(speed * (2 + boost) / 2);
  } else if (boost < 0) {
    speed = Math.floor(speed * 2 / (2 - boost));
  }

  // Paralysis halves speed
  if (isParalyzed) {
    speed = Math.floor(speed / 2);
  }

  return speed;
}
