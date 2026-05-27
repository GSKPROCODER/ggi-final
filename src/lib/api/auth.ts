import { auth } from '@clerk/nextjs/server';

/**
 * Returns the authenticated Clerk userId.
 * Throws 'Unauthorized.' so route catch-blocks can return a 401.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized.');
  return userId;
}
