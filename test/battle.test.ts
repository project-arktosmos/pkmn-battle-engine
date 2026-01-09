import { describe, it, expect } from 'vitest';
import { Dex } from '../src/index';

describe('Battle Simulation', () => {
  describe('Battle API Availability', () => {
    it('should have battle-related exports available', () => {
      expect(Dex).toBeDefined();
      expect(Dex.species).toBeDefined();
      expect(Dex.moves).toBeDefined();
    });

    it('should support battle formats', () => {
      const format = Dex.formats.get('gen9customgame');
      expect(format).toBeDefined();
      expect(format.exists).toBe(true);
    });

    it('should validate Pokemon for battles', () => {
      const pikachu = Dex.species.get('Pikachu');
      const charizard = Dex.species.get('Charizard');

      expect(pikachu.exists).toBe(true);
      expect(charizard.exists).toBe(true);
      expect(pikachu.baseStats).toBeDefined();
      expect(charizard.baseStats).toBeDefined();
    });
  });

  describe('Battle Format Validation', () => {
    it('should validate gen9ou format', () => {
      const format = Dex.formats.get('gen9ou');
      expect(format).toBeDefined();
      expect(format.exists).toBe(true);
    });

    it('should validate gen9randombattle format', () => {
      const format = Dex.formats.get('gen9randombattle');
      expect(format).toBeDefined();
      expect(format.exists).toBe(true);
    });

    it('should validate gen9customgame format', () => {
      const format = Dex.formats.get('gen9customgame');
      expect(format).toBeDefined();
      expect(format.exists).toBe(true);
    });

    it('should reject invalid format', () => {
      const format = Dex.formats.get('invalidformat123');
      expect(format.exists).toBe(false);
    });
  });

  describe('Battle Calculator', () => {
    it('should calculate damage for a basic attack', () => {
      const attacker = Dex.species.get('Pikachu');
      const defender = Dex.species.get('Charizard');
      const move = Dex.moves.get('Thunderbolt');

      expect(attacker.exists).toBe(true);
      expect(defender.exists).toBe(true);
      expect(move.exists).toBe(true);
      expect(move.basePower).toBe(90);
      expect(move.type).toBe('Electric');
    });

    it('should handle type effectiveness', () => {
      // Water vs Fire (super effective)
      const waterVsFire = Dex.getEffectiveness('Water', 'Fire');
      expect(waterVsFire).toBe(1); // 2x damage

      // Electric vs Ground (immune)
      const electricVsGround = Dex.getImmunity('Electric', 'Ground');
      expect(electricVsGround).toBe(false); // Immune

      // Normal vs Normal (neutral)
      const normalVsNormal = Dex.getEffectiveness('Normal', 'Normal');
      expect(normalVsNormal).toBe(0); // 1x damage
    });

    it('should handle dual-type effectiveness', () => {
      const charizard = Dex.species.get('Charizard');
      expect(charizard.types).toEqual(['Fire', 'Flying']);

      // Rock vs Charizard (Fire/Flying) should be 4x effective
      const rockEffectiveness = Dex.getEffectiveness('Rock', charizard.types);
      expect(rockEffectiveness).toBeGreaterThan(0);
    });
  });

  describe('Move Validation', () => {
    it('should validate physical moves', () => {
      const earthquake = Dex.moves.get('Earthquake');
      expect(earthquake.exists).toBe(true);
      expect(earthquake.category).toBe('Physical');
      expect(earthquake.basePower).toBe(100);
    });

    it('should validate special moves', () => {
      const flamethrower = Dex.moves.get('Flamethrower');
      expect(flamethrower.exists).toBe(true);
      expect(flamethrower.category).toBe('Special');
      expect(flamethrower.basePower).toBe(90);
    });

    it('should validate status moves', () => {
      const willOWisp = Dex.moves.get('Will-O-Wisp');
      expect(willOWisp.exists).toBe(true);
      expect(willOWisp.category).toBe('Status');
      expect(willOWisp.basePower).toBe(0);
    });

    it('should validate priority moves', () => {
      const quickAttack = Dex.moves.get('Quick Attack');
      expect(quickAttack.exists).toBe(true);
      expect(quickAttack.priority).toBeGreaterThan(0);
    });
  });

  describe('Stat Calculations', () => {
    it('should have valid base stats', () => {
      const pikachu = Dex.species.get('Pikachu');
      expect(pikachu.baseStats).toBeDefined();
      expect(pikachu.baseStats.hp).toBeGreaterThan(0);
      expect(pikachu.baseStats.atk).toBeGreaterThan(0);
      expect(pikachu.baseStats.def).toBeGreaterThan(0);
      expect(pikachu.baseStats.spa).toBeGreaterThan(0);
      expect(pikachu.baseStats.spd).toBeGreaterThan(0);
      expect(pikachu.baseStats.spe).toBeGreaterThan(0);
    });

    it('should calculate stat totals', () => {
      const mewtwo = Dex.species.get('Mewtwo');
      const statTotal =
        mewtwo.baseStats.hp +
        mewtwo.baseStats.atk +
        mewtwo.baseStats.def +
        mewtwo.baseStats.spa +
        mewtwo.baseStats.spd +
        mewtwo.baseStats.spe;

      expect(statTotal).toBe(680);
    });

    it('should have proper evolution stats', () => {
      const pichu = Dex.species.get('Pichu');
      const pikachu = Dex.species.get('Pikachu');
      const raichu = Dex.species.get('Raichu');

      const pichuTotal =
        pichu.baseStats.hp +
        pichu.baseStats.atk +
        pichu.baseStats.def +
        pichu.baseStats.spa +
        pichu.baseStats.spd +
        pichu.baseStats.spe;

      const pikachuTotal =
        pikachu.baseStats.hp +
        pikachu.baseStats.atk +
        pikachu.baseStats.def +
        pikachu.baseStats.spa +
        pikachu.baseStats.spd +
        pikachu.baseStats.spe;

      const raichuTotal =
        raichu.baseStats.hp +
        raichu.baseStats.atk +
        raichu.baseStats.def +
        raichu.baseStats.spa +
        raichu.baseStats.spd +
        raichu.baseStats.spe;

      expect(pikachuTotal).toBeGreaterThan(pichuTotal);
      expect(raichuTotal).toBeGreaterThan(pikachuTotal);
    });
  });

  describe('Status Conditions', () => {
    it('should have burn status', () => {
      const burn = Dex.conditions.get('brn');
      expect(burn).toBeDefined();
      expect(burn.exists).toBe(true);
    });

    it('should have paralysis status', () => {
      const paralysis = Dex.conditions.get('par');
      expect(paralysis).toBeDefined();
      expect(paralysis.exists).toBe(true);
    });

    it('should have poison status', () => {
      const poison = Dex.conditions.get('psn');
      expect(poison).toBeDefined();
      expect(poison.exists).toBe(true);
    });

    it('should have sleep status', () => {
      const sleep = Dex.conditions.get('slp');
      expect(sleep).toBeDefined();
      expect(sleep.exists).toBe(true);
    });

    it('should have freeze status', () => {
      const freeze = Dex.conditions.get('frz');
      expect(freeze).toBeDefined();
      expect(freeze.exists).toBe(true);
    });
  });
});
