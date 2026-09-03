"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courses, courseSessions } from "@/lib/db/schema";
import { UploadedVideoError, verifyUploadedVideo } from "@/lib/blob";
import { VIDEO_MAX_DURATION_SECONDS } from "@/lib/upload-rules";
import { requireAdmin } from "@/lib/require-admin";

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const nrCode = String(formData.get("nrCode") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const defaultDurationMinutes = Number(formData.get("defaultDurationMinutes") ?? 0) || null;

  if (!name) throw new Error("Nome do treinamento é obrigatório");

  const [course] = await getDb()
    .insert(courses)
    .values({
      name,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      nrCode,
      description,
      defaultDurationMinutes,
    })
    .returning({ id: courses.id });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const nrCode = String(formData.get("nrCode") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const defaultDurationMinutes = Number(formData.get("defaultDurationMinutes") ?? 0) || null;
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Nome do treinamento é obrigatório");

  await getDb()
    .update(courses)
    .set({ name, nrCode, description, defaultDurationMinutes, isActive, updatedAt: new Date() })
    .where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const [linkedSession] = await getDb()
    .select({ id: courseSessions.id })
    .from(courseSessions)
    .where(eq(courseSessions.courseId, id))
    .limit(1);
  if (linkedSession) {
    throw new Error("Não é possível excluir: existem turmas vinculadas a este treinamento.");
  }

  await getDb().delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function setCourseVideo(courseId: string, videoBlobUrl: string, videoDurationSeconds: number) {
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
    const video = await verifyUploadedVideo(videoBlobUrl, courseId);
    verifiedVideoUrl = video.url;
  } catch (error) {
    console.error("Falha ao validar o vídeo do treinamento", error);
    return {
      ok: false as const,
      error:
        error instanceof UploadedVideoError
          ? error.message
          : "Não foi possível confirmar o vídeo enviado.",
    };
  }

  const updatedCourses = await getDb()
    .update(courses)
    .set({
      videoProvider: "blob",
      videoBlobUrl: verifiedVideoUrl,
      videoYoutubeId: null,
      videoDurationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId))
    .returning({ id: courses.id });
  if (updatedCourses.length === 0) {
    return { ok: false as const, error: "Treinamento não encontrado." };
  }

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true as const };
}

export async function setCourseVideoYoutube(courseId: string, videoYoutubeId: string, videoDurationSeconds: number) {
  await requireAdmin();
  await getDb()
    .update(courses)
    .set({
      videoProvider: "youtube",
      videoYoutubeId,
      videoBlobUrl: null,
      videoDurationSeconds,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));
  revalidatePath(`/admin/courses/${courseId}`);
}
