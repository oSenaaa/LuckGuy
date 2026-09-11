import { and, eq, isNull } from "drizzle-orm";
import { put } from "@vercel/blob";
import { getDb } from "@/lib/db";
import {
  certificates,
  certificateSignatures,
  certificateTemplates,
  courses,
  courseSessions,
  participants,
  viewingProgress,
} from "@/lib/db/schema";
import { generateCertificatePdf, DEFAULT_TEXT_POSITIONS, TextPositions } from "./generate-pdf";
import { generateVerificationCode } from "./verification-code";
import { signCertificate } from "./signature";
import { resolveWorkloadHours } from "@/lib/workload";
import { getVerificationUrl } from "@/lib/site-url";

export class CertificateError extends Error {}

async function fetchImageBytes(url: string) {
  // Só imagens do Blob store configurado — evita SSRF a partir de uma URL
  // arbitrária persistida nas colunas de template/assinatura.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CertificateError("URL de imagem do certificado inválida");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) {
    throw new CertificateError("Imagem do certificado fora do armazenamento configurado");
  }

  const res = await fetch(url);
  if (!res.ok) throw new CertificateError(`Não foi possível carregar a imagem do certificado (${url})`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function issueCertificate(participantId: string, { reissue = false }: { reissue?: boolean } = {}) {
  const db = getDb();

  const [existingCert] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.participantId, participantId), isNull(certificates.revokedAt)))
    .limit(1);

  if (existingCert && !reissue) {
    return { pdfUrl: existingCert.pdfBlobUrl, verificationCode: existingCert.verificationCode };
  }
  if (reissue && !existingCert) {
    throw new CertificateError("Nenhum certificado emitido para reemitir");
  }

  const [progress] = await db
    .select()
    .from(viewingProgress)
    .where(eq(viewingProgress.participantId, participantId))
    .limit(1);

  if (!progress?.completedAt) {
    throw new CertificateError("Treinamento ainda não concluído");
  }

  const [participant] = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (!participant) throw new CertificateError("Participante não encontrado");

  const [session] = await db
    .select()
    .from(courseSessions)
    .where(eq(courseSessions.id, participant.courseSessionId))
    .limit(1);
  if (!session) throw new CertificateError("Turma não encontrada");

  // Emissão iniciada pelo participante: revalida o estado da turma (as páginas
  // RSC já checam, mas a rota /api/certificates/issue não). Reemissão é
  // acionada só pelo admin e pode ocorrer com a turma já arquivada.
  if (!reissue) {
    if (session.status !== "published") {
      throw new CertificateError("Esta turma não está disponível para emissão");
    }
    const now = new Date();
    if (session.startsAt && session.startsAt > now) {
      throw new CertificateError("Esta turma ainda não começou");
    }
    if (session.endsAt && session.endsAt < now) {
      throw new CertificateError("O prazo desta turma encerrou");
    }
  }

  const [course] = await db.select().from(courses).where(eq(courses.id, session.courseId)).limit(1);
  if (!course) throw new CertificateError("Curso não encontrado");

  const [template] = session.certificateTemplateId
    ? await db
        .select()
        .from(certificateTemplates)
        .where(
          and(
            eq(certificateTemplates.id, session.certificateTemplateId),
            isNull(certificateTemplates.archivedAt),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(certificateTemplates)
        .where(and(eq(certificateTemplates.isDefault, true), isNull(certificateTemplates.archivedAt)))
        .limit(1);
  if (!template) {
    throw new CertificateError(
      session.certificateTemplateId
        ? "O modelo de certificado da turma foi arquivado ou removido"
        : "Nenhum modelo de certificado configurado",
    );
  }

  let signature:
    | typeof certificateSignatures.$inferSelect
    | undefined;
  if (course.coordinatorSignatureId) {
    [signature] = await db
      .select()
      .from(certificateSignatures)
      .where(
        and(
          eq(certificateSignatures.id, course.coordinatorSignatureId),
          isNull(certificateSignatures.archivedAt),
        ),
      )
      .limit(1);
    if (!signature) {
      throw new CertificateError("A assinatura do coordenador foi arquivada ou removida");
    }
  } else {
    [signature] = await db
      .select()
      .from(certificateSignatures)
      .where(and(eq(certificateSignatures.isDefault, true), isNull(certificateSignatures.archivedAt)))
      .limit(1);
  }

  const [backgroundImageBytes, signatureImageBytes] = await Promise.all([
    fetchImageBytes(template.backgroundImageBlobUrl),
    signature ? fetchImageBytes(signature.signatureImageBlobUrl) : Promise.resolve(undefined),
  ]);

  const issuedAt = new Date();
  const workloadHours = resolveWorkloadHours(course.defaultDurationMinutes, Number(session.workloadHours));
  const workloadHoursSnapshot = workloadHours.toFixed(2);
  const positions = (template.textPositions as TextPositions | null) ?? DEFAULT_TEXT_POSITIONS;
  const verificationCode = existingCert?.verificationCode ?? generateVerificationCode();

  const contentHmac = signCertificate({
    verificationCode,
    participantName: participant.fullName,
    courseName: course.name,
    workloadHours: workloadHoursSnapshot,
    issuedAt,
  });

  const pdfBytes = await generateCertificatePdf({
    data: {
      participantName: participant.fullName,
      courseName: course.name,
      workloadHours,
      issuedAt,
      verificationCode,
      verificationUrl: getVerificationUrl(verificationCode),
      integrityTag: contentHmac.slice(0, 12),
    },
    backgroundImageBytes,
    signatureImageBytes,
    positions,
  });

  const blob = await put(`certificates/${verificationCode}.pdf`, new Blob([new Uint8Array(pdfBytes)]), {
    access: "public",
    addRandomSuffix: !existingCert,
    // Reissuing reuses the same deterministic pathname (no random suffix) so the
    // certificate's public URL stays stable across reissues; that requires an
    // explicit opt-in to overwrite, otherwise @vercel/blob rejects the second+ reissue.
    allowOverwrite: Boolean(existingCert),
  });

  const snapshotFields = {
    pdfBlobUrl: blob.url,
    issuedAt,
    participantNameSnapshot: participant.fullName,
    courseNameSnapshot: course.name,
    workloadHoursSnapshot,
    contentHmac,
    templateIdUsed: template.id,
    signatureIdUsed: signature?.id,
  };

  if (existingCert) {
    await db.update(certificates).set(snapshotFields).where(eq(certificates.id, existingCert.id));
  } else {
    await db.insert(certificates).values({
      participantId,
      courseSessionId: session.id,
      verificationCode,
      ...snapshotFields,
    });
  }

  return { pdfUrl: blob.url, verificationCode };
}
