"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, companyWorkplaces } from "@/lib/db/schema";
import { requireEditor } from "@/lib/permissions";
import { isValidCpfCnpj, onlyDigits } from "@/lib/document";
import { DEFAULT_PHONE_COUNTRY, buildPhoneValue } from "@/lib/phone";

function readDocument(formData: FormData) {
  return onlyDigits(String(formData.get("cnpj") ?? ""));
}

function validateDocument(document: string) {
  if (document.length !== 11 && document.length !== 14) {
    return "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos";
  }
  if (!isValidCpfCnpj(document)) {
    return document.length === 11 ? "CPF inválido" : "CNPJ inválido";
  }
  return null;
}

function readPhone(formData: FormData) {
  const country = String(formData.get("contactPhoneCountry") ?? DEFAULT_PHONE_COUNTRY.dial);
  const national = onlyDigits(String(formData.get("contactPhoneNumber") ?? ""));
  return { country, national };
}

function validatePhone(country: string, national: string) {
  const maxDigits = country === DEFAULT_PHONE_COUNTRY.dial ? 11 : 15;
  if (national.length > maxDigits) {
    return `Telefone deve conter no máximo ${maxDigits} dígitos`;
  }
  return null;
}

export async function createCompany(formData: FormData) {
  await requireEditor();
  const name = String(formData.get("name") ?? "").trim();
  const document = readDocument(formData);
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const { country: phoneCountry, national: phoneNational } = readPhone(formData);

  if (!name) return { ok: false as const, error: "Nome da empresa é obrigatório." };
  const documentError = validateDocument(document);
  if (documentError) return { ok: false as const, error: documentError };
  const phoneError = validatePhone(phoneCountry, phoneNational);
  if (phoneError) return { ok: false as const, error: phoneError };

  const [existing] = await getDb()
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.cnpj, document))
    .limit(1);
  if (existing) {
    return { ok: false as const, error: "Já existe uma empresa cadastrada com esse CNPJ/CPF." };
  }

  await getDb().insert(companies).values({
    name,
    cnpj: document,
    contactEmail,
    contactPhone: buildPhoneValue(phoneCountry, phoneNational) || null,
  });
  revalidatePath("/admin/companies");
  return { ok: true as const };
}

export async function updateCompany(id: string, formData: FormData) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  const name = String(formData.get("name") ?? "").trim();
  const document = readDocument(formData);
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const { country: phoneCountry, national: phoneNational } = readPhone(formData);

  if (!name) return { ok: false as const, error: "Nome da empresa é obrigatório." };
  const documentError = validateDocument(document);
  if (documentError) return { ok: false as const, error: documentError };
  const phoneError = validatePhone(phoneCountry, phoneNational);
  if (phoneError) return { ok: false as const, error: phoneError };

  const [existing] = await getDb()
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.cnpj, document), ne(companies.id, id)))
    .limit(1);
  if (existing) {
    return { ok: false as const, error: "Já existe uma empresa cadastrada com esse CNPJ/CPF." };
  }

  await getDb()
    .update(companies)
    .set({
      name,
      cnpj: document,
      contactEmail,
      contactPhone: buildPhoneValue(phoneCountry, phoneNational) || null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, id));

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${id}`);
  return { ok: true as const };
}

export async function archiveCompany(id: string) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  await getDb()
    .update(companies)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(companies.id, id));
  revalidatePath("/admin/companies");
  return { ok: true as const };
}

export async function unarchiveCompany(id: string) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  await getDb()
    .update(companies)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(companies.id, id));
  revalidatePath("/admin/companies");
  return { ok: true as const };
}

export async function addWorkplace(companyId: string, formData: FormData) {
  await requireEditor();
  if (!companyId) return { ok: false as const, error: "Empresa inválida." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, error: "Nome do posto é obrigatório." };

  await getDb().insert(companyWorkplaces).values({ companyId, name });
  revalidatePath(`/admin/companies/${companyId}`);
  return { ok: true as const };
}

export async function updateWorkplace(id: string, formData: FormData) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Posto inválido." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, error: "Nome do posto é obrigatório." };

  const [workplace] = await getDb()
    .update(companyWorkplaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(companyWorkplaces.id, id))
    .returning({ companyId: companyWorkplaces.companyId });

  if (workplace) revalidatePath(`/admin/companies/${workplace.companyId}`);
  return { ok: true as const };
}

export async function archiveWorkplace(id: string) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Posto inválido." };

  const [workplace] = await getDb()
    .update(companyWorkplaces)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(companyWorkplaces.id, id))
    .returning({ companyId: companyWorkplaces.companyId });

  if (workplace) revalidatePath(`/admin/companies/${workplace.companyId}`);
  return { ok: true as const };
}

export async function unarchiveWorkplace(id: string) {
  await requireEditor();
  if (!id) return { ok: false as const, error: "Posto inválido." };

  const [workplace] = await getDb()
    .update(companyWorkplaces)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(companyWorkplaces.id, id))
    .returning({ companyId: companyWorkplaces.companyId });

  if (workplace) revalidatePath(`/admin/companies/${workplace.companyId}`);
  return { ok: true as const };
}
