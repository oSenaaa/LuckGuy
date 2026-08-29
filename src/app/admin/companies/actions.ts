"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function createCompany(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;

  if (!name) throw new Error("Nome da empresa é obrigatório");

  await getDb().insert(companies).values({ name, cnpj, contactEmail, contactPhone });
  revalidatePath("/admin/companies");
}
