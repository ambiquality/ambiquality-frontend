import { describe, expect, it } from 'vitest';
import { convert, displayUnitOptions, isConvertible } from './conversions';

describe('unit conversions (display-only)', () => {
  describe('convert', () => {
    it('temperature °C → °F is affine and exact', () => {
      expect(convert(0, '°C', '°F')).toBe(32);
      expect(convert(20, '°C', '°F')).toBe(68);
      expect(convert(100, '°C', '°F')).toBe(212);
      expect(convert(-40, '°C', '°F')).toBe(-40);
    });

    it('pressure Pa → hPa / kPa are decimal SI scales', () => {
      expect(convert(101325, 'Pa', 'hPa')).toBeCloseTo(1013.25, 5);
      expect(convert(101325, 'Pa', 'kPa')).toBeCloseTo(101.325, 5);
    });

    it('same unit returns the value unchanged (identity)', () => {
      expect(convert(21.5, '°C', '°C')).toBe(21.5);
      expect(convert(800, 'ppm', 'ppm')).toBe(800);
    });

    it('returns null for unknown / unsupported conversions (caller keeps canonical)', () => {
      // ppm ⇄ mg/m³ is deliberately not implemented (needs molar mass + reference conditions).
      expect(convert(800, 'ppm', 'mg/m³')).toBeNull();
      expect(convert(12, 'µg/m³', 'mg/m³')).toBeNull();
      expect(convert(500, 'lx', 'nonsense')).toBeNull();
    });
  });

  describe('displayUnitOptions', () => {
    it('lists the canonical unit first, then alternatives', () => {
      expect(displayUnitOptions('°C')).toEqual(['°C', '°F']);
      expect(displayUnitOptions('Pa')).toEqual(['Pa', 'hPa', 'kPa']);
    });

    it('returns just the canonical unit when there are no alternatives', () => {
      expect(displayUnitOptions('ppm')).toEqual(['ppm']);
      expect(displayUnitOptions('%')).toEqual(['%']);
    });
  });

  describe('isConvertible', () => {
    it('is true only for units with at least one alternative', () => {
      expect(isConvertible('°C')).toBe(true);
      expect(isConvertible('Pa')).toBe(true);
      expect(isConvertible('ppm')).toBe(false);
      expect(isConvertible('lx')).toBe(false);
    });
  });
});
