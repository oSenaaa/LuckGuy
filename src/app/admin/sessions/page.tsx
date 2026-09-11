import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CalendarClock, Plus } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";
import { archiveExpiredSessions } from "@/lib/sessions";
import { PageHeader } from "@/components/admin/page-header";
import { SessionsTable } from "@/components/admin/sessions-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SessionsPage() {
  await archiveExpiredSessions();

  const list = await getDb()
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      courseName: courses.name,
      companyName: companies.name,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .innerJoin(companies, eq(companies.id, courseSessions.companyId))
    .orderBy(desc(courseSessions.createdAt));

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
