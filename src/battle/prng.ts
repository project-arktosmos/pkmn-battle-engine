/**
 * PRNG - Pseudo Random Number Generator
 *
 * This implements a Gen 5-compatible PRNG using a 64-bit Linear Congruential Generator (LCG).
 * The seed is represented as four 16-bit numbers.
 *
 * The implementation is compatible with pokemon-showdown's PRNG for reproducible battles.
 */

export type PRNGSeed = [number, number, number, number];

/**
 * A PRNG for Gen 5+ that uses a 64-bit seed represented as four 16-bit numbers.
 */
export class PRNG {
  seed: PRNGSeed;
  readonly startingSeed: PRNGSeed;

  /**
   * Creates a new PRNG instance.
   * @param seed - Optional seed. If not provided, generates a random seed.
   * @param startingSeed - Optional starting seed for tracking.
   */
  constructor(seed?: PRNGSeed | string | null, startingSeed?: PRNGSeed) {
    if (!seed) {
      seed = PRNG.generateSeed();
    }

    // Handle string seed format (for compatibility)
    if (typeof seed === 'string') {
      const parts = seed.split(',').map(Number);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        seed = parts as PRNGSeed;
      } else {
        seed = PRNG.generateSeed();
      }
    }

    this.seed = [...seed] as PRNGSeed;
    this.startingSeed = startingSeed ? [...startingSeed] as PRNGSeed : [...seed] as PRNGSeed;
  }

  /**
   * Get the current seed as a string.
   */
  getSeed(): string {
    return this.seed.join(',');
  }

  /**
   * Clone the PRNG with the current state.
   */
  clone(): PRNG {
    return new PRNG([...this.seed], [...this.startingSeed]);
  }

  /**
   * Get a random number.
   *
   * - random() returns a real number in [0, 1)
   * - random(n) returns an integer in [0, n)
   * - random(m, n) returns an integer in [m, n)
   */
  random(from?: number, to?: number): number {
    const result = this.next();

    if (from !== undefined) from = Math.floor(from);
    if (to !== undefined) to = Math.floor(to);

    if (from === undefined) {
      return result / 0x100000000;
    } else if (to === undefined) {
      return Math.floor(result * from / 0x100000000);
    } else {
      return Math.floor(result * (to - from) / 0x100000000) + from;
    }
  }

  /**
   * Returns true with probability numerator/denominator.
   */
  randomChance(numerator: number, denominator: number): boolean {
    return this.random(denominator) < numerator;
  }

  /**
   * Return a random item from the given array.
   */
  sample<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('Cannot sample an empty array');
    }
    return items[this.random(items.length)];
  }

  /**
   * Fisher-Yates shuffle.
   */
  shuffle<T>(items: T[], start = 0, end = items.length): void {
    while (start < end - 1) {
      const nextIndex = this.random(start, end);
      if (start !== nextIndex) {
        [items[start], items[nextIndex]] = [items[nextIndex], items[start]];
      }
      start++;
    }
  }

  /**
   * Get the next random 32-bit number and advance the seed.
   */
  private next(): number {
    this.seed = this.nextFrame(this.seed);
    // Use the upper 32 bits
    return (this.seed[0] << 16 >>> 0) + this.seed[1];
  }

  /**
   * Advance the seed by one frame.
   *
   * The RNG is a Linear Congruential Generator (LCG) in the form:
   * x_{n+1} = (a * x_n + c) % m
   *
   * Where:
   * - a = 0x5D588B656C078965
   * - c = 0x00269EC3
   * - m = 2^64
   */
  private nextFrame(seed: PRNGSeed): PRNGSeed {
    const a: PRNGSeed = [0x5D58, 0x8B65, 0x6C07, 0x8965];
    const c: PRNGSeed = [0, 0, 0x26, 0x9EC3];
    return this.multiplyAdd(seed, a, c);
  }

  /**
   * Calculates a * b + c with 64-bit integers represented as four 16-bit chunks.
   */
  private multiplyAdd(a: PRNGSeed, b: PRNGSeed, c: PRNGSeed): PRNGSeed {
    const out: PRNGSeed = [0, 0, 0, 0];
    let carry = 0;

    for (let outIndex = 3; outIndex >= 0; outIndex--) {
      for (let bIndex = outIndex; bIndex < 4; bIndex++) {
        const aIndex = 3 - (bIndex - outIndex);
        carry += a[aIndex] * b[bIndex];
      }
      carry += c[outIndex];
      out[outIndex] = carry & 0xFFFF;
      carry >>>= 16;
    }

    return out;
  }

  /**
   * Generate a random seed.
   */
  static generateSeed(): PRNGSeed {
    return [
      Math.floor(Math.random() * 0x10000),
      Math.floor(Math.random() * 0x10000),
      Math.floor(Math.random() * 0x10000),
      Math.floor(Math.random() * 0x10000),
    ];
  }

  /**
   * Get a PRNG instance from various input types.
   */
  static get(prng?: PRNG | PRNGSeed | string | null): PRNG {
    if (prng instanceof PRNG) return prng;
    return new PRNG(prng as PRNGSeed | string | null);
  }
}
