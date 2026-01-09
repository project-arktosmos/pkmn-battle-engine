/**
 * Formats Data
 * Slim wrapper that imports from JSON
 * Regenerate JSON with: pnpm run build:data
 */

import formatsData from './json/formats.json';
import type { FormatData } from '../types';

export const FormatsData: Record<string, FormatData> = formatsData as Record<string, FormatData>;
