CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"size" bigint NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"thumbnail_url" text,
	"file_id_imagekit" text,
	"user_id" text NOT NULL,
	"parent_id" uuid,
	"is_folder" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_trash" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "files_user_parent_idx" ON "files" USING btree ("user_id","parent_id","created_at");--> statement-breakpoint
CREATE INDEX "files_user_trash_idx" ON "files" USING btree ("user_id") WHERE is_trash = true;