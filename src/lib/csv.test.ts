import { describe, it, expect } from 'vitest';
import { parseCsvLine } from './csv';

describe('parseCsvLine', () => {
  it('splits a simple comma-separated line', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('trims surrounding whitespace from each field', () => {
    expect(parseCsvLine('a ,  b , c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps commas that are inside a quoted field', () => {
    expect(parseCsvLine('"Smith, John",42,"Hello, world"')).toEqual([
      'Smith, John',
      '42',
      'Hello, world',
    ]);
  });

  it('strips the surrounding quotes from quoted fields', () => {
    expect(parseCsvLine('"quoted",plain')).toEqual(['quoted', 'plain']);
  });

  it('preserves empty fields', () => {
    expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('returns a single field when there are no commas', () => {
    expect(parseCsvLine('lonely')).toEqual(['lonely']);
  });
});
