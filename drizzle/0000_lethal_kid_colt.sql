CREATE TYPE "public"."session_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('blob', 'youtube');--> statement-breakpoint
CREATE TABLE "certificate_signatures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"coordinator_name" text NOT NULL,
	"coordinator_role" text,
	"signature_image_blob_url" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"background_image_blob_url" text NOT NULL,
	"text_positions" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"course_session_id" uuid NOT NULL,
	"verification_code" text NOT NULL,
	"content_hmac" text,
	"pdf_blob_url" text NOT NULL,
	"participant_name_snapshot" text NOT NULL,
	"course_name_snapshot" text NOT NULL,
	"workload_hours_snapshot" numeric(5, 2) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"template_id_used" uuid,
	"signature_id_used" uuid,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"contact_email" text,
	"contact_phone" text,
	"workplace" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "course_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"workload_hours" numeric(5, 2) NOT NULL,
	"access_slug" text NOT NULL,
	"access_pin" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"min_watch_percent" integer DEFAULT 90 NOT NULL,
	"certificate_template_id" uuid,
	"status" "session_status" DEFAULT 'draft' NOT NULL,
	"created_by_clerk_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_sessions_access_slug_unique" UNIQUE("access_slug"),
	CONSTRAINT "course_sessions_min_watch_percent_range" CHECK ("course_sessions"."min_watch_percent" between 1 and 100),
	CONSTRAINT "course_sessions_workload_hours_positive" CHECK ("course_sessions"."workload_hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"nr_code" text,
	"description" text,
	"default_duration_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"video_provider" "video_provider" DEFAULT 'blob' NOT NULL,
	"video_blob_url" text,
	"video_youtube_id" text,
	"video_duration_seconds" integer,
	"coordinator_signature_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "courses_video_duration_positive" CHECK ("courses"."video_duration_seconds" is null or "courses"."video_duration_seconds" > 0)
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"course_session_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"cpf" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "viewing_progress" (
	"id" uuid PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"current_time_seconds" integer DEFAULT 0 NOT NULL,
	"max_time_reached_seconds" integer DEFAULT 0 NOT NULL,
	"watched_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"last_heartbeat_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "viewing_progress_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_session_id_course_sessions_id_fk" FOREIGN KEY ("course_session_id") REFERENCES "public"."course_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_used_certificate_templates_id_fk" FOREIGN KEY ("template_id_used") REFERENCES "public"."certificate_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_signature_id_used_certificate_signatures_id_fk" FOREIGN KEY ("signature_id_used") REFERENCES "public"."certificate_signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_certificate_template_id_certificate_templates_id_fk" FOREIGN KEY ("certificate_template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_coordinator_signature_id_certificate_signatures_id_fk" FOREIGN KEY ("coordinator_signature_id") REFERENCES "public"."certificate_signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_course_session_id_course_sessions_id_fk" FOREIGN KEY ("course_session_id") REFERENCES "public"."course_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_progress" ADD CONSTRAINT "viewing_progress_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "participants_session_phone_idx" ON "participants" USING btree ("course_session_id","phone");