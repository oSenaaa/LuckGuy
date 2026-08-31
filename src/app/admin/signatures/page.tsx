import { desc } from "drizzle-orm";
import { PenLine } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { setDefaultSignature } from "./actions";
import { SignatureUploadForm } from "./signature-upload-form";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

      <SignatureUploadForm />

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
