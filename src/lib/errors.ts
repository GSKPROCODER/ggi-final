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

  // Preserve the legacy `requireAuth()` contract that throws plain Errors with
  // "Unauthorized" prefix — those should still map to 401.
  if (err instanceof Error) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    if (process.env.NODE_ENV !== 'production' && status === 500) {
      console.error('[api]', err);
    }
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }

  return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
}
