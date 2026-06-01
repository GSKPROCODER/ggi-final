import { pgTable, text, integer, boolean, timestamp, real, index } from 'drizzle-orm/pg-core';

// userId is the Clerk user ID (e.g. "user_2abc...") — no local users table needed.

export const datasets = pgTable('datasets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  rowCount: integer('row_count').notNull().default(0),
  textColumn: text('text_column'),
  columnsJson: text('columns_json').notNull().default('[]'),
  sampleRowsJson: text('sample_rows_json').notNull().default('[]'),
  status: text('status').notNull().default('pending'),
  processedCount: integer('processed_count').notNull().default(0),
  errorMessage: text('error_message'),
  insightsJson: text('insights_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('datasets_user_id_idx').on(t.userId),
]);

export const records = pgTable('records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  datasetId: text('dataset_id'),
  text: text('text').notNull(),
  summary: text('summary'),
  sentiment: text('sentiment'),
  emotion: text('emotion'),
  riskLevel: text('risk_level'),
  confidenceScore: real('confidence_score'),
  keyIssuesJson: text('key_issues_json').notNull().default('[]'),
  recommendationsJson: text('recommendations_json').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('records_user_id_idx').on(t.userId),
  index('records_dataset_id_idx').on(t.datasetId),
  index('records_user_dataset_idx').on(t.userId, t.datasetId),
]);

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  overview: text('overview'),
  trendAnalysis: text('trend_analysis'),
  riskAssessment: text('risk_assessment'),
  keyFindingsJson: text('key_findings_json').notNull().default('[]'),
  recommendationsJson: text('recommendations_json').notNull().default('[]'),
  metricsJson: text('metrics_json').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('reports_user_id_idx').on(t.userId),
]);

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull().default('low'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('alerts_user_id_idx').on(t.userId),
]);
