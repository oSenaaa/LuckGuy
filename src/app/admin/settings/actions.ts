"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, ROLES, type Role } from "@/lib/permissions";

function readRole(value: FormDataEntryValue | null): Role | null {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

export async function inviteUser(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = readRole(formData.get("role"));

  if (!email) throw new Error("E-mail é obrigatório");
  if (!role) throw new Error("Selecione um nível de permissão");

  const client = await clerkClient();
  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role },
    });
  } catch {
    throw new Error(
      "Não foi possível enviar o convite. Verifique se o e-mail já não tem conta ou convite pendente.",
    );
  }

  revalidatePath("/admin/settings");
}

export async function updateUserRole(userId: string, formData: FormData) {
  const { userId: currentUserId } = await requireAdmin();
  const role = readRole(formData.get("role"));

  if (userId === currentUserId) {
    return { ok: false as const, error: "Você não pode alterar seu próprio nível de permissão." };
  }
  if (!role) return { ok: false as const, error: "Selecione um nível de permissão." };

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { publicMetadata: { role } });
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function revokeAccess(userId: string) {
  const { userId: currentUserId } = await requireAdmin();
  if (userId === currentUserId) {
    return { ok: false as const, error: "Você não pode revogar seu próprio acesso." };
  }

  const client = await clerkClient();
  await client.users.banUser(userId);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function restoreAccess(userId: string) {
  await requireAdmin();

  const client = await clerkClient();
  await client.users.unbanUser(userId);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function revokeInvitation(invitationId: string) {
  await requireAdmin();

  const client = await clerkClient();
  try {
    await client.invitations.revokeInvitation(invitationId);
  } catch {
    return { ok: false as const, error: "Não foi possível revogar o convite." };
  }
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
