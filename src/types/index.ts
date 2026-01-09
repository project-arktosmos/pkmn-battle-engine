/**
 * Core type definitions for the battle simulator
 */

export type ID = string;

export type StatID = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type StatIDExceptHP = 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type BoostID = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'accuracy' | 'evasion';

export interface StatsTable {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface BoostsTable {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  accuracy: number;
  evasion: number;
}

export type TypeName =
  | 'Normal'
  | 'Fighting'
  | 'Flying'
  | 'Poison'
  | 'Ground'
  | 'Rock'
  | 'Bug'
  | 'Ghost'
  | 'Steel'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Psychic'
  | 'Ice'
  | 'Dragon'
  | 'Dark'
  | 'Fairy'
  | '???';

export type MoveCategory = 'Physical' | 'Special' | 'Status';

export type GenderName = 'M' | 'F' | 'N' | '';

export type NatureName =
  | 'Adamant'
  | 'Bashful'
  | 'Bold'
  | 'Brave'
  | 'Calm'
  | 'Careful'
  | 'Docile'
  | 'Gentle'
  | 'Hardy'
  | 'Hasty'
  | 'Impish'
  | 'Jolly'
  | 'Lax'
  | 'Lonely'
  | 'Mild'
  | 'Modest'
  | 'Naive'
  | 'Naughty'
  | 'Quiet'
  | 'Quirky'
  | 'Rash'
  | 'Relaxed'
  | 'Sassy'
  | 'Serious'
  | 'Timid';

export type StatusName = 'brn' | 'par' | 'slp' | 'frz' | 'psn' | 'tox' | '';

export type SideID = 'p1' | 'p2' | 'p3' | 'p4';

/**
 * Pokemon set as used in teams
 */
export interface PokemonSet {
  name: string;
  species: string;
  item: string;
  ability: string;
  moves: string[];
  nature: string;
  gender: string;
  evs: StatsTable;
  ivs: StatsTable;
  level: number;
  shiny?: boolean;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  teraType?: string;
}

/**
 * Species data
 */
export interface SpeciesData {
  num: number;
  name: string;
  types: TypeName[];
  baseStats: StatsTable;
  abilities: { 0: string; 1?: string; H?: string; S?: string };
  heightm: number;
  weightkg: number;
  color: string;
  eggGroups: string[];
  evos?: string[];
  prevo?: string;
  evoLevel?: number;
  evoType?: string;
  evoItem?: string;
  evoCondition?: string;
  evoMove?: string;
  genderRatio?: { M: number; F: number };
  gender?: GenderName;
  baseSpecies?: string;
  forme?: string;
  baseForme?: string;
  otherFormes?: string[];
  formeOrder?: string[];
  canHatch?: boolean;
  cannotDynamax?: boolean;
  forceTeraType?: TypeName;
  gen?: number;
  tier?: string;
}

/**
 * Move data
 */
export interface MoveData {
  num: number;
  name: string;
  type: TypeName;
  category: MoveCategory;
  basePower: number;
  accuracy: number | true;
  pp: number;
  priority: number;
  target: string;
  flags: Record<string, number | undefined>;
  secondary?: {
    chance?: number;
    status?: StatusName;
    boosts?: Partial<BoostsTable>;
    volatileStatus?: string;
    self?: {
      boosts?: Partial<BoostsTable>;
      volatileStatus?: string;
    };
  } | null;
  recoil?: [number, number];
  drain?: [number, number];
  heal?: [number, number];
  status?: StatusName;
  boosts?: Partial<BoostsTable>;
  volatileStatus?: string;
  critRatio?: number;
  willCrit?: boolean;
  noPPBoosts?: boolean;
  isZ?: string;
  isMax?: string | boolean;
  maxMove?: { basePower: number };
  zMove?: { basePower?: number; boost?: Partial<BoostsTable>; effect?: string };
  multihit?: number | [number, number];
  ohko?: boolean | TypeName;
  selfSwitch?: boolean | string;
  selfDestruct?: string;
  breaksProtect?: boolean;
  ignoreDefensive?: boolean;
  ignoreEvasion?: boolean;
  ignoreImmunity?: boolean | { [type: string]: boolean };
  forceSwitch?: boolean;
  hasCrashDamage?: boolean;
  stallingMove?: boolean;
  sideCondition?: string;
  slotCondition?: string;
  weather?: string;
  terrain?: string;
  pseudoWeather?: string;
  selfdestruct?: string;
  noSketch?: boolean;
  desc?: string;
  shortDesc?: string;
  gen?: number;
}

/**
 * Ability data
 */
export interface AbilityData {
  num: number;
  name: string;
  desc?: string;
  shortDesc?: string;
  rating?: number;
  isBreakable?: boolean;
  isPermanent?: boolean;
  gen?: number;
}

/**
 * Item data
 */
export interface ItemData {
  num: number;
  name: string;
  desc?: string;
  shortDesc?: string;
  spritenum?: number;
  gen?: number;
  fling?: { basePower: number; status?: StatusName; volatileStatus?: string };
  naturalGift?: { basePower: number; type: TypeName };
  isBerry?: boolean;
  isChoice?: boolean;
  isGem?: boolean;
  isPokeball?: boolean;
  boosts?: Partial<StatsTable>;
  onPlate?: TypeName;
  onMemory?: TypeName;
  onDrive?: TypeName;
  megaStone?: string;
  megaEvolves?: string;
  zMove?: TypeName | true;
  zMoveType?: TypeName;
  zMoveUser?: string[];
  zMoveFrom?: string;
  itemUser?: string[];
  forcedForme?: string;
}

/**
 * Nature data
 */
export interface NatureData {
  name: NatureName;
  plus?: StatIDExceptHP;
  minus?: StatIDExceptHP;
}

/**
 * Type data with damage relations
 */
export interface TypeData {
  name: TypeName;
  damageTaken: { [type: string]: number };
  HPivs?: Partial<StatsTable>;
  HPdvs?: Partial<StatsTable>;
}

/**
 * Format data
 */
export interface FormatData {
  name: string;
  mod: string;
  ruleset?: string[];
  banlist?: string[];
  unbanlist?: string[];
  restricted?: string[];
  gameType?: 'singles' | 'doubles' | 'triples' | 'rotation' | 'multi' | 'freeforall';
  teamLength?: { validate?: [number, number]; battle?: number };
  timer?: { starting?: number; perTurn?: number; maxPerTurn?: number };
  rated?: boolean;
  challengeShow?: boolean;
  searchShow?: boolean;
  threads?: string[];
  desc?: string;
}

/**
 * Condition data (status, volatiles, etc.)
 */
export interface ConditionData {
  name: string;
  effectType?: string;
  duration?: number;
  desc?: string;
  shortDesc?: string;
}

/**
 * Generic data object that may or may not exist
 */
export interface DataObject {
  exists: boolean;
  [key: string]: unknown;
}

/**
 * PRNG Seed types
 */
export type PRNGSeed = `${number},${number},${number},${number}` | [number, number, number, number];
export type Gen5RNGSeed = [number, number, number, number];

/**
 * Battle types re-export
 */
export type { BattleOptions, PlayerOptions } from './battle';
