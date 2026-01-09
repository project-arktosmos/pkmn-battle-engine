/**
 * Species Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import speciesData from './json/species.json';
import type { SpeciesData as SpeciesDataType } from '../types';

export const SpeciesData: Record<string, SpeciesDataType> = speciesData as Record<string, SpeciesDataType>;
