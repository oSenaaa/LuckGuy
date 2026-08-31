import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  GraduationCap,
  LayoutDashboard,
  Plus,
} from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboard() {
  const recentSessions = await getDb()
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
    .orderBy(desc(courseSessions.createdAt))
    .limit(5);

  const shortcuts = [
    { label: "Nova turma", href: "/admin/sessions/new", icon: Plus, primary: true },
    { label: "Treinamentos", href: "/admin/courses", icon: GraduationCap },
    { label: "Empresas", href: "/admin/companies", icon: Building2 },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Painel"
        description="Visão geral das turmas e atalhos de gestão."
      />

      <div className="flex flex-wrap gap-2">
        {shortcuts.map(({ label, href, icon: Icon, primary }) => (
          <Button
            key={href}
            asChild
            variant={primary ? "default" : "outline"}
            size="lg"
          >
            <Link href={href}>
              <Icon />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            Turmas recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentSessions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma turma ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentSessions.map((session) => (
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
