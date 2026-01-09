/**
 * Converts a string to an ID format used throughout the battle simulator.
 * IDs are lowercase alphanumeric strings with no spaces or special characters.
 *
 * @param text - The string to convert
 * @returns The ID-formatted string
 *
 * @example
 * toID('Pikachu') // 'pikachu'
 * toID('Thunder Wave') // 'thunderwave'
 * toID('Mr. Mime') // 'mrmime'
 */
export function toID(text: string | number | { id?: string; toString(): string } | null | undefined): string {
  if (text === null || text === undefined) return '';

  if (typeof text === 'number') {
    return String(text);
  }

  let str: string;
  if (typeof text === 'string') {
    str = text;
  } else if (text.id) {
    str = text.id;
  } else {
    str = text.toString();
  }

  return str.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
