import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // DIRECT_URL (port 5432) is required for migrations — Supabase's pooler (6543) blocks DDL.
    url: process.env.DIRECT_URL
      ?? process.env.DATABASE_URL
      ?? process.env.POSTGRES_URL
      ?? '',
    ssl: { rejectUnauthorized: false },
  },
});

