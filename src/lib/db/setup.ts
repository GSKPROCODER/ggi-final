export const SETUP_SQL = `
  CREATE TABLE IF NOT EXISTS "datasets" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "filename" text NOT NULL,
    "original_filename" text NOT NULL,
    "row_count" integer NOT NULL DEFAULT 0,
    "text_column" text,
    "columns_json" text NOT NULL DEFAULT '[]',
    "sample_rows_json" text NOT NULL DEFAULT '[]',
    "status" text NOT NULL DEFAULT 'pending',
    "processed_count" integer NOT NULL DEFAULT 0,
    "error_message" text,
    "insights_json" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "records" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "dataset_id" text,
    "text" text NOT NULL,
    "summary" text,
    "sentiment" text,
    "emotion" text,
    "risk_level" text,
    "confidence_score" real,
    "key_issues_json" text NOT NULL DEFAULT '[]',
    "recommendations_json" text NOT NULL DEFAULT '[]',
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "reports" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "title" text NOT NULL,
    "overview" text,
    "trend_analysis" text,
    "risk_assessment" text,
    "key_findings_json" text NOT NULL DEFAULT '[]',
    "recommendations_json" text NOT NULL DEFAULT '[]',
    "metrics_json" text NOT NULL DEFAULT '[]',
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS "alerts" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "severity" text NOT NULL DEFAULT 'low',
    "is_read" boolean NOT NULL DEFAULT false,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS "datasets_user_id_idx" ON "datasets" ("user_id");
  CREATE INDEX IF NOT EXISTS "records_user_id_idx" ON "records" ("user_id");
  CREATE INDEX IF NOT EXISTS "records_dataset_id_idx" ON "records" ("dataset_id");
  CREATE INDEX IF NOT EXISTS "records_user_dataset_idx" ON "records" ("user_id","dataset_id");
  CREATE INDEX IF NOT EXISTS "reports_user_id_idx" ON "reports" ("user_id");
  CREATE INDEX IF NOT EXISTS "alerts_user_id_idx" ON "alerts" ("user_id");
`;

export async function ensureSchema(url: string): Promise<void> {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await pool.query(SETUP_SQL);
    await pool.end();
    console.log('[db:setup] Schema ready.');
  } catch (err) {
    console.error('[db:setup] Setup warning (non-fatal):', err);
  }
}
