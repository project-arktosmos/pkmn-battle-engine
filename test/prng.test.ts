import { describe, it, expect, vi } from 'vitest';
import { PRNG } from '../src/battle/prng';

describe('PRNG', () => {
  describe('constructor', () => {
    it('should create PRNG with explicit seed', () => {
      const seed: [number, number, number, number] = [1, 2, 3, 4];
      const prng = new PRNG(seed);
      expect(prng.seed).toEqual(seed);
      expect(prng.startingSeed).toEqual(seed);
    });

    it('should generate random seed when no seed provided', () => {
      const prng = new PRNG();
      expect(prng.seed).toHaveLength(4);
      expect(prng.seed.every(n => n >= 0 && n < 0x10000)).toBe(true);
    });

    it('should generate random seed when null provided', () => {
      const prng = new PRNG(null);
      expect(prng.seed).toHaveLength(4);
    });

    it('should parse string seed format', () => {
      const prng = new PRNG('100,200,300,400');
      expect(prng.seed).toEqual([100, 200, 300, 400]);
    });

    it('should generate random seed for invalid string format', () => {
      const prng = new PRNG('invalid,string');
      expect(prng.seed).toHaveLength(4);
    });

    it('should generate random seed for partial string format', () => {
      const prng = new PRNG('1,2,3');
      expect(prng.seed).toHaveLength(4);
    });

    it('should accept custom startingSeed', () => {
      const seed: [number, number, number, number] = [1, 2, 3, 4];
      const startingSeed: [number, number, number, number] = [5, 6, 7, 8];
      const prng = new PRNG(seed, startingSeed);
      expect(prng.seed).toEqual(seed);
      expect(prng.startingSeed).toEqual(startingSeed);
    });
  });

  describe('getSeed', () => {
    it('should return seed as comma-separated string', () => {
      const prng = new PRNG([10, 20, 30, 40]);
      expect(prng.getSeed()).toBe('10,20,30,40');
    });
  });

  describe('clone', () => {
    it('should create independent copy with same state', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const clone = prng.clone();

      // Both should produce the same sequence
      const original1 = prng.random();
      const clone1 = clone.random();
      expect(original1).toBe(clone1);

      // They should be independent
      prng.random();
      const clone2 = clone.random();
      const original2 = prng.random();
      expect(clone2).not.toBe(original2);
    });
  });

  describe('random', () => {
    it('should return number in [0, 1) when no args', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      for (let i = 0; i < 100; i++) {
        const val = prng.random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should return integer in [0, n) when one arg', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      for (let i = 0; i < 100; i++) {
        const val = prng.random(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('should return integer in [m, n) when two args', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      for (let i = 0; i < 100; i++) {
        const val = prng.random(5, 15);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThan(15);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('should handle float args by flooring them', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const val = prng.random(5.7, 10.3);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    });
  });

  describe('randomChance', () => {
    it('should return boolean based on probability', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      let trueCount = 0;
      for (let i = 0; i < 1000; i++) {
        if (prng.randomChance(50, 100)) trueCount++;
      }
      // Should be roughly 50% (allow for variance)
      expect(trueCount).toBeGreaterThan(400);
      expect(trueCount).toBeLessThan(600);
    });

    it('should always return true for 100% chance', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      for (let i = 0; i < 100; i++) {
        expect(prng.randomChance(100, 100)).toBe(true);
      }
    });

    it('should always return false for 0% chance', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      for (let i = 0; i < 100; i++) {
        expect(prng.randomChance(0, 100)).toBe(false);
      }
    });
  });

  describe('sample', () => {
    it('should return random item from array', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const items = ['a', 'b', 'c', 'd'];
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) {
        seen.add(prng.sample(items));
      }
      // Should have seen most items
      expect(seen.size).toBeGreaterThan(1);
    });

    it('should throw for empty array', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      expect(() => prng.sample([])).toThrow(RangeError);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array in place', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const original = [...items];
      prng.shuffle(items);

      // Should have same elements
      expect(items.sort()).toEqual(original.sort());
    });

    it('should shuffle with custom start and end', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      prng.shuffle(items, 2, 8);

      // First two and last two should be unchanged
      expect(items[0]).toBe(1);
      expect(items[1]).toBe(2);
      expect(items[8]).toBe(9);
      expect(items[9]).toBe(10);
    });

    it('should handle array with one element', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const items = [1];
      prng.shuffle(items);
      expect(items).toEqual([1]);
    });
  });

  describe('PRNG.generateSeed', () => {
    it('should generate valid seed', () => {
      const seed = PRNG.generateSeed();
      expect(seed).toHaveLength(4);
      expect(seed.every(n => n >= 0 && n < 0x10000)).toBe(true);
    });
  });

  describe('PRNG.get', () => {
    it('should return existing PRNG instance', () => {
      const prng = new PRNG([1, 2, 3, 4]);
      const result = PRNG.get(prng);
      expect(result).toBe(prng);
    });

    it('should create new PRNG from seed array', () => {
      const seed: [number, number, number, number] = [1, 2, 3, 4];
      const prng = PRNG.get(seed);
      expect(prng.seed).toEqual(seed);
    });

    it('should create new PRNG from string seed', () => {
      const prng = PRNG.get('1,2,3,4');
      expect(prng.seed).toEqual([1, 2, 3, 4]);
    });

    it('should create new PRNG with random seed for null', () => {
      const prng = PRNG.get(null);
      expect(prng.seed).toHaveLength(4);
    });
  });

  describe('reproducibility', () => {
    it('should produce same sequence with same seed', () => {
      const seed: [number, number, number, number] = [12345, 67890, 11111, 22222];
      const prng1 = new PRNG(seed);
      const prng2 = new PRNG(seed);

      for (let i = 0; i < 100; i++) {
        expect(prng1.random()).toBe(prng2.random());
      }
    });
  });
});
