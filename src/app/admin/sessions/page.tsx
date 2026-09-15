import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CalendarClock, Plus } from "lucide-react";

import { getDb } from "@/lib/db";
import { courseSessions, courses } from "@/lib/db/schema";
import { archiveExpiredSessions, getCompanyNamesBySessionId } from "@/lib/sessions";
import { PageHeader } from "@/components/admin/page-header";
import { SessionsTable } from "@/components/admin/sessions-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SessionsPage() {
  await archiveExpiredSessions();

  const sessionList = await getDb()
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      courseName: courses.name,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .orderBy(desc(courseSessions.createdAt));

  const companyNamesBySession = await getCompanyNamesBySessionId(
    sessionList.map((session) => session.id),
  );
  const list = sessionList.map((session) => ({
    ...session,
    companyName: companyNamesBySession.get(session.id) ?? "",
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={CalendarClock}
        title="Turmas"
        description="Turmas de treinamento com link de acesso para os participantes."
      >
        <Button asChild>
          <Link href="/admin/sessions/new">
            <Plus />
            Nova turma
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <SessionsTable sessions={list} />
      </Card>
    </div>
  );
}
