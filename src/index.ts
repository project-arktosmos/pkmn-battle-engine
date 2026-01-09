/**
 * arktosmos-pkmn-battle-engine
 *
 * A standalone Pokemon battle simulator - a complete extraction of battle logic
 * without external dependencies.
 *
 * @module arktosmos-pkmn-battle-engine
 */

// Core battle classes
export { Battle, extractChannelMessages } from './battle/battle';
export { BattleStream, getPlayerStreams } from './battle/battle-stream';
export { PRNG } from './battle/prng';
export type { PRNGSeed } from './battle/prng';

// Dex - Pokemon data access
export { Dex } from './dex/dex';

// Teams - team packing/unpacking
export { Teams } from './teams/teams';

// Utilities
export { toID } from './utils/id';

// Types
export type {
  PokemonSet,
  SpeciesData,
  MoveData,
  AbilityData,
  ItemData,
  NatureData,
  TypeData,
  FormatData,
  ConditionData,
  StatsTable,
  BoostsTable,
  TypeName,
  MoveCategory,
  StatusName,
  NatureName,
  GenderName,
  StatID,
  StatIDExceptHP,
  BoostID,
  SideID,
  ID,
} from './types';

// Stub exports for compatibility with pokemon-showdown API
// These are minimal implementations or placeholders

/**
 * Pokemon class - represents a Pokemon in battle
 * (The actual battle Pokemon is implemented in Battle)
 */
export const Pokemon = class Pokemon {
  // Stub for API compatibility
};

/**
 * Side class - represents a player's side in battle
 * (The actual battle side is implemented in Battle)
 */
export const Side = class Side {
  // Stub for API compatibility
};

/**
 * TeamValidator - validates teams for formats
 * (Minimal implementation)
 */
export const TeamValidator = class TeamValidator {
  format: string;

  constructor(format: string) {
    this.format = format;
  }

  validateTeam(team: any[]): string[] | null {
    // Basic validation - return null if valid, array of problems if not
    if (!team || !Array.isArray(team)) {
      return ['Team must be an array'];
    }
    if (team.length === 0) {
      return ['Team must have at least one Pokemon'];
    }
    if (team.length > 6) {
      return ['Team cannot have more than 6 Pokemon'];
    }

    const problems: string[] = [];
    for (const pokemon of team) {
      if (!pokemon.species) {
        problems.push('Pokemon must have a species');
      }
      if (!pokemon.moves || pokemon.moves.length === 0) {
        problems.push(`${pokemon.species || 'Pokemon'} must have at least one move`);
      }
    }

    return problems.length > 0 ? problems : null;
  }
};
