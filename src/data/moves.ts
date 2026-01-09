/**
 * Moves Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import movesData from './json/moves.json';
import type { MoveData } from '../types';

export const MovesData: Record<string, MoveData> = movesData as unknown as Record<string, MoveData>;
