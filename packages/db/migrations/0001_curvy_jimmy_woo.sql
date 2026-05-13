CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "idx_prompts_category";--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "category_ids" uuid[];--> statement-breakpoint
CREATE INDEX "idx_prompts_category_ids" ON "prompts" USING btree ("category_ids");--> statement-breakpoint
ALTER TABLE "prompts" DROP COLUMN "category";