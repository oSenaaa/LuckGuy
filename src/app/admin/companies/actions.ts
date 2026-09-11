"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
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
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const document = readDocument(formData);
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const { country: phoneCountry, national: phoneNational } = readPhone(formData);
  const workplace = String(formData.get("workplace") ?? "").trim();

  if (!name) throw new Error("Nome da empresa é obrigatório");
  const documentError = validateDocument(document);
  if (documentError) throw new Error(documentError);
  const phoneError = validatePhone(phoneCountry, phoneNational);
  if (phoneError) throw new Error(phoneError);
  if (!workplace) throw new Error("Posto de trabalho é obrigatório");

  await getDb().insert(companies).values({
    name,
    cnpj: document,
    contactEmail,
    contactPhone: buildPhoneValue(phoneCountry, phoneNational) || null,
    workplace,
  });
  revalidatePath("/admin/companies");
}

export async function updateCompany(id: string, formData: FormData) {
  await requireAdmin();
  if (!id) return { ok: false as const, error: "Empresa inválida." };

  const name = String(formData.get("name") ?? "").trim();
  const document = readDocument(formData);
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const { country: phoneCountry, national: phoneNational } = readPhone(formData);
  const workplace = String(formData.get("workplace") ?? "").trim();

  if (!name) return { ok: false as const, error: "Nome da empresa é obrigatório." };
  const documentError = validateDocument(document);
  if (documentError) return { ok: false as const, error: documentError };
  const phoneError = validatePhone(phoneCountry, phoneNational);
  if (phoneError) return { ok: false as const, error: phoneError };
  if (!workplace) {
    return { ok: false as const, error: "Posto de trabalho é obrigatório." };
  }

  await getDb()
    .update(companies)
    .set({
      name,
      cnpj: document,
      contactEmail,
      contactPhone: buildPhoneValue(phoneCountry, phoneNational) || null,
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
