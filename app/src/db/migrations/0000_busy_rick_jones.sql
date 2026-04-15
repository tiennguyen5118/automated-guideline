CREATE TABLE "guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"source_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visualizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guideline_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"mermaid_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visualizations_kind_check" CHECK ("visualizations"."kind" IN ('flowchart','infographic'))
);
--> statement-breakpoint
CREATE TABLE "published_visualizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guideline_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"mermaid_source" text NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_visualizations_kind_check" CHECK ("published_visualizations"."kind" IN ('flowchart','infographic'))
);
--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guideline_id" uuid NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generation_jobs_status_check" CHECK ("generation_jobs"."status" IN ('succeeded','failed'))
);
--> statement-breakpoint
ALTER TABLE "visualizations" ADD CONSTRAINT "visualizations_guideline_id_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_visualizations" ADD CONSTRAINT "published_visualizations_guideline_id_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."guidelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_guideline_id_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "visualizations_guideline_id_unique" ON "visualizations" USING btree ("guideline_id");--> statement-breakpoint
CREATE UNIQUE INDEX "published_visualizations_slug_unique" ON "published_visualizations" USING btree ("slug");