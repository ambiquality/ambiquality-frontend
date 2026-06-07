import { describe, expect, it } from 'vitest';
import { classify, hasBands } from './color-bands';

describe('color-bands', () => {
  describe('hasBands', () => {
    it('is true for quantities with public thresholds', () => {
      expect(hasBands('co2')).toBe(true);
      expect(hasBands('temperature')).toBe(true);
      expect(hasBands('pm2_5')).toBe(true);
    });

    it('is false for quantities without defined bands', () => {
      expect(hasBands('pressure')).toBe(false);
      expect(hasBands('illuminance')).toBe(false);
      expect(hasBands('nonsense')).toBe(false);
    });
  });

  describe('classify (one-sided pollutant: CO₂)', () => {
    it('classifies below the first threshold as good', () => {
      expect(classify('co2', 600)).toBe('good');
      expect(classify('co2', 799)).toBe('good');
    });

    it('classifies the moderate band', () => {
      expect(classify('co2', 800)).toBe('moderate');
      expect(classify('co2', 1399)).toBe('moderate');
    });

    it('classifies above the upper threshold as poor', () => {
      expect(classify('co2', 1400)).toBe('poor');
      expect(classify('co2', 5000)).toBe('poor');
    });
  });

  describe('classify (two-sided comfort: temperature)', () => {
    it('penalises both extremes as poor', () => {
      expect(classify('temperature', 10)).toBe('poor');
      expect(classify('temperature', 30)).toBe('poor');
    });

    it('treats the comfortable middle as good', () => {
      expect(classify('temperature', 22)).toBe('good');
    });

    it('treats the shoulders as moderate', () => {
      expect(classify('temperature', 19)).toBe('moderate');
      expect(classify('temperature', 25)).toBe('moderate');
    });
  });

  describe('classify (unknown / missing)', () => {
    it('returns unknown for null, undefined, or non-finite values', () => {
      expect(classify('co2', null)).toBe('unknown');
      expect(classify('co2', undefined)).toBe('unknown');
      expect(classify('co2', Number.NaN)).toBe('unknown');
    });

    it('returns unknown for quantities without bands', () => {
      expect(classify('pressure', 101_000)).toBe('unknown');
    });
  });
});
