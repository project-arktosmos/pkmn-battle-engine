/**
 * Conditions Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import conditionsData from './json/conditions.json';
import type { ConditionData } from '../types';

export const ConditionsData: Record<string, ConditionData> = conditionsData as Record<string, ConditionData>;
