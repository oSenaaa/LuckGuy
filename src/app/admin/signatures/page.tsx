import { desc } from "drizzle-orm";
import { PenLine } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { createSignature, setDefaultSignature } from "./actions";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignaturesPage() {
  const list = await getDb()
    .select()
    .from(certificateSignatures)
    .orderBy(desc(certificateSignatures.createdAt));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={PenLine}
        title="Assinaturas do coordenador"
        description="Assinatura sobreposta no certificado emitido."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Nova assinatura</CardTitle>
          <CardDescription>
            Envie a imagem da assinatura em PNG ou JPEG, de preferência com fundo transparente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSignature} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="coordinatorName">Nome do coordenador</Label>
              <Input id="coordinatorName" name="coordinatorName" required placeholder="Ex: Maria Souza" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coordinatorRole">Cargo</Label>
              <Input
                id="coordinatorRole"
                name="coordinatorRole"
                placeholder="Ex: Coordenadora Técnica"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="signatureImage">Imagem da assinatura</Label>
              <Input
                id="signatureImage"
                name="signatureImage"
                type="file"
                accept="image/png,image/jpeg"
                required
              />
            </div>
            <Label className="flex items-center gap-2 font-normal sm:col-span-2">
              <Checkbox name="isDefault" value="on" />
              Usar como assinatura padrão
            </Label>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Enviando…">Enviar assinatura</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Assinaturas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma assinatura cadastrada.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((signature) => (
                <li
                  key={signature.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{signature.coordinatorName}</span>
                    {signature.coordinatorRole && (
                      <span className="text-xs text-muted-foreground">
                        — {signature.coordinatorRole}
                      </span>
                    )}
                    {signature.isDefault && <Badge variant="secondary">Padrão</Badge>}
                  </span>
                  {!signature.isDefault && (
                    <form action={setDefaultSignature}>
                      <input type="hidden" name="id" value={signature.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Tornar padrão
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
