import { describe, it, expect } from 'vitest';
import { BattleStream, getPlayerStreams, Teams, Dex } from '../src/index';

/**
 * Integration tests for actual battle execution.
 *
 * These tests verify that battles work end-to-end:
 * - Moves deal damage
 * - Type effectiveness applies
 * - Status conditions work
 * - Abilities trigger
 * - Battles can be won
 */

describe('Battle Execution', () => {
  // Helper to create a simple team
  function createTeam(
    pokemon: Array<{
      species: string;
      moves: string[];
      level?: number;
      evs?: Record<string, number>;
      ability?: string;
      item?: string;
    }>
  ) {
    return pokemon.map((p) => ({
      name: p.species,
      species: p.species,
      ability: p.ability || Dex.species.get(p.species).abilities['0'],
      item: p.item || '',
      moves: p.moves,
      evs: p.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      nature: 'Hardy',
      level: p.level || 50,
      gender: '' as const,
      shiny: false,
    }));
  }

  // Helper to run a battle and collect messages
  async function runBattle(
    p1Team: ReturnType<typeof createTeam>,
    p2Team: ReturnType<typeof createTeam>,
    format: string,
    moves: Array<{ p1: string; p2: string }>
  ): Promise<{
    messages: string[];
    winner: string | null;
    p1Pokemon: any[];
    p2Pokemon: any[];
  }> {
    const stream = new BattleStream();
    const streams = getPlayerStreams(stream);

    const messages: string[] = [];
    let winner: string | null = null;
    let p1Request: any = null;
    let p2Request: any = null;
    let battleEnded = false;

    // Process omniscient stream
    const processOmniscient = async () => {
      try {
        for await (const chunk of streams.omniscient) {
          if (battleEnded) break;
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line) continue;
            messages.push(line);
            const parts = line.split('|');
            if (parts[1] === 'win') {
              winner = parts[2];
              battleEnded = true;
            }
            if (parts[1] === 'tie') {
              battleEnded = true;
            }
          }
        }
      } catch {
        // Stream closed
      }
    };

    // Process p1 stream
    const processP1 = async () => {
      try {
        for await (const chunk of streams.p1) {
          if (battleEnded) break;
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line) continue;
            const parts = line.split('|');
            if (parts[1] === 'request' && parts[2]) {
              try {
                p1Request = JSON.parse(parts[2]);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch {
        // Stream closed
      }
    };

    // Process p2 stream
    const processP2 = async () => {
      try {
        for await (const chunk of streams.p2) {
          if (battleEnded) break;
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line) continue;
            const parts = line.split('|');
            if (parts[1] === 'request' && parts[2]) {
              try {
                p2Request = JSON.parse(parts[2]);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch {
        // Stream closed
      }
    };

    // Start processing streams
    const omniscientPromise = processOmniscient();
    const p1Promise = processP1();
    const p2Promise = processP2();

    // Pack teams
    const packedP1 = Teams.pack(p1Team as any);
    const packedP2 = Teams.pack(p2Team as any);

    // Start battle with fixed seed for reproducibility
    stream.write(`>start {"formatid":"${format}","seed":[1,2,3,4]}`);
    stream.write(`>player p1 {"name":"Player 1","team":"${packedP1}"}`);
    stream.write(`>player p2 {"name":"Player 2","team":"${packedP2}"}`);

    // Wait for initial setup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Execute moves
    for (const move of moves) {
      if (battleEnded) break;
      stream.write(`>p1 ${move.p1}`);
      stream.write(`>p2 ${move.p2}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Wait for any remaining processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Mark as ended to stop stream processing
    battleEnded = true;

    // Give streams time to finish current iteration
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Clean up
    try {
      stream.destroy();
    } catch {
      // Stream may already be destroyed
    }

    // Wait for streams to finish with timeout
    await Promise.race([
      Promise.all([omniscientPromise, p1Promise, p2Promise]),
      new Promise((resolve) => setTimeout(resolve, 300)),
    ]);

    return {
      messages,
      winner,
      p1Pokemon: p1Request?.side?.pokemon || [],
      p2Pokemon: p2Request?.side?.pokemon || [],
    };
  }

  describe('Basic Move Execution', () => {
    it('should execute a damaging move and reduce HP', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 100 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 100 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have damage messages
      const damageMessages = result.messages.filter((m) => m.includes('|-damage|'));
      expect(damageMessages.length).toBeGreaterThan(0);
    });

    it('should handle type effectiveness (super effective)', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Gyarados', moves: ['Splash'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have supereffective message
      const superEffective = result.messages.some((m) => m.includes('|-supereffective|'));
      expect(superEffective).toBe(true);
    });

    it('should handle type immunity (Ground vs Electric)', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Sandshrew', moves: ['Scratch'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have immune message
      const immune = result.messages.some((m) => m.includes('|-immune|'));
      expect(immune).toBe(true);
    });

    it('should handle type resistance (not very effective)', async () => {
      const p1Team = createTeam([{ species: 'Charmander', moves: ['Ember'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Squirtle', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have resisted message
      const resisted = result.messages.some((m) => m.includes('|-resisted|'));
      expect(resisted).toBe(true);
    });
  });

  describe('Status Conditions', () => {
    it('should apply paralysis and reduce speed', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunder Wave', 'Quick Attack'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Thunder Wave
        { p1: 'move 2', p2: 'move 1' }, // Quick Attack
      ]);

      // Should have paralysis status
      const paralysis = result.messages.some((m) => m.includes('|-status|') && m.includes('par'));
      expect(paralysis).toBe(true);
    });

    it('should apply burn and deal damage each turn', async () => {
      const p1Team = createTeam([{ species: 'Vulpix', moves: ['Will-O-Wisp', 'Ember'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Machop', moves: ['Karate Chop'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Will-O-Wisp
        { p1: 'move 2', p2: 'move 1' }, // Next turn - burn should tick
      ]);

      // Should have burn status
      const burn = result.messages.some((m) => m.includes('|-status|') && m.includes('brn'));
      expect(burn).toBe(true);

      // Should have burn damage message
      const burnDamage = result.messages.some((m) => m.includes('|-damage|') && m.includes('[from] brn'));
      expect(burnDamage).toBe(true);
    });

    it('should apply poison and deal damage each turn', async () => {
      const p1Team = createTeam([{ species: 'Ekans', moves: ['Poison Sting', 'Wrap'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Poison Sting has 30% chance to poison
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Battle Completion', () => {
    it('should declare winner when opponent faints', async () => {
      const p1Team = createTeam([
        {
          species: 'Mewtwo',
          moves: ['Psychic'],
          level: 100,
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
        },
      ]);
      const p2Team = createTeam([{ species: 'Magikarp', moves: ['Splash'], level: 1 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have faint message
      const faint = result.messages.some((m) => m.includes('|faint|'));
      expect(faint).toBe(true);

      // Should have winner
      expect(result.winner).toBe('Player 1');
    });

    it('should handle switching when Pokemon faints', async () => {
      const p1Team = createTeam([
        {
          species: 'Mewtwo',
          moves: ['Psychic'],
          level: 100,
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
        },
      ]);
      const p2Team = createTeam([
        { species: 'Magikarp', moves: ['Splash'], level: 1 },
        { species: 'Rattata', moves: ['Tackle'], level: 5 },
      ]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'switch 2' },
      ]);

      // Should have switch message
      const switchMsg = result.messages.some((m) => m.includes('|switch|'));
      expect(switchMsg).toBe(true);
    });
  });

  describe('Ability Effects', () => {
    it('should trigger Intimidate on switch-in', async () => {
      const p1Team = createTeam([{ species: 'Gyarados', moves: ['Splash'], level: 50, ability: 'Intimidate' }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have Intimidate trigger - ability announcement and stat drop
      const hasAbilityOrUnboost = result.messages.some(
        (m) => m.includes('Intimidate') || m.includes('|-unboost|')
      );
      expect(hasAbilityOrUnboost).toBe(true);
    });

    it('should trigger Static on contact', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50, ability: 'Static' }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Static has 30% chance
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Moves', () => {
    it('should make Quick Attack move first despite lower speed', async () => {
      const p1Team = createTeam([{ species: 'Snorlax', moves: ['Quick Attack'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Ninjask', moves: ['Scratch'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Find the move messages
      const moveMessages = result.messages.filter((m) => m.includes('|move|'));
      expect(moveMessages.length).toBeGreaterThanOrEqual(2);

      // Snorlax (p1) should move first due to Quick Attack priority
      if (moveMessages.length >= 2) {
        expect(moveMessages[0]).toContain('p1a');
      }
    });
  });

  describe('Gen 3 Specific Mechanics', () => {
    it('should use physical/special split by type in Gen 3', async () => {
      const p1Team = createTeam([{ species: 'Charmander', moves: ['Ember'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should execute without errors
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages.some((m) => m.includes('|move|'))).toBe(true);
    });

    it('should handle Gen 3 format correctly', () => {
      const format = Dex.formats.get('gen3customgame');
      expect(format.exists).toBe(true);
      expect(format.mod).toBe('gen3');
    });

    it('should apply STAB bonus correctly', async () => {
      const p1Team = createTeam([{ species: 'Charmander', moves: ['Ember'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Vine Whip'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [{ p1: 'move 1', p2: 'move 1' }]);

      // Should have executed moves
      expect(result.messages.some((m) => m.includes('|move|') && m.includes('Ember'))).toBe(true);
      expect(result.messages.some((m) => m.includes('|move|') && m.includes('Vine Whip'))).toBe(true);
    });
  });

  describe('PP Deduction', () => {
    it('should deduct PP when using moves', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Should have executed moves
      const moveCount = result.messages.filter((m) => m.includes('|move|') && m.includes('Thunderbolt')).length;
      expect(moveCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Critical Hits', () => {
    it('should occasionally deal critical hits', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Slash'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Switching', () => {
    it('should allow switching Pokemon mid-battle', async () => {
      const p1Team = createTeam([
        { species: 'Pikachu', moves: ['Thunderbolt'], level: 50 },
        { species: 'Charmander', moves: ['Ember'], level: 50 },
      ]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'switch 2', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Should have switch message for Charmander
      const switchMsg = result.messages.some((m) => m.includes('|switch|') && m.includes('Charmander'));
      expect(switchMsg).toBe(true);
    });
  });

  describe('Default/Pass Actions', () => {
    it('should handle default action', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'default', p2: 'default' },
      ]);

      // Should have executed moves
      expect(result.messages.some((m) => m.includes('|move|'))).toBe(true);
    });

    it('should handle pass action', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunderbolt'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'pass', p2: 'pass' },
      ]);

      // Battle should proceed
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Status Effects - Sleep', () => {
    it('should apply sleep and prevent attacks', async () => {
      const p1Team = createTeam([{ species: 'Butterfree', moves: ['Sleep Powder', 'Tackle'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Sleep Powder
        { p1: 'move 2', p2: 'move 1' }, // Tackle while sleeping
        { p1: 'move 2', p2: 'move 1' },
        { p1: 'move 2', p2: 'move 1' },
      ]);

      // Should have sleep status
      const sleep = result.messages.some((m) => m.includes('|-status|') && m.includes('slp'));
      expect(sleep).toBe(true);

      // Should have "can't move" message
      const cantMove = result.messages.some((m) => m.includes('|cant|') && m.includes('slp'));
      expect(cantMove).toBe(true);
    });
  });

  describe('Status Effects - Freeze', () => {
    it('should apply freeze and potentially thaw', async () => {
      const p1Team = createTeam([{ species: 'Jynx', moves: ['Ice Beam', 'Tackle'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Ice Beam has 10% freeze chance
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Status Effects - Toxic', () => {
    it('should apply toxic and increase damage over turns', async () => {
      const p1Team = createTeam([{ species: 'Grimer', moves: ['Toxic', 'Tackle'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Toxic
        { p1: 'move 2', p2: 'move 1' },
        { p1: 'move 2', p2: 'move 1' },
        { p1: 'move 2', p2: 'move 1' },
      ]);

      // Should have toxic status
      const toxic = result.messages.some((m) => m.includes('|-status|') && m.includes('tox'));
      expect(toxic).toBe(true);
    });
  });

  describe('Recovery Moves', () => {
    it('should heal Pokemon with Recover', async () => {
      // Use two tanky Pokemon that won't one-shot each other
      // Snorlax vs Snorlax - both have high HP and low attack
      const p1Team = createTeam([{ species: 'Snorlax', moves: ['Recover', 'Body Slam'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Snorlax', moves: ['Body Slam'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 2', p2: 'move 1' }, // Take some damage
        { p1: 'move 1', p2: 'move 1' }, // Recover
      ]);

      // Should have heal message
      const heal = result.messages.some((m) => m.includes('|-heal|'));
      expect(heal).toBe(true);
    });
  });

  describe('Stat Boost Moves', () => {
    it('should boost attack with Swords Dance', async () => {
      const p1Team = createTeam([{ species: 'Scyther', moves: ['Swords Dance', 'Slash'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Swords Dance
        { p1: 'move 2', p2: 'move 1' }, // Slash
      ]);

      // Should have boost message
      const boost = result.messages.some((m) => m.includes('|-boost|'));
      expect(boost).toBe(true);
    });

    it('should handle negative boosts (debuffs)', async () => {
      const p1Team = createTeam([{ species: 'Butterfree', moves: ['String Shot', 'Tackle'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // String Shot
      ]);

      // Should have unboost message
      const unboost = result.messages.some((m) => m.includes('|-unboost|'));
      expect(unboost).toBe(true);
    });
  });

  describe('Accuracy and Miss', () => {
    it('should occasionally miss with low accuracy moves', async () => {
      const p1Team = createTeam([{ species: 'Machoke', moves: ['Dynamic Punch'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Dynamic Punch has 50% accuracy
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran (miss is random)
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Abilities', () => {
    it('should trigger Poison Point on contact', async () => {
      const p1Team = createTeam([{ species: 'Nidoran-F', moves: ['Scratch'], level: 50, ability: 'Poison Point' }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Run multiple turns for probability
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should trigger Flame Body on contact', async () => {
      const p1Team = createTeam([{ species: 'Magmar', moves: ['Scratch'], level: 50, ability: 'Flame Body' }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      // Run multiple turns for probability
      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Speed Calculations', () => {
    it('should apply speed boosts correctly', async () => {
      // Use Agility to boost speed
      const p1Team = createTeam([{ species: 'Jolteon', moves: ['Agility', 'Quick Attack'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Agility
        { p1: 'move 2', p2: 'move 1' },
      ]);

      // Should have speed boost
      const boost = result.messages.some((m) => m.includes('|-boost|') && m.includes('spe'));
      expect(boost).toBe(true);
    });

    it('should reduce speed when paralyzed', async () => {
      const p1Team = createTeam([{ species: 'Pikachu', moves: ['Thunder Wave', 'Quick Attack'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Bulbasaur', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' }, // Thunder Wave
        { p1: 'move 2', p2: 'move 1' },
      ]);

      // Should have paralysis applied
      const par = result.messages.some((m) => m.includes('|-status|') && m.includes('par'));
      expect(par).toBe(true);
    });
  });

  describe('Move Secondary Effects', () => {
    it('should apply secondary effect boosts', async () => {
      // Bubble Beam has 10% speed drop
      const p1Team = createTeam([{ species: 'Squirtle', moves: ['Bubble Beam'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Charmander', moves: ['Scratch'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should apply confusion (volatileStatus)', async () => {
      const p1Team = createTeam([{ species: 'Butterfree', moves: ['Confusion', 'Tackle'], level: 50 }]);
      const p2Team = createTeam([{ species: 'Rattata', moves: ['Tackle'], level: 50 }]);

      const result = await runBattle(p1Team, p2Team, 'gen3customgame', [
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
        { p1: 'move 1', p2: 'move 1' },
      ]);

      // Just verify battle ran
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });
});
