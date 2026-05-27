import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePasswords, generateTokens } from '@/lib/api/jwt';

/**
 * Handles POST requests to authenticate user credentials.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query database for user
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizedEmail),
    });

    if (!user) {
      return NextResponse.json({ detail: 'Incorrect email or password.' }, { status: 401 });
    }

    // Verify bcrypt hash match
    const isValid = await comparePasswords(password, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ detail: 'Incorrect email or password.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ detail: 'User account is deactivated.' }, { status: 403 });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status: 500 });
  }
}
