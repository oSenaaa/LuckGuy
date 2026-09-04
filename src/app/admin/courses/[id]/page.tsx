import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GraduationCap, PenLine, Trash2, Video } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificateSignatures, companies, courses, courseSessions } from "@/lib/db/schema";
import { deleteCourse, setCourseSignature, updateCourse } from "../actions";
import { VideoUpload } from "./video-upload";
import { YoutubeVideoForm } from "./youtube-video-form";
import { PageHeader } from "@/components/admin/page-header";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();

  const [sessions, signatureList] = await Promise.all([
    db
      .select({
        id: courseSessions.id,
        name: courseSessions.name,
        status: courseSessions.status,
        companyName: companies.name,
      })
      .from(courseSessions)
      .innerJoin(companies, eq(companies.id, courseSessions.companyId))
      .where(eq(courseSessions.courseId, id))
      .orderBy(desc(courseSessions.createdAt)),
    db.select().from(certificateSignatures).orderBy(desc(certificateSignatures.isDefault)),
  ]);

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
      <PageHeader
        icon={GraduationCap}
        title={course.name}
        description={course.nrCode ?? undefined}
      >
        <Badge variant={course.isActive ? "secondary" : "outline"}>
          {course.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </PageHeader>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados do treinamento</CardTitle>
          <CardDescription>Edite as informações e salve para atualizar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCourse} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={course.id} />
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required defaultValue={course.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nrCode">Código da NR</Label>
              <Input id="nrCode" name="nrCode" defaultValue={course.nrCode ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultDurationMinutes">Duração padrão (min)</Label>
              <Input
                id="defaultDurationMinutes"
                name="defaultDurationMinutes"
                type="number"
                min={1}
                defaultValue={course.defaultDurationMinutes ?? ""}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" defaultValue={course.description ?? ""} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox id="isActive" name="isActive" value="on" defaultChecked={course.isActive} />
              <Label htmlFor="isActive" className="font-normal">
                Disponível para criar novas turmas
              </Label>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Salvando…">Salvar alterações</SubmitButton>
            </div>
          </form>
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
            {" · usado automaticamente em todas as turmas deste treinamento"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <VideoUpload courseId={course.id} />
          <YoutubeVideoForm courseId={course.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <PenLine className="size-4 text-muted-foreground" />
            Instrutor e assinatura
          </CardTitle>
          <CardDescription>
            {signatureLabel} · usado automaticamente nos certificados das turmas deste treinamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setCourseSignature} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={course.id} />
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="coordinatorSignatureId">Instrutor</Label>
              <NativeSelect
                id="coordinatorSignatureId"
                name="coordinatorSignatureId"
                defaultValue={course.coordinatorSignatureId ?? ""}
              >
                <option value="">Usar assinatura padrão automaticamente</option>
                {signatureList.map((signature) => (
                  <option key={signature.id} value={signature.id}>
                    {signature.coordinatorName}
                    {signature.coordinatorRole ? ` — ${signature.coordinatorRole}` : ""}
                    {signature.isDefault ? " (padrão)" : ""}
                  </option>
                ))}
              </NativeSelect>
              {signatureList.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma assinatura cadastrada ainda. Cadastre uma em{" "}
                  <Link href="/admin/signatures" className="underline underline-offset-4">
                    Assinaturas
                  </Link>
                  .
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Salvando…">Salvar instrutor</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            Turmas deste treinamento
            <Badge variant="secondary">{sessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma turma criada com este treinamento ainda.
            </p>
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

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Excluir treinamento</CardTitle>
          <CardDescription>
            Só é possível excluir treinamentos sem turmas vinculadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteCourse}>
            <input type="hidden" name="id" value={course.id} />
            <Button type="submit" variant="destructive" disabled={sessions.length > 0}>
              <Trash2 />
              Excluir treinamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
