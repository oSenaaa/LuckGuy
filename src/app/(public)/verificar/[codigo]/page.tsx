import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificates } from "@/lib/db/schema";

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
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Certificado não encontrado</h1>
        <p className="mt-2 text-sm text-gray-600">
          Verifique se o código foi digitado corretamente.
        </p>
      </main>
    );
  }

  const isValid = !certificate.revokedAt;

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">
        {isValid ? "Certificado válido" : "Certificado revogado"}
      </h1>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Nome</dt>
          <dd className="font-medium">{certificate.participantNameSnapshot}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Treinamento</dt>
          <dd className="font-medium">{certificate.courseNameSnapshot}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Carga horária</dt>
          <dd className="font-medium">{Number(certificate.workloadHoursSnapshot)}h</dd>
        </div>
        <div>
          <dt className="text-gray-500">Emitido em</dt>
          <dd className="font-medium">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(certificate.issuedAt)}
          </dd>
        </div>
      </dl>
      {isValid && (
        <a
          href={certificate.pdfBlobUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
        >
          Ver PDF
        </a>
      )}
      {!isValid && certificate.revokedReason && (
        <p className="mt-4 text-sm text-red-600">Motivo: {certificate.revokedReason}</p>
      )}
    </main>
  );
}
