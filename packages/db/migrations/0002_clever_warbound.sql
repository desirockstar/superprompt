ALTER TABLE "evaluation_scores" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "evaluations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompt_version_files" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prompt_versions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rubrics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "evaluation_scores" CASCADE;--> statement-breakpoint
DROP TABLE "evaluations" CASCADE;--> statement-breakpoint
DROP TABLE "prompt_version_files" CASCADE;--> statement-breakpoint
DROP TABLE "prompt_versions" CASCADE;--> statement-breakpoint
DROP TABLE "rubrics" CASCADE;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "complexity_score" text;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "complexity_tier" text;--> statement-breakpoint
CREATE INDEX "idx_prompts_complexity_tier" ON "prompts" USING btree ("complexity_tier");--> statement-breakpoint
DROP TYPE "public"."evaluation_status";--> statement-breakpoint
DROP TYPE "public"."grading_trigger";