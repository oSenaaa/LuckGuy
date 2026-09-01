import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { certificates, courseSessions, courses, viewingProgress } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";
import { VideoPlayer } from "./video-player";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = getDb();
  const [session] = await db
    .select({
      id: courseSessions.id,
      videoProvider: courseSessions.videoProvider,
      videoBlobUrl: courseSessions.videoBlobUrl,
      videoYoutubeId: courseSessions.videoYoutubeId,
      minWatchPercent: courseSessions.minWatchPercent,
      courseName: courses.name,
      status: courseSessions.status,
      startsAt: courseSessions.startsAt,
      endsAt: courseSessions.endsAt,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.accessSlug, slug))
    .limit(1);

  const hasVideo =
    session && ((session.videoProvider === "blob" && session.videoBlobUrl) ||
      (session.videoProvider === "youtube" && session.videoYoutubeId));

  if (!session || session.status !== "published" || !hasVideo) {
    redirect(`/t/${slug}`);
  }

  const now = new Date();
  if ((session.startsAt && session.startsAt > now) || (session.endsAt && session.endsAt < now)) {
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{session.courseName}</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoPlayer
            courseSessionId={session.id}
            provider={session.videoProvider}
            videoUrl={session.videoBlobUrl}
            youtubeId={session.videoYoutubeId}
            minWatchPercent={session.minWatchPercent}
            initialWatchedPercent={progress ? Number(progress.watchedPercent) : 0}
            initialCompleted={Boolean(progress?.completedAt)}
            initialCertificateUrl={existingCertificate?.pdfBlobUrl ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
