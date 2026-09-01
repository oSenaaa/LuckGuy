import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CalendarClock, CalendarX, GraduationCap } from "lucide-react";

import { getDb } from "@/lib/db";
import { courseSessions, courses } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";
import { IdentifyForm } from "./identify-form";
import { StatusCard } from "@/components/status-card";
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
      startsAt: courseSessions.startsAt,
      endsAt: courseSessions.endsAt,
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

  const now = new Date();
  if (session.startsAt && session.startsAt > now) {
    const availableAt = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(session.startsAt);

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <StatusCard
          icon={CalendarClock}
          title="Treinamento ainda não disponível"
          description={`O acesso será liberado em ${availableAt}, no horário de Brasília.`}
        />
      </div>
    );
  }

  if (session.endsAt && session.endsAt < now) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <StatusCard
          icon={CalendarX}
          title="Prazo encerrado"
          description="O período para assistir a este treinamento terminou. Fale com a empresa responsável."
        />
      </div>
    );
  }

  const existingParticipantId = await getParticipantId(session.id);
  if (existingParticipantId) {
    redirect(`/t/${slug}/assistir`);
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
          <IdentifyForm accessSlug={slug} />
        </CardContent>
      </Card>
    </div>
  );
}
