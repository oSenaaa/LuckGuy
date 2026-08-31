import { eq } from "drizzle-orm";
import { CheckCircle2, FileText, XCircle } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificates } from "@/lib/db/schema";
import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const db = getDb();
  const [certificate] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.verificationCode, codigo))
    .limit(1);

  if (!certificate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <StatusCard
          icon={XCircle}
          tone="destructive"
          title="Certificado não encontrado"
          description="Verifique se o código foi digitado corretamente."
        />
      </div>
    );
  }

  const isValid = !certificate.revokedAt;
  const rows = [
    { label: "Nome", value: certificate.participantNameSnapshot },
    { label: "Treinamento", value: certificate.courseNameSnapshot },
    { label: "Carga horária", value: `${Number(certificate.workloadHoursSnapshot)}h` },
    {
      label: "Emitido em",
      value: new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
        certificate.issuedAt,
      ),
    },
    { label: "Código", value: certificate.verificationCode },
  ];

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center border-b text-center">
          <span
            className={`flex size-12 items-center justify-center rounded-full ${
              isValid
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="size-6" />
            ) : (
              <XCircle className="size-6" />
            )}
          </span>
          <CardTitle className="text-lg">
            {isValid ? "Certificado válido" : "Certificado revogado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>

          {!isValid && certificate.revokedReason && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Motivo: {certificate.revokedReason}
            </p>
          )}

          {isValid && (
            <Button asChild className="w-full">
              <a
                href={certificate.pdfBlobUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileText />
                Ver PDF do certificado
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
