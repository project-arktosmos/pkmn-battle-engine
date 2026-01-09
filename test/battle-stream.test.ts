import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleStream, getPlayerStreams } from '../src/battle/battle-stream';
import { Teams } from '../src/teams/teams';

describe('BattleStream', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const stream = new BattleStream();
      expect(stream.debug).toBe(false);
      expect(stream.noCatch).toBe(false);
      expect(stream.replay).toBe(false);
      expect(stream.keepAlive).toBe(false);
      expect(stream.battle).toBeNull();
    });

    it('should accept custom options', () => {
      const stream = new BattleStream({
        debug: true,
        noCatch: true,
        keepAlive: true,
        replay: 'spectator',
      });
      expect(stream.debug).toBe(true);
      expect(stream.noCatch).toBe(true);
      expect(stream.replay).toBe('spectator');
      expect(stream.keepAlive).toBe(true);
    });
  });

  describe('write commands', () => {
    let stream: BattleStream;
    let team1: string;
    let team2: string;

    beforeEach(() => {
      stream = new BattleStream();
      team1 = Teams.pack([{
        name: 'Pikachu',
        species: 'Pikachu',
        ability: 'Static',
        item: '',
        moves: ['Thunderbolt'],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: 'Hardy',
        level: 50,
        gender: '',
        shiny: false,
      }]);
      team2 = Teams.pack([{
        name: 'Bulbasaur',
        species: 'Bulbasaur',
        ability: 'Overgrow',
        item: '',
        moves: ['Tackle'],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: 'Hardy',
        level: 50,
        gender: '',
        shiny: false,
      }]);
    });

    it('should start a battle', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      expect(stream.battle).not.toBeNull();
    });

    it('should set players', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      expect(stream.battle!.sides[0].name).toBe('Alice');
      expect(stream.battle!.sides[1].name).toBe('Bob');
    });

    it('should handle player choices', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      // After players are set, battle should be started
      stream.write('>p1 move 1');
      stream.write('>p2 move 1');
      // Should not throw
    });

    it('should handle undo command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      stream.write('>p1 move 1');
      stream.write('>p1 undo');
      // Should not throw
    });

    it('should handle forcewin command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      stream.write('>forcewin p1');
      expect(stream.battle!.ended).toBe(true);
      expect(stream.battle!.winner).toBe('p1');
    });

    it('should handle forcetie command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      stream.write('>forcetie');
      expect(stream.battle!.ended).toBe(true);
      expect(stream.battle!.winner).toBeNull();
    });

    it('should handle forcelose command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      stream.write('>forcelose p1');
      expect(stream.battle!.ended).toBe(true);
    });

    it('should handle reseed command', async () => {
      stream.write('>start {"formatid":"gen3customgame","seed":[1,2,3,4]}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      const oldSeed = stream.battle!.prng.getSeed();
      stream.write('>reseed 5,6,7,8');
      expect(stream.battle!.prng.getSeed()).not.toBe(oldSeed);
    });

    it('should handle requestlog command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      const messages: string[] = [];
      const collectPromise = (async () => {
        for await (const msg of stream) {
          messages.push(msg);
          if (msg.startsWith('requesteddata')) break;
        }
      })();

      stream.write('>requestlog');

      await Promise.race([
        collectPromise,
        new Promise(r => setTimeout(r, 100))
      ]);

      const logMsg = messages.find(m => m.startsWith('requesteddata'));
      expect(logMsg).toBeDefined();
    });

    it('should handle requestteam command', async () => {
      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      const messages: string[] = [];
      const collectPromise = (async () => {
        for await (const msg of stream) {
          messages.push(msg);
          if (msg.startsWith('requesteddata')) break;
        }
      })();

      stream.write('>requestteam p1');

      await Promise.race([
        collectPromise,
        new Promise(r => setTimeout(r, 100))
      ]);

      const teamMsg = messages.find(m => m.startsWith('requesteddata'));
      expect(teamMsg).toBeDefined();
    });

    it('should handle invalid requestteam slot in noCatch mode', async () => {
      const stream = new BattleStream({ noCatch: true });
      await stream.write('>start {"formatid":"gen3customgame"}');
      await stream.write(`>player p1 {"name":"Alice","team":"${team1}"}`);
      await stream.write(`>player p2 {"name":"Bob","team":"${team2}"}`);

      await expect(stream.write('>requestteam invalid')).rejects.toThrow('does not exist');
    });

    it('should ignore version commands', async () => {
      stream.write('>version 1.0');
      stream.write('>version-origin test');
      // Should not throw
    });

    it('should throw for unrecognized commands in noCatch mode', async () => {
      const stream = new BattleStream({ noCatch: true });
      await stream.write('>start {"formatid":"gen3customgame"}');

      await expect(stream.write('>unknown command')).rejects.toThrow('Unrecognized command');
    });

    it('should push errors in normal mode', async () => {
      const stream = new BattleStream({ noCatch: false });
      stream.write('>start {"formatid":"gen3customgame"}');

      // In normal mode, errors are caught and pushed to stream
      stream.write('>invalid command');
      // Stream should now be in error state - it won't throw
    });
  });

  describe('replay mode', () => {
    it('should filter messages in replay mode', async () => {
      const stream = new BattleStream({ replay: true });
      const team = Teams.pack([{
        name: 'Pikachu',
        species: 'Pikachu',
        ability: 'Static',
        item: '',
        moves: ['Thunderbolt'],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: 'Hardy',
        level: 50,
        gender: '',
        shiny: false,
      }]);

      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"P1","team":"${team}"}`);
      stream.write(`>player p2 {"name":"P2","team":"${team}"}`);

      // Verify stream is in replay mode
      expect(stream.replay).toBe(true);
    });

    it('should filter messages in spectator replay mode', async () => {
      const stream = new BattleStream({ replay: 'spectator' });
      expect(stream.replay).toBe('spectator');
    });
  });

  describe('destroy', () => {
    it('should destroy the battle', async () => {
      const stream = new BattleStream();
      const team = Teams.pack([{
        name: 'Pikachu',
        species: 'Pikachu',
        ability: 'Static',
        item: '',
        moves: ['Thunderbolt'],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: 'Hardy',
        level: 50,
        gender: '',
        shiny: false,
      }]);

      stream.write('>start {"formatid":"gen3customgame"}');
      stream.write(`>player p1 {"name":"P1","team":"${team}"}`);
      stream.write(`>player p2 {"name":"P2","team":"${team}"}`);

      expect(stream.battle).not.toBeNull();
      stream.destroy();
      // Battle should be destroyed
    });
  });

  describe('writeEnd', () => {
    it('should end the stream', async () => {
      const stream = new BattleStream();

      await stream.writeEnd();

      const iterator = stream[Symbol.asyncIterator]();
      const result = await iterator.next();
      expect(result.done).toBe(true);
    });
  });
});

describe('getPlayerStreams', () => {
  it('should create separate player streams', () => {
    const mainStream = new BattleStream();
    const streams = getPlayerStreams(mainStream);

    expect(streams.omniscient).toBeDefined();
    expect(streams.spectator).toBeDefined();
    expect(streams.p1).toBeDefined();
    expect(streams.p2).toBeDefined();
    expect(streams.p3).toBeDefined();
    expect(streams.p4).toBeDefined();
  });

  it('should forward writes to main stream', async () => {
    const mainStream = new BattleStream();
    const streams = getPlayerStreams(mainStream);

    // Write through omniscient
    await streams.omniscient.write('>start {"formatid":"gen3customgame"}');
    expect(mainStream.battle).not.toBeNull();
  });

  it('should forward player writes with prefix', async () => {
    const mainStream = new BattleStream();
    const streams = getPlayerStreams(mainStream);

    const team = Teams.pack([{
      name: 'Pikachu',
      species: 'Pikachu',
      ability: 'Static',
      item: '',
      moves: ['Thunderbolt'],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      nature: 'Hardy',
      level: 50,
      gender: '',
      shiny: false,
    }]);

    mainStream.write('>start {"formatid":"gen3customgame"}');
    mainStream.write(`>player p1 {"name":"P1","team":"${team}"}`);
    mainStream.write(`>player p2 {"name":"P2","team":"${team}"}`);

    // Player streams should be able to write choices
    await streams.p1.write('move 1');
    await streams.p2.write('move 1');
    // Should not throw
  });

  it('should distribute messages to player streams', async () => {
    const mainStream = new BattleStream();
    const streams = getPlayerStreams(mainStream);

    const team = Teams.pack([{
      name: 'Pikachu',
      species: 'Pikachu',
      ability: 'Static',
      item: '',
      moves: ['Thunderbolt'],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      nature: 'Hardy',
      level: 50,
      gender: '',
      shiny: false,
    }]);

    // Set up collectors
    const omniscientMessages: string[] = [];
    const p1Messages: string[] = [];

    const collectOmniscient = (async () => {
      for await (const msg of streams.omniscient) {
        omniscientMessages.push(msg);
        if (omniscientMessages.length >= 5) break;
      }
    })();

    const collectP1 = (async () => {
      for await (const msg of streams.p1) {
        p1Messages.push(msg);
        if (p1Messages.length >= 3) break;
      }
    })();

    // Start battle
    mainStream.write('>start {"formatid":"gen3customgame"}');
    mainStream.write(`>player p1 {"name":"P1","team":"${team}"}`);
    mainStream.write(`>player p2 {"name":"P2","team":"${team}"}`);

    // Wait a bit for messages to propagate
    await Promise.race([
      Promise.all([collectOmniscient, collectP1]),
      new Promise(r => setTimeout(r, 500))
    ]);

    // Should have received some messages
    expect(omniscientMessages.length).toBeGreaterThan(0);
  });
});
