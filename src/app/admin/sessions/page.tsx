import Link from "next/link";
import { count, desc, eq, ne } from "drizzle-orm";
import { ArrowUpRight, CalendarClock, Plus } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const showArchived = status === "archived";

  const db = getDb();
  const [list, [{ archivedCount }], [{ totalCount }]] = await Promise.all([
    db
      .select({
        id: courseSessions.id,
        name: courseSessions.name,
        status: courseSessions.status,
        accessSlug: courseSessions.accessSlug,
        courseName: courses.name,
        companyName: companies.name,
      })
      .from(courseSessions)
      .innerJoin(courses, eq(courses.id, courseSessions.courseId))
      .innerJoin(companies, eq(companies.id, courseSessions.companyId))
      .where(showArchived ? eq(courseSessions.status, "archived") : ne(courseSessions.status, "archived"))
      .orderBy(desc(courseSessions.createdAt)),
    db.select({ archivedCount: count() }).from(courseSessions).where(eq(courseSessions.status, "archived")),
    db.select({ totalCount: count() }).from(courseSessions),
  ]);
  const activeCount = totalCount - archivedCount;

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

      <div className="flex w-fit items-center gap-1 rounded-lg border bg-muted/40 p-1">
        <Link
          href="/admin/sessions"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            !showArchived
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Ativas
          <span className="ml-1.5 text-xs text-muted-foreground">{activeCount}</span>
        </Link>
        <Link
          href="/admin/sessions?status=archived"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            showArchived
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Arquivadas
          <span className="ml-1.5 text-xs text-muted-foreground">{archivedCount}</span>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {showArchived ? "Nenhuma turma arquivada." : "Nenhuma turma ativa."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{session.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.courseName} · {session.companyName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <SessionStatusBadge status={session.status} />
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
