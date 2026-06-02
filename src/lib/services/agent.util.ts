/**
 * Pure helpers for the Nexus agent. Kept import-free so they are trivially
 * unit-testable in isolation (no DB / Next runtime needed).
 */

/** Max rows any agent tool is allowed to return. */
export const MAX_ROWS = 20;

/**
 * Coerce an untrusted `limit` argument (supplied by the LLM) into a safe,
 * bounded row count. Non-numeric / non-positive values fall back to 10; the
 * result is always clamped to [1, MAX_ROWS].
 */
export function clampLimit(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10);
  if (!Number.isFinite(v) || v <= 0) return 10;
  return Math.min(Math.floor(v), MAX_ROWS);
}
