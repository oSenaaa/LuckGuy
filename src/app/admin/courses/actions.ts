"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { courses } from "@/lib/db/schema";
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

  await getDb().insert(courses).values({
    name,
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    nrCode,
    description,
    defaultDurationMinutes,
  });
  revalidatePath("/admin/courses");
}
