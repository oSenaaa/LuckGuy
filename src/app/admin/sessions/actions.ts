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
import { parseBrasiliaDateTime } from "@/lib/datetime";
import { requireEditor } from "@/lib/permissions";

export async function createSession(formData: FormData) {
  const { userId } = await requireEditor();
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

export async function publishSession(id: string) {
  await requireEditor();
  const db = getDb();
  const [session] = await db
    .select({ course: courses, endsAt: courseSessions.endsAt })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.id, id))
    .limit(1);
  const course = session?.course;
  const hasVideo =
    (course?.videoProvider === "blob" && course.videoBlobUrl) ||
    (course?.videoProvider === "youtube" && course.videoYoutubeId);
  if (!hasVideo || !course?.videoDurationSeconds) {
    return { ok: false as const, error: "Envie o vídeo do treinamento antes de publicar a turma" };
  }

  // A varredura de expiração (archiveExpiredSessions) arquiva de novo, na
  // próxima carga de página, qualquer turma publicada cujo fim já passou —
  // publicar sem corrigir o período antes teria efeito nenhum na prática.
  if (session?.endsAt && session.endsAt <= new Date()) {
    const endsAtLabel = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(session.endsAt);
    return {
      ok: false as const,
      error: `Esta turma já passou da data de fim (${endsAtLabel}). Edite o período antes de publicar.`,
    };
  }

  await db.update(courseSessions).set({ status: "published" }).where(eq(courseSessions.id, id));
  revalidatePath(`/admin/sessions/${id}`);
  return { ok: true as const };
}

export async function archiveSession(formData: FormData) {
  await requireEditor();
  const id = String(formData.get("id") ?? "");
  await getDb().update(courseSessions).set({ status: "archived" }).where(eq(courseSessions.id, id));
  revalidatePath(`/admin/sessions/${id}`);
}

export async function updateSessionPeriod(id: string, formData: FormData) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Turma inválida." };

  const startsAt = parseBrasiliaDateTime(String(formData.get("startsAt") ?? ""));
  const endsAt = parseBrasiliaDateTime(String(formData.get("endsAt") ?? ""));

  if (startsAt && endsAt && endsAt <= startsAt) {
    return { ok: false as const, error: "A data de fim deve ser depois da data de início." };
  }

  await getDb()
    .update(courseSessions)
    .set({ startsAt, endsAt, updatedAt: new Date() })
    .where(eq(courseSessions.id, id));

  revalidatePath(`/admin/sessions/${id}`);
  return { ok: true as const };
}

export async function reissueCertificate(participantId: string, sessionId: string) {
  try {
    await requireEditor();
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
