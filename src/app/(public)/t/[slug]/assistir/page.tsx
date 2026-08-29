import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { certificates, courseSessions, courses, viewingProgress } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";
import { VideoPlayer } from "./video-player";

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = getDb();
  const [session] = await db
    .select({
      id: courseSessions.id,
      videoBlobUrl: courseSessions.videoBlobUrl,
      minWatchPercent: courseSessions.minWatchPercent,
      courseName: courses.name,
      status: courseSessions.status,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.accessSlug, slug))
    .limit(1);

  if (!session || session.status !== "published" || !session.videoBlobUrl) {
    redirect(`/t/${slug}`);
  }

  const participantId = await getParticipantId(session.id);
  if (!participantId) {
    redirect(`/t/${slug}`);
  }

  const [progress] = await db
    .select()
    .from(viewingProgress)
    .where(eq(viewingProgress.participantId, participantId))
    .limit(1);

  const [existingCertificate] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.participantId, participantId), isNull(certificates.revokedAt)))
    .limit(1);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">{session.courseName}</h1>
      <VideoPlayer
        courseSessionId={session.id}
        videoUrl={session.videoBlobUrl}
        minWatchPercent={session.minWatchPercent}
        initialWatchedPercent={progress ? Number(progress.watchedPercent) : 0}
        initialCompleted={Boolean(progress?.completedAt)}
        initialCertificateUrl={existingCertificate?.pdfBlobUrl ?? null}
      />
    </main>
  );
}
