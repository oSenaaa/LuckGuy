import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificates, companies, courseSessions, courses, participants, viewingProgress } from "@/lib/db/schema";
import { archiveSession, publishSession, reissueCertificate } from "../actions";
import { VideoUpload } from "./video-upload";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const [session] = await db
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      accessSlug: courseSessions.accessSlug,
      workloadHours: courseSessions.workloadHours,
      videoBlobUrl: courseSessions.videoBlobUrl,
      minWatchPercent: courseSessions.minWatchPercent,
      courseName: courses.name,
      companyName: companies.name,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .innerJoin(companies, eq(companies.id, courseSessions.companyId))
    .where(eq(courseSessions.id, id))
    .limit(1);

  if (!session) {
    return <p className="text-sm text-gray-500">Turma não encontrada.</p>;
  }

  const participantsList = await db
    .select({
      id: participants.id,
      fullName: participants.fullName,
      phone: participants.phone,
      watchedPercent: viewingProgress.watchedPercent,
      completedAt: viewingProgress.completedAt,
      certificateUrl: certificates.pdfBlobUrl,
      certificateCode: certificates.verificationCode,
    })
    .from(participants)
    .leftJoin(viewingProgress, eq(viewingProgress.participantId, participants.id))
    .leftJoin(
      certificates,
      and(eq(certificates.participantId, participants.id), isNull(certificates.revokedAt)),
    )
    .where(eq(participants.courseSessionId, id));

  const publicUrl = `/t/${session.accessSlug}`;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold">{session.name}</h1>
      <p className="text-sm text-gray-500">
        {session.courseName} · {session.companyName} · {Number(session.workloadHours)}h · status: {session.status}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded bg-gray-100 px-3 py-1 text-sm">
          Link público: <code>{publicUrl}</code>
        </span>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Abrir
        </a>
        <a href={`/api/sessions/${id}/export`} className="text-sm underline">
          Exportar CSV
        </a>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <VideoUpload sessionId={session.id} />

        <div className="flex gap-3">
          {session.status !== "published" && (
            <form action={publishSession}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
                Publicar turma
              </button>
            </form>
          )}
          {session.status !== "archived" && (
            <form action={archiveSession}>
              <input type="hidden" name="id" value={session.id} />
              <button type="submit" className="rounded border px-4 py-2 text-sm">
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold">Participantes</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Nome</th>
            <th>Telefone</th>
            <th>% assistido</th>
            <th>Concluído</th>
            <th>Certificado</th>
          </tr>
        </thead>
        <tbody>
          {participantsList.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.fullName}</td>
              <td>{p.phone}</td>
              <td>{p.watchedPercent ? Number(p.watchedPercent).toFixed(0) : 0}%</td>
              <td>{p.completedAt ? "Sim" : "Não"}</td>
              <td>
                {p.certificateUrl ? (
                  <div className="flex items-center gap-2">
                    <Link href={p.certificateUrl} target="_blank" className="underline">
                      Baixar
                    </Link>
                    <form action={reissueCertificate}>
                      <input type="hidden" name="participantId" value={p.id} />
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button type="submit" className="text-xs underline">
                        Reemitir
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
          {participantsList.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-500">
                Nenhum participante ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
