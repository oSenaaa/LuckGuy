import { eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, companyWorkplaces, courses } from "@/lib/db/schema";
import { createSession } from "../actions";
import { CompanySelector } from "./company-selector";
import { CourseAndDurationFields } from "./course-and-duration-fields";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentRole } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewSessionPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";
  if (!canEdit) redirect("/admin/sessions");

  const db = getDb();
  const [courseList, companyList, workplaceList] = await Promise.all([
    db.select().from(courses).where(eq(courses.isActive, true)),
    db.select().from(companies).where(isNull(companies.archivedAt)),
    db.select().from(companyWorkplaces).where(isNull(companyWorkplaces.archivedAt)),
  ]);
  const companiesWithWorkplaces = companyList.map((company) => ({
    id: company.id,
    name: company.name,
    workplaces: workplaceList
      .filter((workplace) => workplace.companyId === company.id)
      .map((workplace) => ({ id: workplace.id, name: workplace.name })),
  }));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        icon={CalendarPlus}
        title="Nova turma"
        description="Vincule um treinamento a uma empresa e gere o link de acesso."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados da turma</CardTitle>
          <CardDescription>
            O vídeo do treinamento selecionado é usado automaticamente. Após criar,
            você poderá publicar a turma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSession} className="grid gap-4">
            <CourseAndDurationFields
              courses={courseList.map((course) => ({
                id: course.id,
                name: course.name,
                hasVideo:
                  (course.videoProvider === "blob" && Boolean(course.videoBlobUrl)) ||
                  (course.videoProvider === "youtube" && Boolean(course.videoYoutubeId)),
                defaultDurationMinutes: course.defaultDurationMinutes,
              }))}
            />

            <div className="grid gap-2">
              <Label>Empresas clientes</Label>
              <CompanySelector companies={companiesWithWorkplaces} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome da turma</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: NR-01 - Agosto/2026 - Empresa X"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Início (opcional, horário de Brasília)</Label>
                <Input id="startsAt" name="startsAt" type="datetime-local" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">Fim (opcional, horário de Brasília)</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" />
              </div>
            </div>

            <div>
              <SubmitButton pendingText="Criando…">Criar turma</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
