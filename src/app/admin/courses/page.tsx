import { desc } from "drizzle-orm";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { getDb } from "@/lib/db";
import { certificateSignatures, courses } from "@/lib/db/schema";
import { createCourse } from "./actions";
import { CoursesList } from "./courses-list";
import { PageHeader } from "@/components/admin/page-header";
import { DurationInput } from "@/components/admin/duration-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentRole } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoursesPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  const db = getDb();
  const [list, signatureList] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.createdAt)),
    db.select().from(certificateSignatures).orderBy(desc(certificateSignatures.isDefault)),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Treinamentos"
        description="Catálogo de treinamentos NR disponíveis para montar turmas."
      />

      {canEdit && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Novo treinamento</CardTitle>
            <CardDescription>
              Selecione o instrutor responsável pela assinatura no certificado. Após criar,
              você poderá enviar o vídeo (arquivo ou link do YouTube). Ambos são usados
              automaticamente em todas as turmas deste treinamento.
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
                <Label>Duração padrão</Label>
                <DurationInput valueName="defaultDurationValue" unitName="defaultDurationUnit" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Breve descrição do conteúdo (opcional)"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="coordinatorSignatureId">Instrutor (assinatura no certificado)</Label>
                <NativeSelect id="coordinatorSignatureId" name="coordinatorSignatureId" defaultValue="">
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
                <SubmitButton pendingText="Adicionando…">
                  Adicionar treinamento
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CoursesList courses={list} />
      </Card>
    </div>
  );
}
