/**
 * Shared error types and helpers used by both the API client (in lib/api.ts)
 * and server route handlers. Keeps error semantics consistent end-to-end.
 */

import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized.') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

/** Returns true when the error is a PostgreSQL "table does not exist" (code 42P01). */
export function isTableMissingError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('relation') ||
    err.message.includes('does not exist') ||
    err.message.includes('Failed query') ||
    err.message.includes('42P01')
  );
}

function sanitizeDbError(message: string): string {
  if (
    message.includes('Failed query') ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('syntax error') ||
    message.includes('column') ||
    message.includes('operator does not exist')
  ) {
    return 'Database temporarily unavailable. Please try again in a moment.';
  }
  return message;
}

/**
 * Server-side helper used in route handler catch blocks.
 * Maps any thrown value to a NextResponse with the correct status.
 *
 * Usage:
 *   try { ... } catch (err) { return handleApiError(err); }
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ detail: err.message }, { status: err.status });
  }

  if (err instanceof Error) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    if (status === 500) {
      console.error('[api]', err);
    }
    const safeMessage = status === 500 ? sanitizeDbError(err.message) : err.message;
    return NextResponse.json({ detail: safeMessage || 'Internal server error.' }, { status });
  }

  return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
}
