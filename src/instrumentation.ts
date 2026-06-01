export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (url) {
      const { ensureSchema } = await import('./lib/db/setup');
      await ensureSchema(url);
    }
  }
}
