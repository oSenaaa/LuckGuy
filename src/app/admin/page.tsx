import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Building2, GraduationCap, LayoutDashboard, Plus } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { SessionsTable } from "@/components/admin/sessions-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const sessions = await getDb()
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
        <SessionsTable sessions={sessions} />
      </Card>
    </div>
  );
}
