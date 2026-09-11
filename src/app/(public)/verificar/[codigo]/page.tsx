import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { CheckCircle2, FileText, XCircle } from "lucide-react";

import { getDb } from "@/lib/db";
import { certificates, certificateSignatures, viewingProgress } from "@/lib/db/schema";
import { verifyCertificate } from "@/lib/certificate/signature";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { formatWorkload } from "@/lib/workload";
import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const limited = await rateLimit("verify", clientIp(await headers()), {
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <StatusCard
          icon={XCircle}
          tone="destructive"
          title="Muitas consultas"
          description={`Aguarde ${limited.retryAfter}s e tente novamente.`}
        />
      </div>
    );
  }

  const db = getDb();
  const [certificate] = await db
    .select({
      participantNameSnapshot: certificates.participantNameSnapshot,
      courseNameSnapshot: certificates.courseNameSnapshot,
      workloadHoursSnapshot: certificates.workloadHoursSnapshot,
      issuedAt: certificates.issuedAt,
      verificationCode: certificates.verificationCode,
      pdfBlobUrl: certificates.pdfBlobUrl,
      contentHmac: certificates.contentHmac,
      revokedAt: certificates.revokedAt,
      revokedReason: certificates.revokedReason,
      instructorName: certificateSignatures.coordinatorName,
      completedAt: viewingProgress.completedAt,
    })
    .from(certificates)
    .leftJoin(certificateSignatures, eq(certificateSignatures.id, certificates.signatureIdUsed))
    .leftJoin(viewingProgress, eq(viewingProgress.participantId, certificates.participantId))
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

  const integrity = verifyCertificate(
    {
      verificationCode: certificate.verificationCode,
      participantName: certificate.participantNameSnapshot,
      courseName: certificate.courseNameSnapshot,
      workloadHours: certificate.workloadHoursSnapshot,
      issuedAt: certificate.issuedAt,
    },
    certificate.contentHmac,
  );

  const isValid = !certificate.revokedAt && integrity !== "tampered";
  const rows = [
    { label: "Nome", value: certificate.participantNameSnapshot },
    { label: "Treinamento", value: certificate.courseNameSnapshot },
    { label: "Carga horária", value: formatWorkload(Number(certificate.workloadHoursSnapshot)) },
    { label: "Instrutor responsável", value: certificate.instructorName ?? "—" },
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
            {integrity === "tampered"
              ? "Certificado adulterado"
              : isValid
                ? "Certificado válido"
                : "Certificado revogado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValid && (
            <p className="rounded-md bg-primary/5 px-3 py-2 text-sm text-foreground">
              <strong>{certificate.participantNameSnapshot}</strong> concluiu o treinamento{" "}
              <strong>&ldquo;{certificate.courseNameSnapshot}&rdquo;</strong>
              {certificate.instructorName && (
                <>
                  {" "}
                  pelo instrutor responsável <strong>{certificate.instructorName}</strong>
                </>
              )}
              {certificate.completedAt && (
                <>
                  , em <strong>{dateTimeFormatter.format(certificate.completedAt)}</strong>
                </>
              )}
              .
            </p>
          )}

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

          {integrity === "tampered" && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Os dados deste certificado não conferem com a assinatura de integridade
              registrada na emissão. Não aceite este documento.
            </p>
          )}
          {integrity === "valid" && (
            <p className="text-center text-xs text-muted-foreground">
              Integridade do conteúdo conferida.
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
