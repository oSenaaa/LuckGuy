"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courses, courseSessions } from "@/lib/db/schema";
import { generateAccessSlug } from "@/lib/access-slug";
import { CertificateError, issueCertificate } from "@/lib/certificate/issue";
import { requireAdmin } from "@/lib/require-admin";

function parseBrasiliaDateTime(value: string) {
  return value ? new Date(`${value}-03:00`) : null;
}

function parseWorkloadHours(formData: FormData): number {
  const value = Number(formData.get("workloadValue") ?? 0);
  const unit = String(formData.get("workloadUnit") ?? "hours");

  if (!value || value <= 0) return 0;

  if (unit === "minutes") {
    if (value < 1 || value > 59) {
      throw new Error("Carga horária em minutos deve ser entre 1 e 59");
    }
    return value / 60;
  }

  return value;
}

export async function createSession(formData: FormData) {
  const userId = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const workloadHours = parseWorkloadHours(formData);
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");

  if (!courseId || !companyId || !name || !workloadHours) {
    throw new Error("Preencha treinamento, empresa, nome e carga horária");
  }

  const [session] = await getDb()
    .insert(courseSessions)
    .values({
      courseId,
      companyId,
      name,
      workloadHours: workloadHours.toFixed(2),
      accessSlug: generateAccessSlug(),
      startsAt: parseBrasiliaDateTime(startsAtRaw),
      endsAt: parseBrasiliaDateTime(endsAtRaw),
      createdByClerkUserId: userId,
    })
    .returning({ id: courseSessions.id });

  revalidatePath("/admin/sessions");
  redirect(`/admin/sessions/${session.id}`);
}

export async function publishSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  const [session] = await db
    .select({ course: courses })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.id, id))
    .limit(1);
  const course = session?.course;
  const hasVideo =
    (course?.videoProvider === "blob" && course.videoBlobUrl) ||
    (course?.videoProvider === "youtube" && course.videoYoutubeId);
  if (!hasVideo || !course?.videoDurationSeconds) {
    throw new Error("Envie o vídeo do treinamento antes de publicar a turma");
  }

  await db.update(courseSessions).set({ status: "published" }).where(eq(courseSessions.id, id));
  revalidatePath(`/admin/sessions/${id}`);
}

export async function archiveSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await getDb().update(courseSessions).set({ status: "archived" }).where(eq(courseSessions.id, id));
  revalidatePath(`/admin/sessions/${id}`);
}

export async function reissueCertificate(participantId: string, sessionId: string) {
  await requireAdmin();
  if (!participantId) return { ok: false as const, error: "Participante inválido." };

  try {
    await issueCertificate(participantId, { reissue: true });
  } catch (err) {
    if (!(err instanceof CertificateError)) throw err;
    console.error("Falha ao reemitir certificado", { participantId, sessionId, error: err });
    return { ok: false as const, error: err.message };
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { ok: true as const };
}
