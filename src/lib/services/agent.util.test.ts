import { describe, it, expect } from 'vitest';
import { clampLimit, MAX_ROWS } from './agent.util';

describe('clampLimit (agent row-limit guard)', () => {
  it('passes through a valid in-range limit', () => {
    expect(clampLimit(5)).toBe(5);
  });

  it('caps anything above MAX_ROWS', () => {
    expect(clampLimit(9999)).toBe(MAX_ROWS);
    expect(clampLimit(MAX_ROWS + 1)).toBe(MAX_ROWS);
  });

  it('falls back to 10 for non-positive values', () => {
    expect(clampLimit(0)).toBe(10);
    expect(clampLimit(-5)).toBe(10);
  });

  it('falls back to 10 for missing / non-numeric input', () => {
    expect(clampLimit(undefined)).toBe(10);
    expect(clampLimit(null)).toBe(10);
    expect(clampLimit('abc')).toBe(10);
    expect(clampLimit(NaN)).toBe(10);
  });

  it('coerces numeric strings and floors them', () => {
    expect(clampLimit('7')).toBe(7);
    expect(clampLimit(7.9)).toBe(7);
  });
});
