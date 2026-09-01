"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions, participants } from "@/lib/db/schema";
import { createParticipantSession } from "@/lib/participant-session";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export type IdentifyParticipantState = {
  error: string | null;
};

export async function identifyParticipant(
  accessSlug: string,
  _previousState: IdentifyParticipantState,
  formData: FormData,
): Promise<IdentifyParticipantState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!fullName || phone.length < 10) {
    return { error: "Informe um nome e um telefone válidos." };
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

    const now = new Date();
    if (session.startsAt && session.startsAt > now) {
      return { error: "Este treinamento ainda não está disponível." };
    }
    if (session.endsAt && session.endsAt < now) {
      return { error: "O prazo para assistir a este treinamento encerrou." };
    }

    const [participant] = await db
      .insert(participants)
      .values({ courseSessionId: session.id, fullName, phone })
      .onConflictDoUpdate({
        target: [participants.courseSessionId, participants.phone],
        set: { fullName },
      })
      .returning({ id: participants.id });

    await createParticipantSession(session.id, participant.id);
  } catch (error) {
    console.error("Falha ao identificar participante", error);
    return {
      error: "Não foi possível confirmar sua presença. Tente novamente em instantes.",
    };
  }

  redirect(`/t/${accessSlug}/assistir`);
}
