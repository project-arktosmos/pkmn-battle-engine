import { describe, it, expect } from 'vitest';
import { Battle, Teams, Dex } from '../src/index';

/**
 * Unit tests for Battle class internal methods and edge cases
 */

describe('Battle Unit Tests', () => {
  // Helper to create a simple packed team
  function createPackedTeam(pokemon: Array<{ species: string; moves: string[]; level?: number }>) {
    return Teams.pack(
      pokemon.map((p) => ({
        name: p.species,
        species: p.species,
        ability: Dex.species.get(p.species).abilities['0'],
        item: '',
        moves: p.moves,
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: 'Hardy',
        level: p.level || 50,
        gender: '' as const,
        shiny: false,
      }))
    );
  }

  describe('Constructor', () => {
    it('should create battle with default options', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      expect(battle).toBeDefined();
      expect(battle.format).toBe('gen3customgame');
    });

    it('should create battle with custom seed', () => {
      const battle = new Battle({ formatid: 'gen3customgame', seed: [1, 2, 3, 4] });
      // getSeed() returns a string representation
      expect(battle.prng.getSeed()).toBe('1,2,3,4');
    });

    it('should create battle with send function', () => {
      const messages: string[] = [];
      const battle = new Battle({
        formatid: 'gen3customgame',
        send: (type, data) => {
          messages.push(`${type}:${JSON.stringify(data)}`);
        },
      });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Test', team: packedTeam });
      battle.setPlayer('p2', { name: 'Test2', team: packedTeam });
      // After both players are set, messages should be sent
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('setPlayer', () => {
    it('should accept team as string', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      expect(battle.sides[0]?.name).toBe('Alice');
    });

    it('should accept team as array', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const team = [
        {
          name: 'Pikachu',
          species: 'Pikachu',
          ability: 'Static',
          item: '',
          moves: ['Thunderbolt'],
          evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          nature: 'Hardy',
          level: 50,
          gender: '' as const,
          shiny: false,
        },
      ];
      battle.setPlayer('p1', { name: 'Alice', team });
      expect(battle.sides[0]?.name).toBe('Alice');
      expect(battle.sides[0]?.pokemon.length).toBe(1);
    });

    it('should use default name if not provided', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { team: packedTeam });
      expect(battle.sides[0]?.name).toBe('Player 1');
    });
  });

  describe('resetRNG', () => {
    it('should reset with string seed', () => {
      const battle = new Battle({ formatid: 'gen3customgame', seed: [1, 2, 3, 4] });
      battle.resetRNG('5,6,7,8');
      expect(battle.prng.getSeed()).toBe('5,6,7,8');
    });

    it('should reset with array seed', () => {
      const battle = new Battle({ formatid: 'gen3customgame', seed: [1, 2, 3, 4] });
      battle.resetRNG([9, 10, 11, 12]);
      expect(battle.prng.getSeed()).toBe('9,10,11,12');
    });

    it('should handle invalid string seed gracefully', () => {
      const battle = new Battle({ formatid: 'gen3customgame', seed: [1, 2, 3, 4] });
      battle.resetRNG('invalid');
      // Should not change the seed (invalid has wrong number of parts)
      expect(battle.prng.getSeed()).toBe('1,2,3,4');
    });
  });

  describe('toID getter', () => {
    it('should return toID function', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      expect(typeof battle.toID).toBe('function');
      expect(battle.toID('Hello World')).toBe('helloworld');
    });
  });

  describe('win', () => {
    it('should declare winner for specified player', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      battle.win('p1');

      expect(battle.ended).toBe(true);
    });

    it('should declare tie when winner is null', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      battle.win(null);

      expect(battle.ended).toBe(true);
    });
  });

  describe('lose', () => {
    it('should force loss for specified player', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      battle.lose('p1');

      expect(battle.ended).toBe(true);
    });
  });

  describe('undoChoice', () => {
    it('should undo a player choice', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      battle.choose('p1', 'move 1');
      expect(battle.sides[0]?.choice.done).toBe(true);

      battle.undoChoice('p1');
      expect(battle.sides[0]?.choice.done).toBe(false);
      expect(battle.sides[0]?.choice.actions.length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should mark battle as ended', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      expect(battle.ended).toBe(false);
      battle.destroy();
      expect(battle.ended).toBe(true);
    });
  });

  describe('inputLog property', () => {
    it('should contain input log entries', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      battle.choose('p1', 'move 1');
      battle.choose('p2', 'move 1');

      expect(battle.inputLog.length).toBeGreaterThan(0);
    });
  });

  describe('PRNG access', () => {
    it('should allow access to RNG seed via prng property', () => {
      const battle = new Battle({ formatid: 'gen3customgame', seed: [1, 2, 3, 4] });
      expect(battle.prng.getSeed()).toBe('1,2,3,4');
    });
  });

  describe('Team access via sides', () => {
    it('should access team via sides property', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });

      expect(battle.sides[0]).toBeDefined();
      expect(battle.sides[0]?.pokemon.length).toBe(1);
    });

    it('should return undefined for unset slot', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      expect(battle.sides[0]).toBeUndefined();
    });
  });

  describe('sendUpdates', () => {
    it('should send accumulated messages', () => {
      const messages: any[] = [];
      const battle = new Battle({
        formatid: 'gen3customgame',
        send: (type, data) => {
          messages.push({ type, data });
        },
      });

      const packedTeam = createPackedTeam([{ species: 'Pikachu', moves: ['Thunderbolt'] }]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });

      // Clear and add a message manually
      battle.add('test', 'message');
      battle.sendUpdates();

      expect(messages.some((m) => m.type === 'update')).toBe(true);
    });
  });

  describe('Boost clamping', () => {
    it('should clamp boosts to -6 and +6', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const packedTeam = createPackedTeam([
        { species: 'Scyther', moves: ['Swords Dance', 'Slash'] },
      ]);
      battle.setPlayer('p1', { name: 'Alice', team: packedTeam });
      battle.setPlayer('p2', { name: 'Bob', team: packedTeam });

      // Use swords dance many times - boosts should clamp at +6
      for (let i = 0; i < 5; i++) {
        battle.choose('p1', 'move 1'); // Swords Dance (+2 atk each)
        battle.choose('p2', 'move 1');
      }

      // Attack should be clamped at 6
      const active = battle.sides[0]?.active[0];
      expect(active?.boosts.atk).toBeLessThanOrEqual(6);
    });
  });

  describe('Status type immunities', () => {
    it('should prevent burn on Fire types', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const p1Team = createPackedTeam([{ species: 'Vulpix', moves: ['Will-O-Wisp'] }]);
      const p2Team = createPackedTeam([{ species: 'Charmander', moves: ['Scratch'] }]); // Fire type
      battle.setPlayer('p1', { name: 'Alice', team: p1Team });
      battle.setPlayer('p2', { name: 'Bob', team: p2Team });

      battle.choose('p1', 'move 1'); // Will-O-Wisp
      battle.choose('p2', 'move 1');

      // Charmander should not be burned
      const active = battle.sides[1]?.active[0];
      expect(active?.status).not.toBe('brn');
    });

    it('should prevent paralysis on Electric types', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const p1Team = createPackedTeam([{ species: 'Pikachu', moves: ['Thunder Wave'] }]);
      const p2Team = createPackedTeam([{ species: 'Magnemite', moves: ['Tackle'] }]); // Electric type
      battle.setPlayer('p1', { name: 'Alice', team: p1Team });
      battle.setPlayer('p2', { name: 'Bob', team: p2Team });

      battle.choose('p1', 'move 1'); // Thunder Wave
      battle.choose('p2', 'move 1');

      // Magnemite should not be paralyzed
      const active = battle.sides[1]?.active[0];
      expect(active?.status).not.toBe('par');
    });

    it('should prevent poison on Poison types', () => {
      const battle = new Battle({ formatid: 'gen3customgame' });
      const p1Team = createPackedTeam([{ species: 'Grimer', moves: ['Toxic'] }]);
      const p2Team = createPackedTeam([{ species: 'Ekans', moves: ['Scratch'] }]); // Poison type
      battle.setPlayer('p1', { name: 'Alice', team: p1Team });
      battle.setPlayer('p2', { name: 'Bob', team: p2Team });

      battle.choose('p1', 'move 1'); // Toxic
      battle.choose('p2', 'move 1');

      // Ekans should not be poisoned
      const active = battle.sides[1]?.active[0];
      expect(active?.status).not.toBe('tox');
      expect(active?.status).not.toBe('psn');
    });
  });
});
