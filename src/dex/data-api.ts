/**
 * Generic DataAPI class for accessing Pokemon game data
 *
 * Provides a consistent interface for accessing data with:
 * - ID normalization via toID()
 * - Caching for performance
 * - Exists checking with defaults for missing data
 */

import { toID } from '../utils/id';

/**
 * Extended type with id and exists properties
 */
export type DataWithId<T> = T & {
  id: string;
  exists: boolean;
};

/**
 * Generic data access class that provides get() and all() methods
 * with caching and ID normalization
 */
export class DataAPI<T extends object> {
  private cache = new Map<string, DataWithId<T>>();

  constructor(
    private readonly data: Record<string, T>,
    private readonly defaults: Partial<T>
  ) {}

  /**
   * Get a data entry by name/ID
   * Returns data with exists: true if found, or defaults with exists: false
   */
  get(name: string): DataWithId<T> {
    const id = toID(name);

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const entry = this.data[id];
    const result: DataWithId<T> = entry
      ? { ...entry, id, exists: true }
      : ({ ...this.defaults, id, exists: false } as DataWithId<T>);

    this.cache.set(id, result);
    return result;
  }

  /**
   * Get all data entries
   */
  all(): Array<DataWithId<T>> {
    return Object.entries(this.data).map(([id, entry]) => ({
      ...entry,
      id,
      exists: true,
    }));
  }
}
