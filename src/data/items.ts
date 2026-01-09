/**
 * Items Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import itemsData from './json/items.json';
import type { ItemData } from '../types';

export const ItemsData: Record<string, ItemData> = itemsData as Record<string, ItemData>;
