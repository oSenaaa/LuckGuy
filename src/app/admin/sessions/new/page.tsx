import { eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { companies, companyWorkplaces, courses } from "@/lib/db/schema";
import { CreateSessionForm } from "./create-session-form";
import { PageHeader } from "@/components/admin/page-header";
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
          <CreateSessionForm
            courses={courseList.map((course) => ({
              id: course.id,
              name: course.name,
              hasVideo:
                (course.videoProvider === "blob" && Boolean(course.videoBlobUrl)) ||
                (course.videoProvider === "youtube" && Boolean(course.videoYoutubeId)),
              defaultDurationMinutes: course.defaultDurationMinutes,
            }))}
            companies={companiesWithWorkplaces}
          />
        </CardContent>
      </Card>
    </div>
  );
}
