import { and, count, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, courseSessionCompanies, courseSessions, participants } from "@/lib/db/schema";

/**
 * Published sessions whose end date has already passed get moved to
 * "archived" automatically. Called both lazily (on admin page loads, for
 * immediate feedback) and from the daily Vercel Cron job (so it also
 * happens even if nobody opens the admin panel that day).
 */
export async function archiveExpiredSessions() {
  await getDb()
    .update(courseSessions)
    .set({ status: "archived" })
    .where(and(eq(courseSessions.status, "published"), lt(courseSessions.endsAt, new Date())));
}

/**
 * Uma turma pode ter várias empresas. Retorna, por turma, a lista de
 * empresas vinculadas (id + nome). Sem `sessionIds`, busca para todas as
 * turmas (uso em listagens gerais).
 */
export async function getCompaniesBySessionId(sessionIds?: string[]) {
  if (sessionIds && sessionIds.length === 0) return new Map<string, { id: string; name: string }[]>();

  const rows = await getDb()
    .select({
      sessionId: courseSessionCompanies.courseSessionId,
      companyId: companies.id,
      companyName: companies.name,
    })
    .from(courseSessionCompanies)
    .innerJoin(companies, eq(companies.id, courseSessionCompanies.companyId))
    .where(sessionIds ? inArray(courseSessionCompanies.courseSessionId, sessionIds) : undefined);

  const companiesBySession = new Map<string, { id: string; name: string }[]>();
  for (const row of rows) {
    const list = companiesBySession.get(row.sessionId) ?? [];
    list.push({ id: row.companyId, name: row.companyName });
    companiesBySession.set(row.sessionId, list);
  }

  return companiesBySession;
}

/**
 * Mesmos dados de `getCompaniesBySessionId`, já juntos numa string
 * ("Empresa A, Empresa B") para exibir em listagens sem precisar de
 * GROUP BY na query principal (que muda de forma em cada tela).
 */
export async function getCompanyNamesBySessionId(sessionIds?: string[]) {
  const companiesBySession = await getCompaniesBySessionId(sessionIds);
  return new Map(
    [...companiesBySession].map(([sessionId, list]) => [
      sessionId,
      list.map((company) => company.name).join(", "),
    ]),
  );
}

/**
 * Quantidade de participantes cadastrados por turma. Sem `sessionIds`,
 * busca para todas as turmas.
 */
export async function getParticipantCountsBySessionId(sessionIds?: string[]) {
  if (sessionIds && sessionIds.length === 0) return new Map<string, number>();

  const rows = await getDb()
    .select({ sessionId: participants.courseSessionId, value: count() })
    .from(participants)
    .where(sessionIds ? inArray(participants.courseSessionId, sessionIds) : undefined)
    .groupBy(participants.courseSessionId);

  return new Map(rows.map((row) => [row.sessionId, Number(row.value)]));
}
