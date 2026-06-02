import { describe, it, expect } from 'vitest';
import { parseJsonResponse } from './ai';

describe('parseJsonResponse', () => {
  it('parses plain JSON', () => {
    expect(parseJsonResponse('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('strips a ```json fenced code block', () => {
    const raw = '```json\n{"sentiment":"Positive"}\n```';
    expect(parseJsonResponse(raw)).toEqual({ sentiment: 'Positive' });
  });

  it('strips a bare ``` fenced code block', () => {
    const raw = '```\n[1, 2, 3]\n```';
    expect(parseJsonResponse(raw)).toEqual([1, 2, 3]);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseJsonResponse('   {"ok":true}   ')).toEqual({ ok: true });
  });

  it('throws a descriptive error on invalid JSON', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow(/invalid JSON/i);
  });
});
