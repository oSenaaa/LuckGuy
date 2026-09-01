import { eq } from "drizzle-orm";
import { CalendarPlus } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies, courses } from "@/lib/db/schema";
import { createSession } from "../actions";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewSessionPage() {
  const db = getDb();
  const [courseList, companyList] = await Promise.all([
    db.select().from(courses).where(eq(courses.isActive, true)),
    db.select().from(companies),
  ]);

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
            Após criar, você poderá enviar o vídeo e publicar a turma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSession} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="courseId">Treinamento</Label>
              <NativeSelect id="courseId" name="courseId" required defaultValue="">
                <option value="" disabled>
                  Selecione um treinamento
                </option>
                {courseList.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyId">Empresa cliente</Label>
              <NativeSelect id="companyId" name="companyId" required defaultValue="">
                <option value="" disabled>
                  Selecione uma empresa
                </option>
                {companyList.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </NativeSelect>
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

            <div className="grid gap-2">
              <Label htmlFor="workloadHours">Carga horária (horas)</Label>
              <Input
                id="workloadHours"
                name="workloadHours"
                type="number"
                min={0.5}
                step={0.5}
                required
                placeholder="Ex: 2"
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
