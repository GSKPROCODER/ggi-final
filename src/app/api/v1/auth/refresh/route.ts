import { NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/lib/api/jwt';

/**
 * Handles POST requests to issue new access & refresh tokens.
 */
export async function POST(req: Request) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) {
      return NextResponse.json({ detail: 'Refresh token is required.' }, { status: 400 });
    }

    const payload = verifyToken(refresh_token);
    if (!payload) {
      return NextResponse.json({ detail: 'Refresh token has expired or is invalid.' }, { status: 401 });
    }

    const { accessToken, refreshToken } = generateTokens(payload.userId);
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status: 500 });
  }
}
