import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://nexus_user:nexus_password@localhost:5432/nexus_ai';

// Determine if we are running locally to conditionally bypass SSL constraints
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

// Create high-performance standard PG connection pool
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
