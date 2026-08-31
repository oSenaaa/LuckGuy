import { desc } from "drizzle-orm";
import { FileImage } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { setDefaultTemplate } from "./actions";
import { TemplateUploadForm } from "./template-upload-form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

      <TemplateUploadForm />

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
