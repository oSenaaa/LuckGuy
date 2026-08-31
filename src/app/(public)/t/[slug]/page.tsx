import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CalendarX, GraduationCap } from "lucide-react";

import { getDb } from "@/lib/db";
import { courseSessions, courses } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";
import { identifyParticipant } from "./actions";
import { StatusCard } from "@/components/status-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const db = getDb();
  const [session] = await db
    .select({
      id: courseSessions.id,
      status: courseSessions.status,
      courseName: courses.name,
      workloadHours: courseSessions.workloadHours,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.accessSlug, slug))
    .limit(1);

  if (!session || session.status !== "published") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <StatusCard
          icon={CalendarX}
          title="Turma indisponível"
          description="Este link não está mais ativo. Fale com a empresa responsável pelo treinamento."
        />
      </div>
    );
  }

  const existingParticipantId = await getParticipantId(session.id);
  if (existingParticipantId) {
    redirect(`/t/${slug}/assistir`);
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    await identifyParticipant(slug, formData);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="border-b">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </span>
          <CardTitle className="text-lg">{session.courseName}</CardTitle>
          <CardDescription>
            Carga horária: {Number(session.workloadHours)}h. Informe seus dados para
            confirmar a presença e assistir ao treinamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                required
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <SubmitButton pendingText="Confirmando…" className="w-full">
              Confirmar presença e começar
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
