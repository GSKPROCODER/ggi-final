import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? 'postgresql://nexus_user:nexus_password@localhost:5432/nexus_ai',
    ssl: { rejectUnauthorized: false },
  },
});

