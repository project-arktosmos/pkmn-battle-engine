/**
 * TypesAPI - Extended DataAPI for Pokemon types
 *
 * Adds the isName() method on top of standard DataAPI functionality
 */

import { DataAPI } from './data-api';
import type { TypeData } from '../types';

/**
 * Types API with additional isName method for type validation
 */
export class TypesAPI extends DataAPI<TypeData> {
  /**
   * Check if a name is a valid type name
   */
  isName(name: string): boolean {
    return this.get(name).exists;
  }
}
