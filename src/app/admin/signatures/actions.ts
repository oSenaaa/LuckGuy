"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { UploadedImageError, verifyUploadedImage } from "@/lib/blob";
import {
  SIGNATURE_IMAGE_MAX_SIZE_BYTES,
  SIGNATURE_IMAGE_MAX_SIZE_LABEL,
  SIGNATURE_UPLOAD_PREFIX,
} from "@/lib/upload-rules";
import { requireAdmin } from "@/lib/require-admin";

export async function createSignature(formData: FormData) {
  await requireAdmin();
  const coordinatorName = String(formData.get("coordinatorName") ?? "").trim();
  const coordinatorRole = String(formData.get("coordinatorRole") ?? "").trim() || null;
  const isDefault = formData.get("isDefault") === "on";
  const signatureImageBlobUrl = String(formData.get("signatureImageBlobUrl") ?? "").trim();

  if (!coordinatorName) {
    return { ok: false as const, error: "Nome do coordenador é obrigatório." };
  }
  if (coordinatorName.length > 120 || (coordinatorRole?.length ?? 0) > 120) {
    return { ok: false as const, error: "Nome e cargo devem ter no máximo 120 caracteres." };
  }
  if (!signatureImageBlobUrl) {
    return { ok: false as const, error: "Imagem da assinatura é obrigatória." };
  }

  let verifiedImageUrl: string;
  try {
    const image = await verifyUploadedImage(
      signatureImageBlobUrl,
      SIGNATURE_UPLOAD_PREFIX,
      SIGNATURE_IMAGE_MAX_SIZE_BYTES,
      SIGNATURE_IMAGE_MAX_SIZE_LABEL,
    );
    verifiedImageUrl = image.url;
  } catch (error) {
    console.error("Falha ao validar a imagem da assinatura", error);
    return {
      ok: false as const,
      error:
        error instanceof UploadedImageError
          ? error.message
          : "Não foi possível confirmar a imagem enviada.",
    };
  }

  const db = getDb();
  try {
    const insert = db.insert(certificateSignatures).values({
      coordinatorName,
      coordinatorRole,
      signatureImageBlobUrl: verifiedImageUrl,
      isDefault,
    });

    if (isDefault) {
      await db.batch([
        db.update(certificateSignatures).set({ isDefault: false }).where(eq(certificateSignatures.isDefault, true)),
        insert,
      ]);
    } else {
      await insert;
    }
  } catch (error) {
    console.error("Falha ao salvar a assinatura", error);
    return {
      ok: false as const,
      error: "A imagem foi enviada, mas não foi possível salvar a assinatura. Tente novamente.",
    };
  }

  revalidatePath("/admin/signatures");
  return { ok: true as const };
}

export async function setDefaultSignature(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getDb();
  await db.batch([
    db.update(certificateSignatures).set({ isDefault: false }).where(eq(certificateSignatures.isDefault, true)),
    db.update(certificateSignatures).set({ isDefault: true }).where(eq(certificateSignatures.id, id)),
  ]);
  revalidatePath("/admin/signatures");
}
