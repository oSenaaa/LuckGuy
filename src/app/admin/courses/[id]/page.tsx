import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Plus, Signature as SignatureIcon, UsersThree, VideoCamera } from "@phosphor-icons/react/dist/ssr";

import { getDb } from "@/lib/db";
import { certificateSignatures, courses, courseSessions } from "@/lib/db/schema";
import { getCompanyNamesBySessionId } from "@/lib/sessions";
import { VideoUpload } from "./video-upload";
import { YoutubeVideoForm } from "./youtube-video-form";
import { CourseSignatureForm } from "./course-signature-form";
import { DeleteCourseButton } from "./delete-course-button";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentRole } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDuration(minutes: number | null) {
  if (!minutes) return "Não informada";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";
  const db = getDb();

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();

  const [sessionList, signatureList] = await Promise.all([
    db
      .select({
        id: courseSessions.id,
        name: courseSessions.name,
        status: courseSessions.status,
      })
      .from(courseSessions)
      .where(eq(courseSessions.courseId, id))
      .orderBy(desc(courseSessions.createdAt)),
    db.select().from(certificateSignatures).orderBy(desc(certificateSignatures.isDefault)),
  ]);

  const companyNamesBySession = await getCompanyNamesBySessionId(
    sessionList.map((session) => session.id),
  );
  const sessions = sessionList.map((session) => ({
    ...session,
    companyName: companyNamesBySession.get(session.id) ?? "",
  }));

  const defaultSignature = signatureList.find((signature) => signature.isDefault);
  const resolvedSignature = course.coordinatorSignatureId
    ? signatureList.find((signature) => signature.id === course.coordinatorSignatureId)
    : defaultSignature;
  const signatureLabel = course.coordinatorSignatureId
    ? resolvedSignature
      ? `${resolvedSignature.coordinatorName}${resolvedSignature.coordinatorRole ? ` — ${resolvedSignature.coordinatorRole}` : ""}`
      : "Assinatura não encontrada"
    : defaultSignature
      ? `Assinatura padrão: ${defaultSignature.coordinatorName}`
      : "Nenhuma assinatura cadastrada ainda";

  const hasVideo =
    (course.videoProvider === "blob" && course.videoBlobUrl) ||
    (course.videoProvider === "youtube" && course.videoYoutubeId);
  const videoLabel = !hasVideo
    ? "Nenhuma fonte de vídeo ainda"
    : course.videoProvider === "youtube"
      ? `YouTube · ${course.videoYoutubeId}`
      : "Arquivo enviado";
  const videoMinutes = course.videoDurationSeconds
    ? `${Math.round(course.videoDurationSeconds / 60)} min`
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader title={course.name} description={course.nrCode ?? undefined}>
        {course.isActive ? (
          <StatusBadge status="active">Ativo</StatusBadge>
        ) : (
          <StatusBadge status="draft">Inativo</StatusBadge>
        )}
      </PageHeader>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados do treinamento</CardTitle>
          <CardDescription>
            Para editar, use “Editar dados” na listagem de Treinamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Duração padrão</p>
            <p className="font-medium">{formatDuration(course.defaultDurationMinutes)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Descrição</p>
            <p className="font-medium">
              {course.description || <span className="text-muted-foreground">Não informada</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <VideoCamera size={16} className="text-muted-foreground" />
              Vídeo do treinamento
            </CardTitle>
            <CardDescription>
              {videoLabel}
              {videoMinutes ? ` · ${videoMinutes}` : ""}
              {" · usado automaticamente em todas as turmas deste treinamento"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <VideoUpload courseId={course.id} />
            <YoutubeVideoForm courseId={course.id} />
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <SignatureIcon size={16} className="text-muted-foreground" />
              Instrutor e assinatura
            </CardTitle>
            <CardDescription>
              {signatureLabel} · usado automaticamente nos certificados das turmas deste treinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseSignatureForm
              courseId={course.id}
              coordinatorSignatureId={course.coordinatorSignatureId}
              signatureList={signatureList}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            Turmas deste treinamento
            <Badge variant="secondary">{sessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <UsersThree size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma turma criada com este treinamento ainda.
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
                        {session.companyName}
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

      {canEdit && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Excluir treinamento</CardTitle>
            <CardDescription>
              Só é possível excluir treinamentos sem turmas vinculadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteCourseButton courseId={course.id} disabled={sessions.length > 0} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
