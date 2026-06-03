import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzleNeon<typeof schema>> | ReturnType<typeof drizzlePg<typeof schema>>;

let _db: DbInstance | undefined;

/**
 * TLS config for the node-postgres Pool (non-Neon path).
 * - Local databases (Docker/localhost) typically have TLS disabled.
 * - Managed providers are reached over TLS but with verification disabled,
 *   because several (incl. the one used in production) present a chain that
 *   doesn't validate against Node's default CA bundle. Enabling verification
 *   broke production, so we keep it off here. (Proper CA pinning is tracked
 *   as deferred "real production" work.)
 */
export function pgSslConfig(url: string): false | { rejectUnauthorized: boolean } {
  if (/(?:localhost|127\.0\.0\.1)/.test(url)) return false;
  return { rejectUnauthorized: false };
}

function getDb(): DbInstance {
  if (_db) return _db;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');
  // Neon serverless requires the Neon HTTP endpoint; local Docker uses standard TCP.
  _db = url.includes('neon.tech')
    ? drizzleNeon(neon(url), { schema })
    : drizzlePg(new Pool({ connectionString: url, ssl: pgSslConfig(url) }), { schema });
  return _db;
}

// Lazy proxy — defers connection until the first query, so the module can be
// imported at build time without DATABASE_URL being present.
export const db = new Proxy({} as DbInstance, {
  get(_target, prop: string | symbol) {
    return getDb()[prop as keyof DbInstance];
  },
});
