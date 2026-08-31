import { desc } from "drizzle-orm";
import { FileImage } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { createTemplate, setDefaultTemplate } from "./actions";
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

export default async function TemplatesPage() {
  const list = await getDb()
    .select()
    .from(certificateTemplates)
    .orderBy(desc(certificateTemplates.createdAt));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={FileImage}
        title="Modelo de certificado"
        description="Imagem de fundo padrão do certificado emitido aos participantes."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Novo modelo</CardTitle>
          <CardDescription>
            Envie a imagem de fundo (com a margem para assinatura já desenhada). Nome, treinamento,
            carga horária e código de validação são sobrepostos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTemplate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do modelo</Label>
              <Input id="name" name="name" required placeholder="Ex: Padrão 2026" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="backgroundImage">Imagem de fundo</Label>
              <Input
                id="backgroundImage"
                name="backgroundImage"
                type="file"
                accept="image/png,image/jpeg"
                required
              />
            </div>
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox name="isDefault" value="on" />
              Usar como modelo padrão
            </Label>
            <div>
              <SubmitButton pendingText="Enviando…">Enviar modelo</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Modelos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum modelo cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((template) => (
                <li
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {template.name}
                    {template.isDefault && <Badge variant="secondary">Padrão</Badge>}
                  </span>
                  {!template.isDefault && (
                    <form action={setDefaultTemplate}>
                      <input type="hidden" name="id" value={template.id} />
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
