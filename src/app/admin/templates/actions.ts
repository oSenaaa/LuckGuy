"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { UploadedImageError, verifyUploadedImage } from "@/lib/blob";
import {
  TEMPLATE_IMAGE_MAX_SIZE_BYTES,
  TEMPLATE_IMAGE_MAX_SIZE_LABEL,
  TEMPLATE_UPLOAD_PREFIX,
} from "@/lib/upload-rules";
import { requireAdmin } from "@/lib/require-admin";

export async function createTemplate(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";
  const backgroundImageBlobUrl = String(formData.get("backgroundImageBlobUrl") ?? "").trim();

  if (!name) return { ok: false as const, error: "Nome do modelo é obrigatório." };
  if (name.length > 120) return { ok: false as const, error: "O nome deve ter no máximo 120 caracteres." };
  if (!backgroundImageBlobUrl) {
    return { ok: false as const, error: "Imagem de fundo é obrigatória." };
  }

  let verifiedImageUrl: string;
  try {
    const image = await verifyUploadedImage(
      backgroundImageBlobUrl,
      TEMPLATE_UPLOAD_PREFIX,
      TEMPLATE_IMAGE_MAX_SIZE_BYTES,
      TEMPLATE_IMAGE_MAX_SIZE_LABEL,
    );
    verifiedImageUrl = image.url;
  } catch (error) {
    console.error("Falha ao validar a imagem do modelo", error);
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
    if (isDefault) {
      await db.batch([
        db.update(certificateTemplates).set({ isDefault: false }).where(eq(certificateTemplates.isDefault, true)),
        db.insert(certificateTemplates).values({
          name,
          backgroundImageBlobUrl: verifiedImageUrl,
          isDefault: true,
        }),
      ]);
    } else {
      await db.insert(certificateTemplates).values({
        name,
        backgroundImageBlobUrl: verifiedImageUrl,
        isDefault: false,
      });
    }
  } catch (error) {
    console.error("Falha ao salvar o modelo de certificado", error);
    return {
      ok: false as const,
      error: "A imagem foi enviada, mas não foi possível salvar o modelo. Tente novamente.",
    };
  }

  revalidatePath("/admin/templates");
  return { ok: true as const };
}

export async function setDefaultTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getDb();
  await db.batch([
    db.update(certificateTemplates).set({ isDefault: false }).where(eq(certificateTemplates.isDefault, true)),
    db.update(certificateTemplates).set({ isDefault: true }).where(eq(certificateTemplates.id, id)),
  ]);
  revalidatePath("/admin/templates");
}
