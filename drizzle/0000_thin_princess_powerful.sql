CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'low' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"text_column" text,
	"columns_json" text DEFAULT '[]' NOT NULL,
	"sample_rows_json" text DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"insights_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"dataset_id" text,
	"text" text NOT NULL,
	"summary" text,
	"sentiment" text,
	"emotion" text,
	"risk_level" text,
	"confidence_score" real,
	"key_issues_json" text DEFAULT '[]' NOT NULL,
	"recommendations_json" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"overview" text,
	"trend_analysis" text,
	"risk_assessment" text,
	"key_findings_json" text DEFAULT '[]' NOT NULL,
	"recommendations_json" text DEFAULT '[]' NOT NULL,
	"metrics_json" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "alerts_user_id_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "datasets_user_id_idx" ON "datasets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "records_user_id_idx" ON "records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "records_dataset_id_idx" ON "records" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "records_user_dataset_idx" ON "records" USING btree ("user_id","dataset_id");--> statement-breakpoint
CREATE INDEX "reports_user_id_idx" ON "reports" USING btree ("user_id");