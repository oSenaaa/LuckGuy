"use server";

// TODO(A2): a identidade do participante ainda é auto-declarada (nome + telefone
// + PIN da turma). A correção definitiva para valor legal do certificado é
// verificação por OTP de SMS (provedor via Vercel Marketplace) ou provisionamento
// da lista de participantes pelo RH da empresa. Ver plano de segurança.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions, participants } from "@/lib/db/schema";
import { createParticipantSession } from "@/lib/participant-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

// Uma letra inicial, depois letras (com acento), espaços, hífen, apóstrofo e ponto.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s'.-]{1,119}$/u;

export type IdentifyParticipantState = {
  error: string | null;
};

export async function identifyParticipant(
  accessSlug: string,
  _previousState: IdentifyParticipantState,
  formData: FormData,
): Promise<IdentifyParticipantState> {
  const fullName = normalizeName(String(formData.get("fullName") ?? ""));
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const accessPin = normalizePhone(String(formData.get("accessPin") ?? ""));

  const ip = clientIp(await headers());
  const limited = await rateLimit("identify", `${ip}:${accessSlug}`, {
    limit: 5,
    windowSeconds: 60,
  });
  if (!limited.success) {
    return {
      error: `Muitas tentativas. Tente novamente em ${limited.retryAfter}s.`,
    };
  }

  if (!NAME_PATTERN.test(fullName)) {
    return { error: "Informe seu nome completo (apenas letras, 2 a 120 caracteres)." };
  }
  if (phone.length < 10 || phone.length > 11) {
    return { error: "Informe um telefone válido, com DDD (10 ou 11 dígitos)." };
  }

  try {
    const db = getDb();
    const [session] = await db
      .select()
      .from(courseSessions)
      .where(and(eq(courseSessions.accessSlug, accessSlug), eq(courseSessions.status, "published")))
      .limit(1);

    if (!session) {
      return { error: "Esta turma não está disponível." };
    }

    if (session.accessPin && session.accessPin !== accessPin) {
      return { error: "Código da turma inválido. Confira com a empresa responsável." };
    }

    const now = new Date();
    if (session.startsAt && session.startsAt > now) {
      return { error: "Este treinamento ainda não está disponível." };
    }
    if (session.endsAt && session.endsAt < now) {
      return { error: "O prazo para assistir a este treinamento encerrou." };
    }

    // Primeiro a se identificar com um telefone é o dono do registro: não
    // sobrescrevemos o nome de quem já entrou (evita troca de identidade).
    const [inserted] = await db
      .insert(participants)
      .values({ courseSessionId: session.id, fullName, phone })
      .onConflictDoNothing({
        target: [participants.courseSessionId, participants.phone],
      })
      .returning({ id: participants.id });

    let participantId = inserted?.id;
    if (!participantId) {
      const [existing] = await db
        .select({ id: participants.id })
        .from(participants)
        .where(
          and(
            eq(participants.courseSessionId, session.id),
            eq(participants.phone, phone),
          ),
        )
        .limit(1);
      participantId = existing?.id;
    }

    if (!participantId) {
      return {
        error: "Não foi possível confirmar sua presença. Tente novamente em instantes.",
      };
    }

    await createParticipantSession(session.id, participantId);
  } catch (error) {
    console.error("Falha ao identificar participante", error);
    return {
      error: "Não foi possível confirmar sua presença. Tente novamente em instantes.",
    };
  }

  redirect(`/t/${accessSlug}/assistir`);
}
