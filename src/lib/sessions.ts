import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, courseSessionCompanies, courseSessions } from "@/lib/db/schema";

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
 * Uma turma pode ter várias empresas. Retorna, por turma, os nomes já
 * juntos numa string ("Empresa A, Empresa B") para exibir em listagens sem
 * precisar de GROUP BY na query principal (que muda de forma em cada tela).
 * Sem `sessionIds`, busca para todas as turmas (uso em listagens gerais).
 */
export async function getCompanyNamesBySessionId(sessionIds?: string[]) {
  if (sessionIds && sessionIds.length === 0) return new Map<string, string>();

  const rows = await getDb()
    .select({
      sessionId: courseSessionCompanies.courseSessionId,
      companyName: companies.name,
    })
    .from(courseSessionCompanies)
    .innerJoin(companies, eq(companies.id, courseSessionCompanies.companyId))
    .where(sessionIds ? inArray(courseSessionCompanies.courseSessionId, sessionIds) : undefined);

  const namesBySession = new Map<string, string[]>();
  for (const row of rows) {
    const names = namesBySession.get(row.sessionId) ?? [];
    names.push(row.companyName);
    namesBySession.set(row.sessionId, names);
  }

  return new Map([...namesBySession].map(([sessionId, names]) => [sessionId, names.join(", ")]));
}
