"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "@/lib/db";
import {
  companyWorkplaces,
  courses,
  courseSessionCompanies,
  courseSessions,
  courseSessionWorkplaces,
} from "@/lib/db/schema";
import { generateAccessSlug, generateAccessPin } from "@/lib/access-slug";
import { CertificateError, issueCertificate } from "@/lib/certificate/issue";
import { requireAdmin } from "@/lib/require-admin";

function parseBrasiliaDateTime(value: string) {
  return value ? new Date(`${value}-03:00`) : null;
}

export async function createSession(formData: FormData) {
  const { userId } = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const companyIds = [...new Set(formData.getAll("companyIds").map(String).filter(Boolean))];
  const existingWorkplaceIds = [
    ...new Set(formData.getAll("workplaceIds").map(String).filter(Boolean)),
  ];
  const newWorkplaceCompanyIds = formData.getAll("newWorkplaceCompanyId").map(String);
  const newWorkplaceNames = formData.getAll("newWorkplaceName").map(String);
  const name = String(formData.get("name") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");

  if (!courseId || companyIds.length === 0 || !name) {
    throw new Error("Preencha treinamento, ao menos uma empresa e nome da turma");
  }

  const db = getDb();
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) throw new Error("Treinamento não encontrado");
  if (!course.defaultDurationMinutes) {
    throw new Error(
      "Este treinamento não tem duração padrão cadastrada. Configure em Treinamentos antes de criar a turma.",
    );
  }
  const workloadHours = course.defaultDurationMinutes / 60;

  const sessionId = crypto.randomUUID();
  const newWorkplaces = newWorkplaceCompanyIds
    .map((companyId, index) => ({
      id: crypto.randomUUID(),
      companyId,
      name: (newWorkplaceNames[index] ?? "").trim(),
    }))
    .filter((workplace) => workplace.companyId && companyIds.includes(workplace.companyId) && workplace.name);

  const workplaceIds = [...new Set([...existingWorkplaceIds, ...newWorkplaces.map((w) => w.id)])];

  const batch: BatchItem<"pg">[] = [
    db.insert(courseSessions).values({
      id: sessionId,
      courseId,
      name,
      workloadHours: workloadHours.toFixed(2),
      accessSlug: generateAccessSlug(),
      accessPin: generateAccessPin(),
      startsAt: parseBrasiliaDateTime(startsAtRaw),
      endsAt: parseBrasiliaDateTime(endsAtRaw),
      createdByClerkUserId: userId,
    }),
  ];
  for (const workplace of newWorkplaces) {
    batch.push(
      db.insert(companyWorkplaces).values({
        id: workplace.id,
        companyId: workplace.companyId,
        name: workplace.name,
      }),
    );
  }
  for (const companyId of companyIds) {
    batch.push(
      db.insert(courseSessionCompanies).values({ courseSessionId: sessionId, companyId }),
    );
  }
  for (const workplaceId of workplaceIds) {
    batch.push(
      db.insert(courseSessionWorkplaces).values({ courseSessionId: sessionId, workplaceId }),
    );
  }

  await db.batch(batch as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  revalidatePath("/admin/sessions");
  redirect(`/admin/sessions/${sessionId}`);
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
  try {
    await requireAdmin();
  } catch (err) {
    console.error("Falha ao confirmar sessão de admin ao reemitir certificado", { participantId, sessionId, error: err });
    return {
      ok: false as const,
      error: "Não foi possível confirmar sua sessão. Atualize a página e tente novamente.",
    };
  }

  if (!participantId) return { ok: false as const, error: "Participante inválido." };

  try {
    await issueCertificate(participantId, { reissue: true });
  } catch (err) {
    if (!(err instanceof CertificateError)) {
      console.error("Falha inesperada ao reemitir certificado", { participantId, sessionId, error: err });
      return {
        ok: false as const,
        error: "Falha inesperada ao reemitir. Tente novamente em instantes.",
      };
    }
    console.error("Falha ao reemitir certificado", { participantId, sessionId, error: err });
    return { ok: false as const, error: err.message };
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { ok: true as const };
}
