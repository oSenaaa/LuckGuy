"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions } from "@/lib/db/schema";
import { generateAccessSlug } from "@/lib/access-slug";
import { UploadedVideoError, verifyUploadedVideo } from "@/lib/blob";
import { CertificateError, issueCertificate } from "@/lib/certificate/issue";
import { VIDEO_MAX_DURATION_SECONDS } from "@/lib/upload-rules";
import { requireAdmin } from "@/lib/require-admin";

function parseBrasiliaDateTime(value: string) {
  return value ? new Date(`${value}-03:00`) : null;
}

export async function createSession(formData: FormData) {
  const userId = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const workloadHours = Number(formData.get("workloadHours") ?? 0);
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

export async function setSessionVideo(sessionId: string, videoBlobUrl: string, videoDurationSeconds: number) {
  await requireAdmin();
  if (
    !Number.isInteger(videoDurationSeconds) ||
    videoDurationSeconds <= 0 ||
    videoDurationSeconds > VIDEO_MAX_DURATION_SECONDS
  ) {
    return { ok: false as const, error: "A duração do vídeo é inválida." };
  }

  let verifiedVideoUrl: string;
  try {
    const video = await verifyUploadedVideo(videoBlobUrl, sessionId);
    verifiedVideoUrl = video.url;
  } catch (error) {
    console.error("Falha ao validar o vídeo da turma", error);
    return {
      ok: false as const,
      error:
        error instanceof UploadedVideoError
          ? error.message
          : "Não foi possível confirmar o vídeo enviado.",
    };
  }

  const updatedSessions = await getDb()
    .update(courseSessions)
    .set({
      videoProvider: "blob",
      videoBlobUrl: verifiedVideoUrl,
      videoYoutubeId: null,
      videoDurationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(courseSessions.id, sessionId))
    .returning({ id: courseSessions.id });
  if (updatedSessions.length === 0) {
    return { ok: false as const, error: "Turma não encontrada." };
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { ok: true as const };
}

export async function setSessionVideoYoutube(sessionId: string, videoYoutubeId: string, videoDurationSeconds: number) {
  await requireAdmin();
  await getDb()
    .update(courseSessions)
    .set({
      videoProvider: "youtube",
      videoYoutubeId,
      videoBlobUrl: null,
      videoDurationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(courseSessions.id, sessionId));
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function publishSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = getDb();
  const [session] = await db.select().from(courseSessions).where(eq(courseSessions.id, id)).limit(1);
  const hasVideo =
    (session?.videoProvider === "blob" && session.videoBlobUrl) ||
    (session?.videoProvider === "youtube" && session.videoYoutubeId);
  if (!hasVideo || !session?.videoDurationSeconds) {
    throw new Error("Envie o vídeo antes de publicar a turma");
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

export async function reissueCertificate(formData: FormData) {
  await requireAdmin();
  const participantId = String(formData.get("participantId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  try {
    await issueCertificate(participantId, { reissue: true });
  } catch (err) {
    if (!(err instanceof CertificateError)) throw err;
  }
  revalidatePath(`/admin/sessions/${sessionId}`);
}
