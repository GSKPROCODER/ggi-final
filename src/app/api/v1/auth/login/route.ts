import { NextResponse } from 'next/server';

// Login is now handled by Clerk. This route is kept for backwards
// compatibility but returns a clear message directing clients to use Clerk.
export async function POST() {
  return NextResponse.json(
    { detail: 'Login is handled by Clerk. Please use /sign-in.' },
    { status: 410 },
  );
}
