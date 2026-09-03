import { desc } from "drizzle-orm";
import { ArrowUpRight, GraduationCap, Video, VideoOff } from "lucide-react";
import Link from "next/link";

import { getDb } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { createCourse } from "./actions";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoursesPage() {
  const list = await getDb()
    .select()
    .from(courses)
    .orderBy(desc(courses.createdAt));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Treinamentos"
        description="Catálogo de treinamentos NR disponíveis para montar turmas."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Novo treinamento</CardTitle>
          <CardDescription>
            Após criar, você poderá enviar o vídeo (arquivo ou link do YouTube) que será
            usado automaticamente em todas as turmas deste treinamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCourse} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: NR-01 - Disposições Gerais"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nrCode">Código da NR</Label>
              <Input id="nrCode" name="nrCode" placeholder="Ex: NR-01" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultDurationMinutes">Duração padrão (min)</Label>
              <Input
                id="defaultDurationMinutes"
                name="defaultDurationMinutes"
                type="number"
                min={1}
                placeholder="Ex: 120"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Breve descrição do conteúdo (opcional)"
              />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Adicionando…">
                Adicionar treinamento
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Treinamentos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum treinamento cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((course) => {
                const hasVideo =
                  (course.videoProvider === "blob" && course.videoBlobUrl) ||
                  (course.videoProvider === "youtube" && course.videoYoutubeId);
                return (
                  <li key={course.id}>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">{course.name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        {course.nrCode && (
                          <Badge variant="outline">{course.nrCode}</Badge>
                        )}
                        {!course.isActive && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                        {hasVideo ? (
                          <Video className="size-4 text-muted-foreground" />
                        ) : (
                          <VideoOff className="size-4 text-muted-foreground" />
                        )}
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
