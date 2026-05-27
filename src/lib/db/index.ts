import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzleNeon<typeof schema>> | ReturnType<typeof drizzlePg<typeof schema>>;

let _db: DbInstance | undefined;

function getDb(): DbInstance {
  if (_db) return _db;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');
  // Neon serverless requires the Neon HTTP endpoint; local Docker uses standard TCP.
  _db = url.includes('neon.tech')
    ? drizzleNeon(neon(url), { schema })
    : drizzlePg(new Pool({ connectionString: url }), { schema });
  return _db;
}

// Lazy proxy — defers connection until the first query, so the module can be
// imported at build time without DATABASE_URL being present.
export const db = new Proxy({} as DbInstance, {
  get(_target, prop: string | symbol) {
    return getDb()[prop as keyof DbInstance];
  },
});
