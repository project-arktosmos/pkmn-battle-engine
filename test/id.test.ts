import { describe, it, expect } from 'vitest';
import { toID } from '../src/utils/id';

describe('toID', () => {
  describe('string input', () => {
    it('should convert string to lowercase alphanumeric', () => {
      expect(toID('Pikachu')).toBe('pikachu');
      expect(toID('Thunder Wave')).toBe('thunderwave');
      expect(toID('Mr. Mime')).toBe('mrmime');
    });

    it('should remove special characters', () => {
      expect(toID('Farfetch\'d')).toBe('farfetchd');
      expect(toID('Nidoran♀')).toBe('nidoran');
      expect(toID('Porygon2')).toBe('porygon2');
      expect(toID('Porygon-Z')).toBe('porygonz');
    });

    it('should handle empty string', () => {
      expect(toID('')).toBe('');
    });
  });

  describe('null/undefined input', () => {
    it('should return empty string for null', () => {
      expect(toID(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(toID(undefined)).toBe('');
    });
  });

  describe('number input', () => {
    it('should convert number to string', () => {
      expect(toID(123)).toBe('123');
      expect(toID(0)).toBe('0');
      expect(toID(999)).toBe('999');
    });
  });

  describe('object input', () => {
    it('should use id property if present', () => {
      expect(toID({ id: 'testid', toString: () => 'wrongvalue' })).toBe('testid');
    });

    it('should use toString if no id property', () => {
      expect(toID({ toString: () => 'Test Value' })).toBe('testvalue');
    });

    it('should handle object with empty id', () => {
      expect(toID({ id: '', toString: () => 'fallback' })).toBe('fallback');
    });
  });
});
