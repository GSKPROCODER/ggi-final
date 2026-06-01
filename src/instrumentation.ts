export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // DIRECT_URL (port 5432) required for DDL on Supabase — pooler (port 6543) blocks CREATE TABLE
    const url = process.env.DIRECT_URL
      ?? process.env.DATABASE_URL
      ?? process.env.POSTGRES_URL;
    if (url) {
      const { ensureSchema } = await import('./lib/db/setup');
      await ensureSchema(url);
    }
  }
}
