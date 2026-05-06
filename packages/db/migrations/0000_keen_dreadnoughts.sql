CREATE TYPE "public"."evaluation_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."grading_trigger" AS ENUM('system', 'admin');--> statement-breakpoint
CREATE TYPE "public"."prompt_level" AS ENUM('starter', 'builder', 'pro', 'super');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."unlock_method" AS ENUM('ad', 'subscription');--> statement-breakpoint
CREATE TABLE "evaluation_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criterion_name" text NOT NULL,
	"score" text NOT NULL,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_slug" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"overall_score" text,
	"overall_feedback" text,
	"rubric" text,
	"status" "evaluation_status" DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluations_prompt_slug_unique" UNIQUE("prompt_slug")
);
--> statement-breakpoint
CREATE TABLE "prompt_version_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_version_id" uuid NOT NULL,
	"level" "prompt_level" NOT NULL,
	"file_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_slug" text NOT NULL,
	"version_number" integer NOT NULL,
	"level" "prompt_level",
	"needs_grading" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"slug" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"category" text DEFAULT 'uncategorized' NOT NULL,
	"primary_tag" text,
	"secondary_tags" text,
	"is_viral" boolean DEFAULT false,
	"is_nano" boolean DEFAULT false,
	"status" "prompt_status" DEFAULT 'pending' NOT NULL,
	"base_path" text NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"preview" text,
	"search_vector" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_slug" text NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"criteria" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rubrics_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "subscription_status" NOT NULL,
	"stripe_subscription_id" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_slug" text NOT NULL,
	"unlocked_via" "unlock_method" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_version_files" ADD CONSTRAINT "prompt_version_files_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_slug_prompts_slug_fk" FOREIGN KEY ("prompt_slug") REFERENCES "public"."prompts"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_prompt_slug_prompts_slug_fk" FOREIGN KEY ("prompt_slug") REFERENCES "public"."prompts"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unlocks" ADD CONSTRAINT "unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unlocks" ADD CONSTRAINT "unlocks_prompt_slug_prompts_slug_fk" FOREIGN KEY ("prompt_slug") REFERENCES "public"."prompts"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_prompts_category" ON "prompts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_prompts_status" ON "prompts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prompts_user_id" ON "prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_primary_tag" ON "prompts" USING btree ("primary_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ratings_user_prompt" ON "ratings" USING btree ("user_id","prompt_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unlocks_user_prompt" ON "unlocks" USING btree ("user_id","prompt_slug");