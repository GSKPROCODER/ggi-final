import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-ai-super-secret-key-1092';
const ACCESS_EXPIRY = '2h';
const REFRESH_EXPIRY = '7d';

/**
 * Encrypts a plain-text password using bcrypt.
 * 
 * @param password The cleartext user password.
 * @returns Cryptographically hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies if a plain password matches its stored hash.
 * 
 * @param password The cleartext password to test.
 * @param hash The database bcrypt hash to match against.
 * @returns Boolean representing matching status.
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates an access token and a refresh token for the given user ID.
 * 
 * @param userId Unique user primary key.
 * @returns Tuple of access token and refresh token strings.
 */
export function generateTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

/**
 * Validates a JWT and extracts the embedded user payload.
 * 
 * @param token Raw base64 token string.
 * @returns Decoded payload containing the userId, or null if invalid/expired.
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

/**
 * Authenticates an incoming Next.js request via JWT Bearer Authorization.
 * Throws a 401 error response wrapper if validation fails.
 * 
 * @param req Incoming Next.js Request instance.
 * @returns The authenticated userId string.
 */
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
