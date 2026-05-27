import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve user profile details.
 */
export async function GET(req: Request) {
  try {
    const userId = authenticateRequest(req);

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!user) {
      return NextResponse.json({ detail: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      created_at: user.createdAt.toISOString(),
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}

/**
 * Handles PATCH requests to update user profile parameters (e.g. name or email).
 */
export async function PATCH(req: Request) {
  try {
    const userId = authenticateRequest(req);
    const { full_name, email } = await req.json();

    const updateValues: Record<string, any> = {};
    if (full_name !== undefined) updateValues.fullName = full_name;
    if (email !== undefined) updateValues.email = email.toLowerCase().trim();

    if (Object.keys(updateValues).length === 0) {
      return NextResponse.json({ detail: 'No update values provided.' }, { status: 400 });
    }

    await db.update(users).set(updateValues).where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!updatedUser) {
      return NextResponse.json({ detail: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.fullName,
      created_at: updatedUser.createdAt.toISOString(),
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
