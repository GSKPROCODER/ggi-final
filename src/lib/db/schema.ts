import { pgTable, text, integer, boolean, timestamp, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Users Table ──────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  hashedPassword: text('hashed_password').notNull(),
  fullName: text('full_name').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Datasets Table ───────────────────────────────────────────────────────────
export const datasets = pgTable('datasets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
});

// ── Records Table ────────────────────────────────────────────────────────────
export const records = pgTable('records', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  datasetId: text('dataset_id').references(() => datasets.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  summary: text('summary'),
  sentiment: text('sentiment'), // 'Positive' | 'Neutral' | 'Negative'
  emotion: text('emotion'),
  riskLevel: text('risk_level'), // 'Low' | 'Medium' | 'High'
  confidenceScore: real('confidence_score'),
  keyIssuesJson: text('key_issues_json').notNull().default('[]'),
  recommendationsJson: text('recommendations_json').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Reports Table ────────────────────────────────────────────────────────────
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  overview: text('overview'),
  trendAnalysis: text('trend_analysis'),
  riskAssessment: text('risk_assessment'),
  keyFindingsJson: text('key_findings_json').notNull().default('[]'),
  recommendationsJson: text('recommendations_json').notNull().default('[]'),
  metricsJson: text('metrics_json').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Alerts Table ─────────────────────────────────────────────────────────────
export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull().default('low'), // 'low' | 'medium' | 'high'
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  datasets: many(datasets),
  records: many(records),
  reports: many(reports),
  alerts: many(alerts),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  user: one(users, { fields: [datasets.userId], references: [users.id] }),
  records: many(records),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  user: one(users, { fields: [records.userId], references: [users.id] }),
  dataset: one(datasets, { fields: [records.datasetId], references: [datasets.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
}));
