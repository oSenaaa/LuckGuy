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

export class CertificateError extends Error {}

async function fetchImageBytes(url: string) {
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

  const [course] = await db.select().from(courses).where(eq(courses.id, session.courseId)).limit(1);
  if (!course) throw new CertificateError("Curso não encontrado");

  const [template] = session.certificateTemplateId
    ? await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, session.certificateTemplateId)).limit(1)
    : await db.select().from(certificateTemplates).where(eq(certificateTemplates.isDefault, true)).limit(1);
  if (!template) throw new CertificateError("Nenhum modelo de certificado configurado");

  const [signature] = course.coordinatorSignatureId
    ? await db
        .select()
        .from(certificateSignatures)
        .where(eq(certificateSignatures.id, course.coordinatorSignatureId))
        .limit(1)
    : await db.select().from(certificateSignatures).where(eq(certificateSignatures.isDefault, true)).limit(1);

  const [backgroundImageBytes, signatureImageBytes] = await Promise.all([
    fetchImageBytes(template.backgroundImageBlobUrl),
    signature ? fetchImageBytes(signature.signatureImageBlobUrl) : Promise.resolve(undefined),
  ]);

  const issuedAt = new Date();
  const workloadHours = Number(session.workloadHours);
  const positions = (template.textPositions as TextPositions | null) ?? DEFAULT_TEXT_POSITIONS;
  const verificationCode = existingCert?.verificationCode ?? generateVerificationCode();

  const pdfBytes = await generateCertificatePdf({
    data: {
      participantName: participant.fullName,
      courseName: course.name,
      workloadHours,
      issuedAt,
      verificationCode,
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
    workloadHoursSnapshot: workloadHours.toFixed(2),
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
