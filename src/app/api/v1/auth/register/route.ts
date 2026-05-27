import { NextResponse } from 'next/server';

// Registration is now handled by Clerk. This route is kept for backwards
// compatibility but returns a clear message directing clients to use Clerk.
export async function POST() {
  return NextResponse.json(
    { detail: 'Registration is handled by Clerk. Please use /sign-up.' },
    { status: 410 },
  );
}
