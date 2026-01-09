/**
 * Abilities Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import abilitiesData from './json/abilities.json';
import type { AbilityData } from '../types';

export const AbilitiesData: Record<string, AbilityData> = abilitiesData as Record<string, AbilityData>;
