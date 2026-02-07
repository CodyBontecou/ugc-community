CREATE TABLE "job_hooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"hook_text" text NOT NULL,
	"screenshot_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_hooks" ADD CONSTRAINT "job_hooks_job_id_content_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."content_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_hooks_job_id_idx" ON "job_hooks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_hooks_sort_order_idx" ON "job_hooks" USING btree ("job_id","sort_order");