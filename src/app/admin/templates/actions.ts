"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { uploadPublicFile } from "@/lib/blob";
import { requireAdmin } from "@/lib/require-admin";

export async function createTemplate(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";
  const file = formData.get("backgroundImage") as File | null;

  if (!name) throw new Error("Nome do modelo é obrigatório");
  if (!file || file.size === 0) throw new Error("Imagem de fundo é obrigatória");

  const url = await uploadPublicFile(`templates/${Date.now()}-${file.name}`, file);

  const db = getDb();
  if (isDefault) {
    await db.update(certificateTemplates).set({ isDefault: false }).where(eq(certificateTemplates.isDefault, true));
  }
  await db.insert(certificateTemplates).values({ name, backgroundImageBlobUrl: url, isDefault });
  revalidatePath("/admin/templates");
}

export async function setDefaultTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getDb();
  await db.update(certificateTemplates).set({ isDefault: false }).where(eq(certificateTemplates.isDefault, true));
  await db.update(certificateTemplates).set({ isDefault: true }).where(eq(certificateTemplates.id, id));
  revalidatePath("/admin/templates");
}
