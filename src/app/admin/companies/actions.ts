"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function createCompany(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").replace(/\D/g, "");
  const workplace = String(formData.get("workplace") ?? "").trim();

  if (!name) throw new Error("Nome da empresa é obrigatório");
  if (cnpj.length !== 14) throw new Error("CNPJ é obrigatório e deve conter exatamente 14 dígitos");
  if (contactPhone.length > 11) throw new Error("Telefone deve conter no máximo 11 dígitos");
  if (!workplace) throw new Error("Posto de trabalho é obrigatório");

  await getDb().insert(companies).values({
    name,
    cnpj,
    contactEmail,
    contactPhone: contactPhone || null,
    workplace,
  });
  revalidatePath("/admin/companies");
}

export async function updateCompany(id: string, formData: FormData) {
  await requireAdmin();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").replace(/\D/g, "");
  const workplace = String(formData.get("workplace") ?? "").trim();

  if (!name) return { ok: false as const, error: "Nome da empresa é obrigatório." };
  if (cnpj.length !== 14) {
    return { ok: false as const, error: "CNPJ é obrigatório e deve conter exatamente 14 dígitos." };
  }
  if (contactPhone.length > 11) {
    return { ok: false as const, error: "Telefone deve conter no máximo 11 dígitos." };
  }
  if (!workplace) {
    return { ok: false as const, error: "Posto de trabalho é obrigatório." };
  }

  await getDb()
    .update(companies)
    .set({
      name,
      cnpj,
      contactEmail,
      contactPhone: contactPhone || null,
      workplace,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, id));

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${id}`);
  return { ok: true as const };
}

export async function archiveCompany(id: string) {
  await requireAdmin();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  await getDb()
    .update(companies)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(companies.id, id));
  revalidatePath("/admin/companies");
  return { ok: true as const };
}

export async function unarchiveCompany(id: string) {
  await requireAdmin();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  await getDb()
    .update(companies)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(companies.id, id));
  revalidatePath("/admin/companies");
  return { ok: true as const };
}
