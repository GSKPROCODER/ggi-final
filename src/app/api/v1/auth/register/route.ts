import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, generateTokens } from '@/lib/api/jwt';

/**
 * Handles POST requests to register a new user in the platform.
 */
export async function POST(req: Request) {
  try {
    const { full_name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });

    if (existing) {
      return NextResponse.json({ detail: 'Email is already registered.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user record
    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      hashedPassword,
      fullName: full_name || '',
    });

    const { accessToken, refreshToken } = generateTokens(userId);
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status: 500 });
  }
}
