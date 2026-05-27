import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { requireAuth } from '@/lib/api/auth';

export async function GET() {
  try {
    await requireAuth();
    const user = await currentUser();
    if (!user) return NextResponse.json({ detail: 'User not found.' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      full_name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      created_at: new Date(user.createdAt).toISOString(),
    });
  } catch (err: any) {
    const status = err.message?.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
