import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) throw new Error('JWT_SECRET environment variable must be set.');
const JWT_SECRET: string = rawSecret;

const ACCESS_EXPIRY = '2h';
const REFRESH_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function authenticateRequest(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or malformed Authorization header');
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Unauthorized: Token has expired or is invalid');
  }

  return payload.userId;
}
