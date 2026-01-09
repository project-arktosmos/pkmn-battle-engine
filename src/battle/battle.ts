/**
 * Battle - Core battle simulation engine
 *
 * This implements a full Pokemon battle simulation including:
 * - Turn-based combat
 * - Type effectiveness
 * - Damage calculation
 * - Status conditions
 * - Ability effects
 * - Switching
 */

import { PRNG, type PRNGSeed } from './prng';
import { Dex } from '../dex/dex';
import { Teams } from '../teams/teams';
import { toID } from '../utils/id';
import type { PokemonSet, StatsTable, TypeName, StatusName, SideID, BattleOptions, PlayerOptions } from '../types';

// Import types from modules
import type { ActivePokemon } from './pokemon/types';
import type { BattleSide } from './side/types';

// Re-export types for backwards compatibility
export type { ActivePokemon } from './pokemon/types';
export type { BattleSide } from './side/types';
export type { BattleOptions, PlayerOptions } from '../types';

/**
 * Battle class - the main simulation engine
 */
export class Battle {
  readonly format: string;
  readonly gen: number;
  readonly prng: PRNG;
  readonly prngSeed: PRNGSeed;

  readonly sides: BattleSide[] = [];
  readonly inputLog: string[] = [];
  private log: string[] = [];
  private messageLog: string[] = [];

  private turn = 0;
  private ended = false;
  private winner: SideID | null = null;

  private send: (type: string, data: string | string[]) => void;
  private debug: boolean;

  constructor(options: BattleOptions = {}) {
    this.format = options.formatid || 'gen9customgame';

    // Determine generation from format
    const genMatch = this.format.match(/gen(\d+)/);
    this.gen = genMatch ? parseInt(genMatch[1]) : 9;

    // Initialize PRNG
    this.prng = new PRNG(options.seed);
    this.prngSeed = this.prng.startingSeed;

    // Send callback
    this.send = options.send || (() => {});
    this.debug = options.debug || false;

    // Store the start command
    this.inputLog.push(`>start {"formatid":"${this.format}","seed":[${this.prng.getSeed()}]}`);
  }

  /**
   * Set a player and their team
   */
  setPlayer(slot: SideID, options: PlayerOptions): void {
    const slotNum = parseInt(slot.slice(1)) - 1;

    // Parse team
    let team: PokemonSet[];
    if (typeof options.team === 'string') {
      team = Teams.unpack(options.team) || [];
    } else {
      team = options.team || [];
    }

    // Create side
    const side: BattleSide = {
      id: slot,
      name: options.name || `Player ${slotNum + 1}`,
      pokemon: [],
      active: [null],
      request: null,
      choice: { actions: [], done: false },
      faintedThisTurn: false,
      faintedLastTurn: false,
    };

    // Create Pokemon
    for (let i = 0; i < team.length; i++) {
      const set = team[i];
      const pokemon = this.createPokemon(set, side, i);
      side.pokemon.push(pokemon);
    }

    this.sides[slotNum] = side;
    this.inputLog.push(`>player ${slot} ${JSON.stringify(options)}`);

    // Start battle if both sides are set
    if (this.sides[0] && this.sides[1]) {
      this.start();
    }
  }

  /**
   * Create an ActivePokemon from a set
   */
  private createPokemon(set: PokemonSet, side: BattleSide, position: number): ActivePokemon {
    const species = Dex.species.get(set.species);
    const level = set.level || 100;

    // Calculate stats
    const stats = this.calculateStats(species.baseStats, set.evs, set.ivs, level, set.nature);

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
   * Calculate stats from base stats, EVs, IVs, level, and nature
   */
  private calculateStats(
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
   * Start the battle
   */
  private start(): void {
    this.add('gametype', 'singles');
    this.add('gen', this.gen);
    this.add('tier', this.format);

    // Add player info
    for (const side of this.sides) {
      if (!side) continue;
      this.add('player', side.id, side.name, '', '');
    }

    this.add('teamsize', 'p1', this.sides[0].pokemon.length);
    this.add('teamsize', 'p2', this.sides[1].pokemon.length);

    this.add('rule', 'Sleep Clause Mod: Limit one foe put to sleep');

    this.add('start');

    // Send out first Pokemon - don't trigger abilities yet
    for (const side of this.sides) {
      if (!side) continue;
      this.switchIn(side, 0, true);
    }

    // Now trigger switch-in abilities for all active Pokemon
    // This ensures both Pokemon are on the field before Intimidate etc. triggers
    for (const side of this.sides) {
      if (!side) continue;
      const active = side.active[0];
      if (active && !active.fainted) {
        this.runAbilityOnSwitch(active);
      }
    }

    this.turn = 1;
    this.add('turn', this.turn);

    // Send requests
    this.sendRequests();
  }

  /**
   * Switch a Pokemon in
   * @param skipAbility - If true, don't trigger switch-in abilities (used for battle start)
   */
  private switchIn(side: BattleSide, position: number, skipAbility = false): void {
    const pokemon = side.pokemon[position];
    if (!pokemon || pokemon.fainted) return;

    // Switch out current active if any
    const current = side.active[0];
    if (current) {
      current.isActive = false;
      current.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 };
      current.volatiles = {};
    }

    // Switch in new Pokemon
    pokemon.isActive = true;
    side.active[0] = pokemon;

    const details = `${pokemon.species}, L${pokemon.level}${pokemon.set.gender ? ', ' + pokemon.set.gender : ''}`;
    const condition = `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ' ' + pokemon.status : ''}`;

    this.add('switch', `${side.id}a: ${pokemon.name}`, details, condition);

    // Trigger Intimidate and other entry abilities
    if (!skipAbility) {
      this.runAbilityOnSwitch(pokemon);
    }
  }

  /**
   * Run ability effects on switch-in
   */
  private runAbilityOnSwitch(pokemon: ActivePokemon): void {
    const ability = Dex.abilities.get(pokemon.ability);
    if (!ability.exists) return;

    if (ability.id === 'intimidate') {
      // Lower opponent's attack
      const opponent = this.getOpponent(pokemon.side);
      if (opponent?.active[0] && !opponent.active[0].fainted) {
        this.add('-ability', `${pokemon.side.id}a: ${pokemon.name}`, 'Intimidate');
        this.boost(opponent.active[0], { atk: -1 }, pokemon);
      }
    }
  }

  /**
   * Get the opposing side
   */
  private getOpponent(side: BattleSide): BattleSide | null {
    return this.sides.find(s => s && s.id !== side.id) || null;
  }

  /**
   * Apply stat boosts
   */
  private boost(
    pokemon: ActivePokemon,
    boosts: Partial<typeof pokemon.boosts>,
    source?: ActivePokemon
  ): boolean {
    let success = false;

    for (const [stat, amount] of Object.entries(boosts) as Array<[keyof typeof pokemon.boosts, number]>) {
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
        this.add('-boost', `${pokemon.side.id}a: ${pokemon.name}`, stat, Math.abs(amount));
      } else {
        this.add('-unboost', `${pokemon.side.id}a: ${pokemon.name}`, stat, Math.abs(amount));
      }
    }

    return success;
  }

  /**
   * Send requests to players
   */
  private sendRequests(): void {
    for (const side of this.sides) {
      if (!side) continue;

      const active = side.active[0];
      if (!active || active.fainted) {
        // Need to switch
        side.request = this.createSwitchRequest(side);
      } else {
        // Can choose move or switch
        side.request = this.createMoveRequest(side);
      }

      side.choice = { actions: [], done: false };

      // Send sideupdate with request
      const requestJSON = JSON.stringify(side.request);
      this.sendToSide(side.id, '|request|' + requestJSON);
    }
  }

  /**
   * Create a move request
   */
  private createMoveRequest(side: BattleSide): any {
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
        pokemon: side.pokemon.map(p => this.pokemonToSideInfo(p)),
      },
    };
  }

  /**
   * Create a switch request (for fainted Pokemon)
   */
  private createSwitchRequest(side: BattleSide): any {
    return {
      requestType: 'switch',
      forceSwitch: [true],
      side: {
        name: side.name,
        id: side.id,
        pokemon: side.pokemon.map(p => this.pokemonToSideInfo(p)),
      },
    };
  }

  /**
   * Convert Pokemon to side info format
   */
  private pokemonToSideInfo(pokemon: ActivePokemon): any {
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

  /**
   * Make a choice for a player
   */
  choose(slot: SideID, choice: string): void {
    const slotNum = parseInt(slot.slice(1)) - 1;
    const side = this.sides[slotNum];
    if (!side) return;

    this.inputLog.push(`>${slot} ${choice}`);

    // Parse choice
    const parts = choice.split(' ');
    const action = parts[0];

    if (action === 'move') {
      const moveIndex = parseInt(parts[1]) - 1;
      side.choice.actions.push(`move ${moveIndex}`);
    } else if (action === 'switch') {
      const pokemonIndex = parseInt(parts[1]) - 1;
      side.choice.actions.push(`switch ${pokemonIndex}`);
    } else if (action === 'default' || action === 'pass') {
      side.choice.actions.push('default');
    }

    side.choice.done = true;

    // Check if both sides have made their choices
    if (this.sides.every(s => s?.choice.done)) {
      this.runTurn();
    }
  }

  /**
   * Undo a choice
   */
  undoChoice(slot: SideID): void {
    const slotNum = parseInt(slot.slice(1)) - 1;
    const side = this.sides[slotNum];
    if (!side) return;

    side.choice = { actions: [], done: false };
  }

  /**
   * Run a turn
   */
  private runTurn(): void {
    if (this.ended) return;

    // Collect actions
    const actions: Array<{
      type: string;
      side: BattleSide;
      pokemon: ActivePokemon;
      priority: number;
      speed: number;
      moveIndex?: number;
      switchTarget?: number;
    }> = [];

    for (const side of this.sides) {
      if (!side) continue;

      const choice = side.choice.actions[0] || 'default';
      const active = side.active[0];

      if (choice.startsWith('move')) {
        const moveIndex = parseInt(choice.split(' ')[1]);
        const move = Dex.moves.get(active!.moves[moveIndex]);

        actions.push({
          type: 'move',
          side,
          pokemon: active!,
          priority: move.exists ? move.priority : 0,
          speed: this.getEffectiveSpeed(active!),
          moveIndex,
        });
      } else if (choice.startsWith('switch')) {
        const switchTarget = parseInt(choice.split(' ')[1]);
        actions.push({
          type: 'switch',
          side,
          pokemon: active!,
          priority: 7, // Switches have high priority
          speed: this.getEffectiveSpeed(active!),
          switchTarget,
        });
      } else {
        // Default - pick first available move
        actions.push({
          type: 'move',
          side,
          pokemon: active!,
          priority: 0,
          speed: this.getEffectiveSpeed(active!),
          moveIndex: 0,
        });
      }
    }

    // Sort by priority, then speed
    actions.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.speed !== b.speed) return b.speed - a.speed;
      // Speed tie - random
      return this.prng.random() < 0.5 ? -1 : 1;
    });

    // Execute actions
    for (const action of actions) {
      if (this.ended) break;

      if (action.type === 'switch') {
        this.switchIn(action.side, action.switchTarget!);
      } else if (action.type === 'move') {
        this.useMove(action.pokemon, action.moveIndex!);
      }
    }

    // End of turn effects
    this.runEndOfTurn();

    // Check for winner
    if (this.checkWin()) {
      return;
    }

    // Next turn
    this.turn++;
    this.add('turn', this.turn);

    // Send new requests
    this.sendRequests();
  }

  /**
   * Get effective speed including boosts and paralysis
   */
  private getEffectiveSpeed(pokemon: ActivePokemon): number {
    let speed = pokemon.stats.spe;

    // Apply boost
    const boost = pokemon.boosts.spe;
    if (boost > 0) {
      speed = Math.floor(speed * (2 + boost) / 2);
    } else if (boost < 0) {
      speed = Math.floor(speed * 2 / (2 - boost));
    }

    // Paralysis halves speed
    if (pokemon.status === 'par') {
      speed = Math.floor(speed / 2);
    }

    return speed;
  }

  /**
   * Use a move
   */
  private useMove(pokemon: ActivePokemon, moveIndex: number): void {
    if (pokemon.fainted) return;

    const slot = pokemon.moveSlots[moveIndex];
    if (!slot) return;

    const move = Dex.moves.get(pokemon.moves[moveIndex]);

    // Check for paralysis "can't move"
    if (pokemon.status === 'par' && this.prng.randomChance(1, 4)) {
      this.add('cant', `${pokemon.side.id}a: ${pokemon.name}`, 'par');
      return;
    }

    // Check for sleep
    if (pokemon.status === 'slp') {
      pokemon.statusData.time = (pokemon.statusData.time || 0) - 1;
      if (pokemon.statusData.time! <= 0) {
        pokemon.status = '';
        pokemon.statusData = {};
        this.add('-curestatus', `${pokemon.side.id}a: ${pokemon.name}`, 'slp', '[msg]');
      } else {
        this.add('cant', `${pokemon.side.id}a: ${pokemon.name}`, 'slp');
        return;
      }
    }

    // Check for freeze
    if (pokemon.status === 'frz') {
      if (this.prng.randomChance(1, 5)) {
        pokemon.status = '';
        pokemon.statusData = {};
        this.add('-curestatus', `${pokemon.side.id}a: ${pokemon.name}`, 'frz', '[msg]');
      } else {
        this.add('cant', `${pokemon.side.id}a: ${pokemon.name}`, 'frz');
        return;
      }
    }

    // Deduct PP
    if (slot.pp > 0) {
      slot.pp--;
    }

    // Announce move
    const opponent = this.getOpponent(pokemon.side);
    const target = opponent?.active[0];

    this.add('move', `${pokemon.side.id}a: ${pokemon.name}`, move.exists ? move.name : pokemon.moves[moveIndex]);

    if (!target || target.fainted) {
      this.add('-notarget', `${pokemon.side.id}a: ${pokemon.name}`);
      return;
    }

    // Execute move effects
    if (!move.exists) return;

    if (move.category === 'Status') {
      this.useStatusMove(pokemon, target, move);
    } else {
      this.useDamagingMove(pokemon, target, move);
    }
  }

  /**
   * Use a status move
   */
  private useStatusMove(pokemon: ActivePokemon, target: ActivePokemon, move: any): void {
    // Status moves
    if (move.status) {
      this.trySetStatus(target, move.status, pokemon);
    }

    if (move.boosts) {
      // Self-boost move (like Swords Dance)
      const boostTarget = move.target === 'self' ? pokemon : target;
      this.boost(boostTarget, move.boosts, pokemon);
    }

    if (move.heal) {
      const healAmount = Math.floor(pokemon.maxhp * move.heal[0] / move.heal[1]);
      this.heal(pokemon, healAmount);
    }
  }

  /**
   * Use a damaging move
   */
  private useDamagingMove(pokemon: ActivePokemon, target: ActivePokemon, move: any): void {
    // Check accuracy
    if (move.accuracy !== true) {
      let accuracy = move.accuracy;

      // Apply accuracy/evasion boosts
      const accBoost = pokemon.boosts.accuracy - target.boosts.evasion;
      if (accBoost > 0) {
        accuracy = accuracy * (3 + accBoost) / 3;
      } else if (accBoost < 0) {
        accuracy = accuracy * 3 / (3 - accBoost);
      }

      if (!this.prng.randomChance(Math.floor(accuracy), 100)) {
        this.add('-miss', `${pokemon.side.id}a: ${pokemon.name}`, `${target.side.id}a: ${target.name}`);
        return;
      }
    }

    // Check immunity
    if (!Dex.getImmunity(move.type, target.types)) {
      this.add('-immune', `${target.side.id}a: ${target.name}`);
      return;
    }

    // Calculate damage
    const damage = this.calculateDamage(pokemon, target, move);

    // Check critical hit
    let crit = false;
    let critRatio = move.critRatio || 1;
    if (move.willCrit) {
      crit = true;
    } else {
      const critChances = [0, 24, 8, 2, 1];
      const critChance = critChances[Math.min(critRatio, 4)];
      crit = this.prng.randomChance(1, critChance);
    }

    if (crit) {
      this.add('-crit', `${target.side.id}a: ${target.name}`);
    }

    // Apply type effectiveness message
    const effectiveness = Dex.getEffectiveness(move.type, target.types);
    if (effectiveness > 0) {
      this.add('-supereffective', `${target.side.id}a: ${target.name}`);
    } else if (effectiveness < 0) {
      this.add('-resisted', `${target.side.id}a: ${target.name}`);
    }

    // Apply damage
    let finalDamage = damage;
    if (crit) finalDamage = Math.floor(finalDamage * 1.5);
    finalDamage = Math.max(1, finalDamage);

    this.damage(target, finalDamage, pokemon);

    // Secondary effects
    if (move.secondary && target.hp > 0) {
      if (!move.secondary.chance || this.prng.randomChance(move.secondary.chance, 100)) {
        if (move.secondary.status) {
          this.trySetStatus(target, move.secondary.status, pokemon);
        }
        if (move.secondary.boosts) {
          this.boost(target, move.secondary.boosts, pokemon);
        }
        if (move.secondary.volatileStatus) {
          this.addVolatile(target, move.secondary.volatileStatus, pokemon);
        }
      }
    }

    // Ability effects on contact
    if (move.flags?.contact && target.hp > 0) {
      this.runContactAbility(pokemon, target);
    }
  }

  /**
   * Run contact ability effects
   */
  private runContactAbility(attacker: ActivePokemon, defender: ActivePokemon): void {
    const ability = Dex.abilities.get(defender.ability);
    if (!ability.exists) return;

    if (ability.id === 'static') {
      if (!attacker.status && this.prng.randomChance(30, 100)) {
        this.trySetStatus(attacker, 'par', defender);
      }
    } else if (ability.id === 'poisonpoint') {
      if (!attacker.status && this.prng.randomChance(30, 100)) {
        this.trySetStatus(attacker, 'psn', defender);
      }
    } else if (ability.id === 'flamebody') {
      if (!attacker.status && this.prng.randomChance(30, 100)) {
        this.trySetStatus(attacker, 'brn', defender);
      }
    }
  }

  /**
   * Calculate damage
   */
  private calculateDamage(attacker: ActivePokemon, defender: ActivePokemon, move: any): number {
    const level = attacker.level;
    let basePower = move.basePower;

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
    const randomFactor = this.prng.random(85, 101);
    damage = Math.floor(damage * randomFactor / 100);

    return Math.max(1, damage);
  }

  /**
   * Deal damage to a Pokemon
   */
  private damage(pokemon: ActivePokemon, amount: number, source?: ActivePokemon, reason?: string): void {
    if (pokemon.fainted) return;

    pokemon.hp = Math.max(0, pokemon.hp - amount);

    const condition = `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ' ' + pokemon.status : ''}`;

    if (reason) {
      this.add('-damage', `${pokemon.side.id}a: ${pokemon.name}`, condition, reason);
    } else {
      this.add('-damage', `${pokemon.side.id}a: ${pokemon.name}`, condition);
    }

    if (pokemon.hp === 0) {
      this.faint(pokemon);
    }
  }

  /**
   * Heal a Pokemon
   */
  private heal(pokemon: ActivePokemon, amount: number): void {
    if (pokemon.fainted) return;

    const oldHp = pokemon.hp;
    pokemon.hp = Math.min(pokemon.maxhp, pokemon.hp + amount);

    if (pokemon.hp > oldHp) {
      const condition = `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ' ' + pokemon.status : ''}`;
      this.add('-heal', `${pokemon.side.id}a: ${pokemon.name}`, condition);
    }
  }

  /**
   * Faint a Pokemon
   */
  private faint(pokemon: ActivePokemon): void {
    if (pokemon.fainted) return;

    pokemon.fainted = true;
    pokemon.hp = 0;
    pokemon.isActive = false;
    pokemon.side.faintedThisTurn = true;

    this.add('faint', `${pokemon.side.id}a: ${pokemon.name}`);
  }

  /**
   * Try to set a status condition
   */
  private trySetStatus(pokemon: ActivePokemon, status: StatusName, source?: ActivePokemon): boolean {
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
      pokemon.statusData.time = this.prng.random(2, 5);
    } else if (status === 'tox') {
      pokemon.statusData.time = 1;
    }

    this.add('-status', `${pokemon.side.id}a: ${pokemon.name}`, status);
    return true;
  }

  /**
   * Add a volatile status
   */
  private addVolatile(pokemon: ActivePokemon, volatile: string, source?: ActivePokemon): boolean {
    if (pokemon.fainted) return false;
    if (pokemon.volatiles[volatile]) return false;

    pokemon.volatiles[volatile] = { source: source?.name };
    this.add('-start', `${pokemon.side.id}a: ${pokemon.name}`, volatile);
    return true;
  }

  /**
   * Run end of turn effects
   */
  private runEndOfTurn(): void {
    for (const side of this.sides) {
      if (!side) continue;

      const active = side.active[0];
      if (!active || active.fainted) continue;

      // Burn damage
      if (active.status === 'brn') {
        const damage = Math.max(1, Math.floor(active.maxhp / 16));
        this.damage(active, damage, undefined, '[from] brn');
      }

      // Poison damage
      if (active.status === 'psn') {
        const damage = Math.max(1, Math.floor(active.maxhp / 8));
        this.damage(active, damage, undefined, '[from] psn');
      }

      // Toxic damage
      if (active.status === 'tox') {
        const multiplier = active.statusData.time || 1;
        const damage = Math.max(1, Math.floor(active.maxhp * multiplier / 16));
        this.damage(active, damage, undefined, '[from] psn');
        active.statusData.time = Math.min(15, multiplier + 1);
      }
    }

    // Update fainted tracking
    for (const side of this.sides) {
      if (!side) continue;
      side.faintedLastTurn = side.faintedThisTurn;
      side.faintedThisTurn = false;
    }
  }

  /**
   * Check for winner
   */
  private checkWin(): boolean {
    for (const side of this.sides) {
      if (!side) continue;

      const allFainted = side.pokemon.every(p => p.fainted);
      if (allFainted) {
        const opponent = this.getOpponent(side);
        if (opponent) {
          this.win(opponent.id);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * End the battle with a winner
   */
  win(winner: SideID | null): void {
    if (this.ended) return;

    this.ended = true;
    this.winner = winner;

    if (winner) {
      const side = this.sides.find(s => s?.id === winner);
      this.add('win', side?.name || winner);
    } else {
      this.add('tie');
    }

    this.sendUpdates();
  }

  /**
   * Force a loss
   */
  lose(slot: SideID): void {
    const opponent = slot === 'p1' ? 'p2' : 'p1';
    this.win(opponent);
  }

  /**
   * Reset the RNG
   */
  resetRNG(seed: PRNGSeed | string): void {
    if (typeof seed === 'string') {
      const parts = seed.split(',').map(Number);
      if (parts.length === 4) {
        this.prng.seed = parts as PRNGSeed;
      }
    } else {
      this.prng.seed = [...seed];
    }
  }

  /**
   * Add a message to the battle log
   */
  add(...parts: (string | number)[]): void {
    const message = '|' + parts.join('|');
    this.log.push(message);
    this.messageLog.push(message);
  }

  /**
   * Send a message to a specific side
   */
  private sendToSide(side: SideID, message: string): void {
    this.send('sideupdate', `${side}\n${message}`);
  }

  /**
   * Send accumulated updates
   */
  sendUpdates(): void {
    if (this.messageLog.length > 0) {
      this.send('update', this.messageLog);
      this.messageLog = [];
    }
  }

  /**
   * Destroy the battle
   */
  destroy(): void {
    this.ended = true;
  }

  /**
   * Get the toID function
   */
  get toID() {
    return toID;
  }
}

/**
 * Extract channel messages from battle output
 */
export function extractChannelMessages(
  data: string,
  channels: number[]
): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  for (const channel of channels) {
    result[channel] = [];
  }

  const lines = data.split('\n');
  for (const line of lines) {
    for (const channel of channels) {
      result[channel].push(line);
    }
  }

  return result;
}
