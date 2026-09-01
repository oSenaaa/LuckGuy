import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import {
  Archive,
  CheckCircle2,
  Download,
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
import { archiveSession, publishSession, reissueCertificate } from "../actions";
import { VideoUpload } from "./video-upload";
import { YoutubeVideoForm } from "./youtube-video-form";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const [session] = await db
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      accessSlug: courseSessions.accessSlug,
      workloadHours: courseSessions.workloadHours,
      videoProvider: courseSessions.videoProvider,
      videoBlobUrl: courseSessions.videoBlobUrl,
      videoYoutubeId: courseSessions.videoYoutubeId,
      videoDurationSeconds: courseSessions.videoDurationSeconds,
      minWatchPercent: courseSessions.minWatchPercent,
      courseName: courses.name,
      companyName: companies.name,
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={Users}
        title={session.name}
        description={`${session.courseName} · ${session.companyName} · ${Number(session.workloadHours)}h`}
      >
        <SessionStatusBadge status={session.status} />
      </PageHeader>

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
          <div className="grid gap-4 sm:grid-cols-2">
            <VideoUpload sessionId={session.id} />
            <YoutubeVideoForm sessionId={session.id} />
          </div>
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
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            Participantes
            <Badge variant="secondary">{participantsList.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {participantsList.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum participante ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">% assistido</TableHead>
                  <TableHead>Concluído</TableHead>
                  <TableHead className="text-right">Certificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.watchedPercent ? Number(p.watchedPercent).toFixed(0) : 0}%
                    </TableCell>
                    <TableCell>
                      {p.completedAt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          Sim
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.certificateUrl ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={p.certificateUrl} target="_blank">
                              <Download />
                              Baixar
                            </Link>
                          </Button>
                          <form action={reissueCertificate}>
                            <input type="hidden" name="participantId" value={p.id} />
                            <input type="hidden" name="sessionId" value={session.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Reemitir
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <span className="block text-right text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
