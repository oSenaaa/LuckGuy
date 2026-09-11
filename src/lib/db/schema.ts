import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

export const sessionStatusEnum = pgEnum("session_status", [
  "draft",
  "published",
  "archived",
]);

export const videoProviderEnum = pgEnum("video_provider", ["blob", "youtube"]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  cnpj: text("cnpj").unique(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  workplace: text("workplace"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  nrCode: text("nr_code"),
  description: text("description"),
  defaultDurationMinutes: integer("default_duration_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  videoProvider: videoProviderEnum("video_provider").notNull().default("blob"),
  videoBlobUrl: text("video_blob_url"),
  videoYoutubeId: text("video_youtube_id"),
  videoDurationSeconds: integer("video_duration_seconds"),
  coordinatorSignatureId: uuid("coordinator_signature_id").references(() => certificateSignatures.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check(
    "courses_video_duration_positive",
    sql`${table.videoDurationSeconds} is null or ${table.videoDurationSeconds} > 0`,
  ),
]);

export const certificateTemplates = pgTable("certificate_templates", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  backgroundImageBlobUrl: text("background_image_blob_url").notNull(),
  textPositions: jsonb("text_positions"),
  isDefault: boolean("is_default").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certificateSignatures = pgTable("certificate_signatures", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  coordinatorName: text("coordinator_name").notNull(),
  coordinatorRole: text("coordinator_role"),
  signatureImageBlobUrl: text("signature_image_blob_url").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courseSessions = pgTable("course_sessions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: uuid("course_id").notNull().references(() => courses.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  workloadHours: numeric("workload_hours", { precision: 5, scale: 2 }).notNull(),
  accessSlug: text("access_slug").notNull().unique(),
  // Segredo compartilhado exibido ao admin junto do link; exigido no formulário
  // de identificação. Nullable por compatibilidade com turmas criadas antes da
  // migração — nessas, o formulário não pede o PIN.
  accessPin: text("access_pin"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  minWatchPercent: integer("min_watch_percent").notNull().default(90),
  certificateTemplateId: uuid("certificate_template_id").references(() => certificateTemplates.id),
  status: sessionStatusEnum("status").notNull().default("draft"),
  createdByClerkUserId: text("created_by_clerk_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check(
    "course_sessions_min_watch_percent_range",
    sql`${table.minWatchPercent} between 1 and 100`,
  ),
  // > 0 impede o caso de gravar 0,00 (ex. entrada 0,001). O teto real (999,99)
  // já é imposto pelo tipo numeric(5,2).
  check("course_sessions_workload_hours_positive", sql`${table.workloadHours} > 0`),
]);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseSessionId: uuid("course_session_id").notNull().references(() => courseSessions.id),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    cpf: text("cpf"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("participants_session_phone_idx").on(table.courseSessionId, table.phone),
  ],
);

export const viewingProgress = pgTable("viewing_progress", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  participantId: uuid("participant_id").notNull().unique().references(() => participants.id),
  currentTimeSeconds: integer("current_time_seconds").notNull().default(0),
  maxTimeReachedSeconds: integer("max_time_reached_seconds").notNull().default(0),
  watchedPercent: numeric("watched_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  participantId: uuid("participant_id").notNull().references(() => participants.id),
  courseSessionId: uuid("course_session_id").notNull().references(() => courseSessions.id),
  verificationCode: text("verification_code").notNull().unique(),
  // HMAC-SHA256 sobre os campos-snapshot; permite detectar adulteração no banco.
  // Nullable: certificados emitidos antes da migração não têm.
  contentHmac: text("content_hmac"),
  pdfBlobUrl: text("pdf_blob_url").notNull(),
  participantNameSnapshot: text("participant_name_snapshot").notNull(),
  courseNameSnapshot: text("course_name_snapshot").notNull(),
  workloadHoursSnapshot: numeric("workload_hours_snapshot", { precision: 5, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  templateIdUsed: uuid("template_id_used").references(() => certificateTemplates.id),
  signatureIdUsed: uuid("signature_id_used").references(() => certificateSignatures.id),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedReason: text("revoked_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
