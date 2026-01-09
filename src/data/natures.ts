/**
 * Natures Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import naturesData from './json/natures.json';
import type { NatureData } from '../types';

export const NaturesData: Record<string, NatureData> = naturesData as Record<string, NatureData>;
