"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { uploadPublicFile } from "@/lib/blob";
import { requireAdmin } from "@/lib/require-admin";

export async function createSignature(formData: FormData) {
  await requireAdmin();
  const coordinatorName = String(formData.get("coordinatorName") ?? "").trim();
  const coordinatorRole = String(formData.get("coordinatorRole") ?? "").trim() || null;
  const isDefault = formData.get("isDefault") === "on";
  const file = formData.get("signatureImage") as File | null;

  if (!coordinatorName) throw new Error("Nome do coordenador é obrigatório");
  if (!file || file.size === 0) throw new Error("Imagem da assinatura é obrigatória");

  const url = await uploadPublicFile(`signatures/${Date.now()}-${file.name}`, file);

  const db = getDb();
  if (isDefault) {
    await db.update(certificateSignatures).set({ isDefault: false }).where(eq(certificateSignatures.isDefault, true));
  }
  await db.insert(certificateSignatures).values({
    coordinatorName,
    coordinatorRole,
    signatureImageBlobUrl: url,
    isDefault,
  });
  revalidatePath("/admin/signatures");
}

export async function setDefaultSignature(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getDb();
  await db.update(certificateSignatures).set({ isDefault: false }).where(eq(certificateSignatures.isDefault, true));
  await db.update(certificateSignatures).set({ isDefault: true }).where(eq(certificateSignatures.id, id));
  revalidatePath("/admin/signatures");
}
