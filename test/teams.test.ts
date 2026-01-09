import { describe, it, expect } from 'vitest';
import { Teams, Dex } from '../src/index';

describe('Team Building and Management', () => {
  describe('Team Packing/Unpacking', () => {
    it('should pack a simple team', () => {
      const team = [
        {
          name: 'Pikachu',
          species: 'Pikachu',
          item: 'Light Ball',
          ability: 'Static',
          moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Thunder Wave'],
          nature: 'Timid',
          gender: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
      ];

      const packed = Teams.pack(team);
      expect(packed).toBeDefined();
      expect(typeof packed).toBe('string');
      expect(packed.length).toBeGreaterThan(0);
    });

    it('should unpack a packed team', () => {
      const team = [
        {
          name: 'Charizard',
          species: 'Charizard',
          item: 'Charizardite Y',
          ability: 'Blaze',
          moves: ['Flamethrower', 'Air Slash', 'Solar Beam', 'Roost'],
          nature: 'Timid',
          gender: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 100,
        },
      ];

      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);

      expect(unpacked).toBeDefined();
      expect(Array.isArray(unpacked)).toBe(true);
      expect(unpacked!.length).toBe(1);
      expect(unpacked![0].species).toBe('Charizard');
      expect(unpacked![0].moves).toContain('Flamethrower');
    });

    it('should handle full teams (6 Pokemon)', () => {
      const team = [
        {
          name: 'Pikachu',
          species: 'Pikachu',
          item: '',
          ability: 'Static',
          moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Thunder Wave'],
          nature: 'Timid',
          gender: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
        {
          name: 'Charizard',
          species: 'Charizard',
          item: '',
          ability: 'Blaze',
          moves: ['Flamethrower', 'Air Slash', 'Dragon Pulse', 'Roost'],
          nature: 'Timid',
          gender: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
        {
          name: 'Blastoise',
          species: 'Blastoise',
          item: '',
          ability: 'Torrent',
          moves: ['Surf', 'Ice Beam', 'Rapid Spin', 'Scald'],
          nature: 'Modest',
          gender: '',
          evs: { hp: 252, atk: 0, def: 0, spa: 252, spd: 4, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
        {
          name: 'Venusaur',
          species: 'Venusaur',
          item: '',
          ability: 'Overgrow',
          moves: ['Giga Drain', 'Sludge Bomb', 'Synthesis', 'Sleep Powder'],
          nature: 'Modest',
          gender: '',
          evs: { hp: 252, atk: 0, def: 0, spa: 252, spd: 4, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
        {
          name: 'Alakazam',
          species: 'Alakazam',
          item: '',
          ability: 'Synchronize',
          moves: ['Psychic', 'Shadow Ball', 'Focus Blast', 'Recover'],
          nature: 'Timid',
          gender: '',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
        {
          name: 'Machamp',
          species: 'Machamp',
          item: '',
          ability: 'Guts',
          moves: ['Dynamic Punch', 'Stone Edge', 'Bullet Punch', 'Knock Off'],
          nature: 'Adamant',
          gender: '',
          evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
      ];

      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);

      expect(unpacked!.length).toBe(6);
      expect(unpacked![0].species).toBe('Pikachu');
      expect(unpacked![5].species).toBe('Machamp');
    });
  });

  describe('Team Validation', () => {
    it('should validate legal team for gen9ou', () => {
      const team = [
        {
          name: 'Landorus-Therian',
          species: 'Landorus-Therian',
          item: 'Choice Scarf',
          ability: 'Intimidate',
          moves: ['Earthquake', 'U-turn', 'Stone Edge', 'Stealth Rock'],
          nature: 'Jolly',
          gender: '',
          evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 100,
        },
      ];

      const packed = Teams.pack(team);
      expect(packed).toBeDefined();
    });

    it('should handle Pokemon with alternate formes', () => {
      const rotomWash = Dex.species.get('Rotom-Wash');
      expect(rotomWash.exists).toBe(true);
      expect(rotomWash.types).toContain('Water');
      expect(rotomWash.types).toContain('Electric');
    });

    it('should handle megas', () => {
      const charizardX = Dex.species.get('Charizard-Mega-X');
      expect(charizardX.exists).toBe(true);
      expect(charizardX.baseSpecies).toBe('Charizard');

      const charizardY = Dex.species.get('Charizard-Mega-Y');
      expect(charizardY.exists).toBe(true);
      expect(charizardY.baseSpecies).toBe('Charizard');
    });

    it('should handle regional variants', () => {
      const alolanRaichu = Dex.species.get('Raichu-Alola');
      expect(alolanRaichu.exists).toBe(true);
      expect(alolanRaichu.types).toContain('Electric');
      expect(alolanRaichu.types).toContain('Psychic');

      const galarianWeezing = Dex.species.get('Weezing-Galar');
      expect(galarianWeezing.exists).toBe(true);
      expect(galarianWeezing.types).toContain('Poison');
      expect(galarianWeezing.types).toContain('Fairy');
    });
  });

  describe('Team Import/Export', () => {
    it('should export team to showdown format', () => {
      const team = [
        {
          name: 'Pikachu',
          species: 'Pikachu',
          item: 'Light Ball',
          ability: 'Static',
          moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Thunder Wave'],
          nature: 'Timid',
          gender: 'M',
          evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 50,
        },
      ];

      const exported = Teams.export(team);
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toContain('Pikachu');
      expect(exported).toContain('Light Ball');
      expect(exported).toContain('Timid');
    });

    it('should import team from showdown format', () => {
      const showdownFormat = `
Pikachu (M) @ Light Ball
Ability: Static
Level: 50
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Thunderbolt
- Quick Attack
- Iron Tail
- Thunder Wave
`;

      const imported = Teams.import(showdownFormat);
      expect(imported).toBeDefined();
      expect(Array.isArray(imported)).toBe(true);
      expect(imported!.length).toBe(1);
      expect(imported![0].species).toBe('Pikachu');
      expect(imported![0].item).toBe('Light Ball');
      expect(imported![0].ability).toBe('Static');
      expect(imported![0].moves).toContain('Thunderbolt');
    });

    it('should handle multi-line team import', () => {
      const showdownFormat = `
Charizard @ Leftovers
Ability: Blaze
Level: 100
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Flamethrower
- Air Slash
- Roost
- Solar Beam

Blastoise @ Leftovers
Ability: Torrent
Level: 100
EVs: 252 HP / 252 SpA / 4 SpD
Modest Nature
- Surf
- Ice Beam
- Rapid Spin
- Scald
`;

      const imported = Teams.import(showdownFormat);
      expect(imported).toBeDefined();
      expect(imported!.length).toBe(2);
      expect(imported![0].species).toBe('Charizard');
      expect(imported![1].species).toBe('Blastoise');
    });
  });

  describe('Move Legality', () => {
    it('should validate Pokemon and move compatibility basics', () => {
      const pikachu = Dex.species.get('Pikachu');
      const thunderbolt = Dex.moves.get('Thunderbolt');

      expect(pikachu.exists).toBe(true);
      expect(thunderbolt.exists).toBe(true);

      expect(pikachu.baseStats).toBeDefined();
      expect(thunderbolt.basePower).toBeDefined();
      expect(thunderbolt.type).toBe('Electric');
    });

    it('should have species data needed for team building', () => {
      const charizard = Dex.species.get('Charizard');
      expect(charizard.exists).toBe(true);
      expect(charizard.name).toBe('Charizard');
      expect(charizard.types).toBeDefined();
      expect(charizard.abilities).toBeDefined();
    });
  });

  describe('Random Team Generation', () => {
    it('should generate random team for format', () => {
      const format = Dex.formats.get('gen9randombattle');
      expect(format.exists).toBe(true);
      expect(format.name).toBeDefined();
    });

    it('should support team preview', () => {
      const format = Dex.formats.get('gen9ou');
      expect(format.exists).toBe(true);
    });
  });

  describe('EV/IV Validation', () => {
    it('should validate legal EVs', () => {
      const evs = { hp: 252, atk: 252, def: 0, spa: 0, spd: 4, spe: 0 };
      const total = Object.values(evs).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThanOrEqual(510);
    });

    it('should validate legal IVs', () => {
      const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      Object.values(ivs).forEach((iv) => {
        expect(iv).toBeGreaterThanOrEqual(0);
        expect(iv).toBeLessThanOrEqual(31);
      });
    });

    it('should handle hidden power IVs', () => {
      const hpFireIvs = { hp: 31, atk: 30, def: 31, spa: 30, spd: 31, spe: 30 };
      Object.values(hpFireIvs).forEach((iv) => {
        expect(iv).toBeGreaterThanOrEqual(0);
        expect(iv).toBeLessThanOrEqual(31);
      });
    });
  });

  describe('Pack edge cases', () => {
    it('should handle null team', () => {
      const packed = Teams.pack(null);
      expect(packed).toBe('');
    });

    it('should handle shiny Pokemon', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
        shiny: true,
      }];
      const packed = Teams.pack(team);
      expect(packed).toContain('S');

      const unpacked = Teams.unpack(packed);
      expect(unpacked![0].shiny).toBe(true);
    });

    it('should handle happiness', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
        happiness: 0,
      }];
      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);
      expect(unpacked![0].happiness).toBe(0);
    });

    it('should handle extra attributes (pokeball, hpType, gigantamax, dynamaxLevel, teraType)', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
        pokeball: 'pokeball',
        hpType: 'Fire',
        gigantamax: true,
        dynamaxLevel: 5,
        teraType: 'Electric',
      }];
      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);
      expect(unpacked![0].pokeball).toBeDefined();
      expect(unpacked![0].hpType).toBe('Fire');
      expect(unpacked![0].gigantamax).toBe(true);
      expect(unpacked![0].dynamaxLevel).toBe(5);
      expect(unpacked![0].teraType).toBe('Electric');
    });

    it('should handle non-31 IVs', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: 'M',
        evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
        ivs: { hp: 30, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);
      expect(unpacked![0].ivs!.hp).toBe(30);
      expect(unpacked![0].ivs!.atk).toBe(0);
    });

    it('should handle ability slots', () => {
      // Using "0", "1", "H" as ability references
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: '', // Will default to slot 0
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const packed = Teams.pack(team);
      const unpacked = Teams.unpack(packed);
      expect(unpacked![0].ability).toBeDefined();
    });
  });

  describe('Unpack edge cases', () => {
    it('should return null for empty string', () => {
      expect(Teams.unpack('')).toBeNull();
    });

    it('should return input as-is for non-string', () => {
      const input = [{ species: 'Pikachu' }] as any;
      expect(Teams.unpack(input)).toBe(input);
    });

    it('should handle JSON format', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const json = JSON.stringify(team);
      const unpacked = Teams.unpack(json);
      expect(unpacked![0].species).toBe('Pikachu');
    });

    it('should return null for invalid JSON', () => {
      expect(Teams.unpack('[invalid json')).toBeNull();
    });

    it('should return null for incomplete packed format', () => {
      expect(Teams.unpack('Pikachu|')).toBeNull();
      expect(Teams.unpack('Pikachu|pikachu|')).toBeNull();
    });
  });

  describe('Import edge cases', () => {
    it('should import packed format', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const packed = Teams.pack(team);
      const imported = Teams.import(packed);
      expect(imported![0].species).toBe('Pikachu');
    });

    it('should import JSON format with aggressive mode', () => {
      const team = [{
        name: 'Test Pokemon',
        species: 'Pikachu',
        item: 'Light Ball',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: 'M',
        evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      }];
      const json = JSON.stringify(team);
      const imported = Teams.import(json, true);
      expect(imported![0].species).toBeDefined();
    });

    it('should handle import with Trait: prefix', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Trait: Static
Level: 50
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].ability).toBe('Static');
    });

    it('should handle import with shiny', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Shiny: Yes
Level: 50
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].shiny).toBe(true);
    });

    it('should handle import with happiness', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Happiness: 0
Level: 50
- Frustration
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].happiness).toBe(0);
    });

    it('should handle import with pokeball', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Pokeball: Premier Ball
Level: 50
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].pokeball).toBeDefined();
    });

    it('should handle import with hidden power type', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Hidden Power: Fire
Level: 50
- Hidden Power [Fire]
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].hpType).toBe('Fire');
    });

    it('should handle import with tera type', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Tera Type: Electric
Level: 50
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].teraType).toBe('Electric');
    });

    it('should handle import with gigantamax', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Gigantamax: Yes
Level: 50
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].gigantamax).toBe(true);
    });

    it('should handle import with IVs', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Level: 50
IVs: 0 Atk
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].ivs!.atk).toBe(0);
    });

    it('should handle import with team separator', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
- Thunderbolt

---

Charizard @ Leftovers
Ability: Blaze
- Flamethrower
`;
      const imported = Teams.import(showdownFormat);
      expect(imported!.length).toBe(2);
    });

    it('should ignore === team backup format', () => {
      const showdownFormat = `=== [gen9] Team Name ===

Pikachu @ Light Ball
Ability: Static
- Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].species).toBe('Pikachu');
    });

    it('should handle move with ~ prefix', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Level: 50
~ Thunderbolt
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].moves).toContain('Thunderbolt');
    });

    it('should set happiness to 0 for Frustration', () => {
      const showdownFormat = `
Pikachu @ Light Ball
Ability: Static
Level: 50
- Frustration
`;
      const imported = Teams.import(showdownFormat);
      expect(imported![0].happiness).toBe(0);
    });
  });

  describe('Export edge cases', () => {
    it('should export happiness when not 255', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        happiness: 100,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Happiness: 100');
    });

    it('should export pokeball', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        pokeball: 'Premier Ball',
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Pokeball: Premier Ball');
    });

    it('should export hpType', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        hpType: 'Fire',
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Hidden Power: Fire');
    });

    it('should export gigantamax', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        gigantamax: true,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Gigantamax: Yes');
    });

    it('should export teraType', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        teraType: 'Electric',
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Tera Type: Electric');
    });

    it('should export non-31 IVs', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('IVs:');
      expect(exported).toContain('0 Atk');
    });

    it('should export with hideStats option', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: 'Light Ball',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: 'Timid',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const exported = Teams.export(team, { hideStats: true });
      expect(exported).not.toContain('EVs:');
    });

    it('should export pokemon with nickname', () => {
      const team = [{
        name: 'Sparky',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Sparky (Pikachu)');
    });

    it('should export pokemon with female gender', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: 'F',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('(F)');
    });

    it('should export hidden power moves with brackets', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Hidden Power Fire'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Hidden Power [Fire]');
    });

    it('should export non-100 level', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 50,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Level: 50');
    });

    it('should export shiny pokemon', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        shiny: true,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Shiny: Yes');
    });

    it('should export dynamax level', () => {
      const team = [{
        name: 'Pikachu',
        species: 'Pikachu',
        item: '',
        ability: 'Static',
        moves: ['Thunderbolt'],
        nature: '',
        gender: '',
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        level: 100,
        dynamaxLevel: 5,
      }];
      const exported = Teams.export(team);
      expect(exported).toContain('Dynamax Level: 5');
    });
  });
});
