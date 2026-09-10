import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import {
  Archive,
  CalendarRange,
  ExternalLink,
  FileSpreadsheet,
  Send,
  Users,
  Video,
} from "lucide-react";

import { getDb } from "@/lib/db";
import {
  certificates,
  companies,
  courseSessions,
  courses,
  participants,
  viewingProgress,
} from "@/lib/db/schema";
import { archiveSession, publishSession } from "../actions";
import { ParticipantsPanel } from "./participants-panel";
import { formatWorkload, resolveWorkloadHours } from "@/lib/workload";
import { archiveExpiredSessions } from "@/lib/sessions";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  await archiveExpiredSessions();

  const [session] = await db
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      accessSlug: courseSessions.accessSlug,
      workloadHours: courseSessions.workloadHours,
      minWatchPercent: courseSessions.minWatchPercent,
      courseId: courses.id,
      courseName: courses.name,
      defaultDurationMinutes: courses.defaultDurationMinutes,
      videoProvider: courses.videoProvider,
      videoBlobUrl: courses.videoBlobUrl,
      videoYoutubeId: courses.videoYoutubeId,
      videoDurationSeconds: courses.videoDurationSeconds,
      companyName: companies.name,
      startsAt: courseSessions.startsAt,
      endsAt: courseSessions.endsAt,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .innerJoin(companies, eq(companies.id, courseSessions.companyId))
    .where(eq(courseSessions.id, id))
    .limit(1);

  if (!session) notFound();

  const participantsList = await db
    .select({
      id: participants.id,
      fullName: participants.fullName,
      phone: participants.phone,
      watchedPercent: viewingProgress.watchedPercent,
      completedAt: viewingProgress.completedAt,
      certificateUrl: certificates.pdfBlobUrl,
      certificateCode: certificates.verificationCode,
    })
    .from(participants)
    .leftJoin(viewingProgress, eq(viewingProgress.participantId, participants.id))
    .leftJoin(
      certificates,
      and(
        eq(certificates.participantId, participants.id),
        isNull(certificates.revokedAt),
      ),
    )
    .where(eq(participants.courseSessionId, id));

  const publicPath = `/t/${session.accessSlug}`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const publicUrl = host ? `${protocol}://${host}${publicPath}` : publicPath;
  const hasVideo =
    (session.videoProvider === "youtube" && session.videoYoutubeId) ||
    (session.videoProvider === "blob" && session.videoBlobUrl);
  const videoLabel = !hasVideo
    ? "Nenhuma fonte de vídeo ainda"
    : session.videoProvider === "youtube"
      ? `YouTube · ${session.videoYoutubeId}`
      : "Arquivo enviado";
  const videoMinutes = session.videoDurationSeconds
    ? `${Math.round(session.videoDurationSeconds / 60)} min`
    : null;

  const formatBrasiliaDateTime = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={Users}
        title={session.name}
        description={`${session.courseName} · ${session.companyName} · ${formatWorkload(resolveWorkloadHours(session.defaultDurationMinutes, Number(session.workloadHours)))}`}
      >
        <SessionStatusBadge status={session.status} />
      </PageHeader>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="size-4 text-muted-foreground" />
            Período da turma
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Início</p>
            <p className="font-medium">
              {session.startsAt ? (
                formatBrasiliaDateTime(session.startsAt)
              ) : (
                <span className="text-muted-foreground">Sem data definida</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fim</p>
            <p className="font-medium">
              {session.endsAt ? (
                formatBrasiliaDateTime(session.endsAt)
              ) : (
                <span className="text-muted-foreground">Sem data definida</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Link de acesso</CardTitle>
          <CardDescription>Compartilhe com os participantes desta turma.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <code className="max-w-full break-all rounded-md bg-muted px-2.5 py-1.5 text-xs">
            {publicUrl}
          </code>
          <CopyButton value={publicUrl} label="Copiar link" />
          <Button asChild variant="outline" size="sm">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              Abrir
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={`/api/sessions/${id}/export`}>
              <FileSpreadsheet />
              Exportar CSV
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Video className="size-4 text-muted-foreground" />
            Vídeo do treinamento
          </CardTitle>
          <CardDescription>
            {videoLabel}
            {videoMinutes ? ` · ${videoMinutes}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O vídeo é definido no treinamento e usado por todas as turmas dele.{" "}
            <Link href={`/admin/courses/${session.courseId}`} className="font-medium text-primary underline-offset-4 hover:underline">
              Gerenciar vídeo em {session.courseName}
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            {session.status !== "published" && (
              <form action={publishSession}>
                <input type="hidden" name="id" value={session.id} />
                <Button type="submit">
                  <Send />
                  Publicar turma
                </Button>
              </form>
            )}
            {session.status !== "archived" && (
              <form action={archiveSession}>
                <input type="hidden" name="id" value={session.id} />
                <Button type="submit" variant="outline">
                  <Archive />
                  Arquivar
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <ParticipantsPanel
          participants={participantsList}
          sessionId={session.id}
          downloadAllHref={`/api/sessions/${id}/certificates/download`}
        />
      </Card>
    </div>
  );
}
