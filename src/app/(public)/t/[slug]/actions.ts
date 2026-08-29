"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions, participants } from "@/lib/db/schema";
import { createParticipantSession } from "@/lib/participant-session";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function identifyParticipant(accessSlug: string, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!fullName || phone.length < 10) {
    throw new Error("Nome e telefone válidos são obrigatórios");
  }

  const db = getDb();
  const [session] = await db
    .select()
    .from(courseSessions)
    .where(and(eq(courseSessions.accessSlug, accessSlug), eq(courseSessions.status, "published")))
    .limit(1);

  if (!session) {
    throw new Error("Turma não encontrada ou indisponível");
  }

  const now = new Date();
  if (session.startsAt && session.startsAt > now) {
    throw new Error("Este treinamento ainda não está disponível");
  }
  if (session.endsAt && session.endsAt < now) {
    throw new Error("O prazo para assistir a este treinamento encerrou");
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

  redirect(`/t/${accessSlug}/assistir`);
}
