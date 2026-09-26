import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Briefcase, EnvelopeSimple, Phone, Plus, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { getDb } from "@/lib/db";
import {
  companies,
  companyWorkplaces,
  courseSessionCompanies,
  courseSessions,
  courses,
} from "@/lib/db/schema";
import { WorkplacesPanel } from "./workplaces-panel";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { getCurrentRole } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";
  const db = getDb();

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);

  if (!company) notFound();

  const [sessions, workplaces] = await Promise.all([
    db
      .select({
        id: courseSessions.id,
        name: courseSessions.name,
        status: courseSessions.status,
        courseName: courses.name,
      })
      .from(courseSessionCompanies)
      .innerJoin(courseSessions, eq(courseSessions.id, courseSessionCompanies.courseSessionId))
      .innerJoin(courses, eq(courses.id, courseSessions.courseId))
      .where(eq(courseSessionCompanies.companyId, id))
      .orderBy(desc(courseSessions.createdAt)),
    db
      .select({
        id: companyWorkplaces.id,
        name: companyWorkplaces.name,
        archivedAt: companyWorkplaces.archivedAt,
      })
      .from(companyWorkplaces)
      .where(eq(companyWorkplaces.companyId, id))
      .orderBy(companyWorkplaces.createdAt),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title={company.name}
        description={company.cnpj ?? "CNPJ não informado"}
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados de contato</CardTitle>
          <CardDescription>
            Confira se as informações estão corretas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <EnvelopeSimple className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
            <div>
              <p className="text-xs text-muted-foreground">E-mail de contato</p>
              <p className="font-medium">
                {company.contactEmail ?? (
                  <span className="text-muted-foreground">Não informado</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
            <div>
              <p className="text-xs text-muted-foreground">Telefone de contato</p>
              <p className="font-medium">
                {company.contactPhone ?? (
                  <span className="text-muted-foreground">Não informado</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="text-muted-foreground" size={16} />
            Postos de trabalho
          </CardTitle>
          <CardDescription>
            Locais de trabalho dentro deste CNPJ, usados na criação de turmas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WorkplacesPanel companyId={company.id} workplaces={workplaces} canEdit={canEdit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Turmas contratadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <UsersThree size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma turma cadastrada para esta empresa ainda.
              </p>
              {canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/sessions/new">
                    <Plus size={16} />
                    Nova turma
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{session.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.courseName}
                      </p>
                    </div>
                    <SessionStatusBadge status={session.status} />
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
