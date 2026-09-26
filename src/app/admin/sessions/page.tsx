import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { courseSessions, courses } from "@/lib/db/schema";
import {
  archiveExpiredSessions,
  getCompaniesBySessionId,
  getParticipantCountsBySessionId,
} from "@/lib/sessions";
import { SessionsView } from "./sessions-view";
import { getCurrentRole } from "@/lib/permissions";

export default async function SessionsPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  await archiveExpiredSessions();

  const sessionList = await getDb()
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      courseName: courses.name,
      startsAt: courseSessions.startsAt,
      endsAt: courseSessions.endsAt,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .orderBy(desc(courseSessions.createdAt));

  const sessionIds = sessionList.map((session) => session.id);
  const [companiesBySession, participantCountsBySession] = await Promise.all([
    getCompaniesBySessionId(sessionIds),
    getParticipantCountsBySessionId(sessionIds),
  ]);

  const list = sessionList.map((session) => ({
    ...session,
    companies: companiesBySession.get(session.id) ?? [],
    participantCount: participantCountsBySession.get(session.id) ?? 0,
  }));

  const companyOptions = [
    ...new Map(
      list.flatMap((session) => session.companies).map((company) => [company.id, company]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="w-full max-w-6xl">
      <SessionsView sessions={list} companies={companyOptions} canEdit={canEdit} />
    </div>
  );
}
