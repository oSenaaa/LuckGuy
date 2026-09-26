import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import {
  Archive,
  ExternalLink,
  FileSpreadsheet,
  Users,
  Video,
} from "lucide-react";

import { getDb } from "@/lib/db";
import {
  certificates,
  companies,
  companyWorkplaces,
  courseSessions,
  courses,
  participants,
  viewingProgress,
} from "@/lib/db/schema";
import { archiveSession } from "../actions";
import { ParticipantsPanel } from "./participants-panel";
import { PublishSessionButton } from "./publish-session-button";
import { SessionPeriodPanel } from "./session-period-panel";
import { formatWorkload, resolveWorkloadHours } from "@/lib/workload";
import { archiveExpiredSessions, getCompanyNamesBySessionId } from "@/lib/sessions";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentRole } from "@/lib/permissions";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";
  const db = getDb();

  await archiveExpiredSessions();

  const [session] = await db
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      accessSlug: courseSessions.accessSlug,
      accessPin: courseSessions.accessPin,
      workloadHours: courseSessions.workloadHours,
      minWatchPercent: courseSessions.minWatchPercent,
      courseId: courses.id,
      courseName: courses.name,
      defaultDurationMinutes: courses.defaultDurationMinutes,
      videoProvider: courses.videoProvider,
      videoBlobUrl: courses.videoBlobUrl,
      videoYoutubeId: courses.videoYoutubeId,
      videoDurationSeconds: courses.videoDurationSeconds,
      startsAt: courseSessions.startsAt,
      endsAt: courseSessions.endsAt,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.id, id))
    .limit(1);

  if (!session) notFound();

  const companyNamesBySession = await getCompanyNamesBySessionId([session.id]);
  const companyName = companyNamesBySession.get(session.id) ?? "";

  const participantsList = await db
    .select({
      id: participants.id,
      fullName: participants.fullName,
      phone: participants.phone,
      watchedPercent: viewingProgress.watchedPercent,
      completedAt: viewingProgress.completedAt,
      certificateUrl: certificates.pdfBlobUrl,
      certificateCode: certificates.verificationCode,
      companyName: companies.name,
      workplaceName: companyWorkplaces.name,
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
    .leftJoin(companies, eq(companies.id, participants.companyId))
    .leftJoin(companyWorkplaces, eq(companyWorkplaces.id, participants.workplaceId))
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={Users}
        title={session.name}
        description={`${session.courseName} · ${companyName} · ${formatWorkload(resolveWorkloadHours(session.defaultDurationMinutes, Number(session.workloadHours)))}`}
      >
        <SessionStatusBadge status={session.status} />
      </PageHeader>

      <Card>
        <SessionPeriodPanel
          sessionId={session.id}
          status={session.status}
          startsAt={session.startsAt}
          endsAt={session.endsAt}
          canEdit={canEdit}
        />
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Link de acesso</CardTitle>
          <CardDescription>Compartilhe com os participantes desta turma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
          {session.accessPin && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Código da turma:</span>
              <code className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs tracking-widest">
                {session.accessPin}
              </code>
              <CopyButton value={session.accessPin} label="Copiar código" />
              <span className="text-xs text-muted-foreground">
                Envie junto com o link — é exigido na identificação.
              </span>
            </div>
          )}
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
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              {session.status !== "published" && (
                <PublishSessionButton sessionId={session.id} />
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
          )}
        </CardContent>
      </Card>

      <Card>
        <ParticipantsPanel
          participants={participantsList}
          sessionId={session.id}
          downloadAllHref={`/api/sessions/${id}/certificates/download`}
          canEdit={canEdit}
        />
      </Card>
    </div>
  );
}
