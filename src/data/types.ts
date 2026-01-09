/**
 * Types Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import typesData from './json/types.json';
import type { TypeData } from '../types';

export const TypesData: Record<string, TypeData> = typesData as Record<string, TypeData>;
