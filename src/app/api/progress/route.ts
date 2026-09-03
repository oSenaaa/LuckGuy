import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courses, courseSessions, viewingProgress } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";

const HEARTBEAT_INTERVAL_SECONDS = 10;
const MAX_PLAYBACK_RATE = 2;
const PLAYBACK_RATE_TOLERANCE = 0.1;
const INITIAL_ADVANCE_TOLERANCE_SECONDS = 1;
const MAX_CREDITABLE_GAP_SECONDS = 15;

function getMaxCreditableAdvanceSeconds(lastHeartbeatAt: Date | null | undefined, now: Date) {
  if (!lastHeartbeatAt) {
    return (
      Math.ceil(
        HEARTBEAT_INTERVAL_SECONDS * (MAX_PLAYBACK_RATE + PLAYBACK_RATE_TOLERANCE),
      ) +
      INITIAL_ADVANCE_TOLERANCE_SECONDS
    );
  }

  const elapsedSeconds = Math.max(0, (now.getTime() - lastHeartbeatAt.getTime()) / 1000);
  const creditableElapsedSeconds = Math.min(elapsedSeconds, MAX_CREDITABLE_GAP_SECONDS);

  return Math.floor(
    creditableElapsedSeconds * (MAX_PLAYBACK_RATE + PLAYBACK_RATE_TOLERANCE),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const courseSessionId = body?.courseSessionId;
  const currentTime = body?.currentTime;

  if (
    typeof courseSessionId !== "string" ||
    typeof currentTime !== "number" ||
    !Number.isFinite(currentTime)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const participantId = await getParticipantId(courseSessionId);
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [session] = await db
    .select({
      minWatchPercent: courseSessions.minWatchPercent,
      videoDurationSeconds: courses.videoDurationSeconds,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.id, courseSessionId))
    .limit(1);

  if (!session || !session.videoDurationSeconds) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(viewingProgress)
    .where(eq(viewingProgress.participantId, participantId))
    .limit(1);

  const now = new Date();
  const reportedCurrentTime = Math.max(
    0,
    Math.min(Math.floor(currentTime), session.videoDurationSeconds),
  );
  const previousMaxTime = existing?.maxTimeReachedSeconds ?? 0;
  const maxCreditableAdvance = getMaxCreditableAdvanceSeconds(existing?.lastHeartbeatAt, now);
  const maxAllowedTime = Math.min(
    session.videoDurationSeconds,
    previousMaxTime + maxCreditableAdvance,
  );
  const acceptedCurrentTime = Math.min(reportedCurrentTime, maxAllowedTime);
  const maxTime = Math.max(previousMaxTime, acceptedCurrentTime);
  const watchedPercent = Math.min(100, (maxTime / session.videoDurationSeconds) * 100);
  const alreadyCompleted = Boolean(existing?.completedAt);
  const justCompleted = !alreadyCompleted && watchedPercent >= session.minWatchPercent;

  let savedProgress;

  if (existing) {
    [savedProgress] = await db
      .update(viewingProgress)
      .set({
        currentTimeSeconds: sql<number>`CASE
          WHEN ${viewingProgress.lastHeartbeatAt} IS NULL
            OR ${viewingProgress.lastHeartbeatAt} <= ${now}
          THEN ${acceptedCurrentTime}
          ELSE ${viewingProgress.currentTimeSeconds}
        END`,
        maxTimeReachedSeconds: sql<number>`GREATEST(
          ${viewingProgress.maxTimeReachedSeconds},
          ${maxTime}
        )`,
        watchedPercent: sql<string>`GREATEST(
          ${viewingProgress.watchedPercent},
          ${watchedPercent.toFixed(2)}
        )`,
        lastHeartbeatAt: sql<Date>`CASE
          WHEN ${viewingProgress.lastHeartbeatAt} IS NULL
            OR ${viewingProgress.lastHeartbeatAt} <= ${now}
          THEN ${now}
          ELSE ${viewingProgress.lastHeartbeatAt}
        END`,
        completedAt: sql<Date | null>`COALESCE(
          ${viewingProgress.completedAt},
          ${justCompleted ? now : null}
        )`,
        updatedAt: sql<Date>`GREATEST(${viewingProgress.updatedAt}, ${now})`,
      })
      .where(eq(viewingProgress.id, existing.id))
      .returning({
        currentTimeSeconds: viewingProgress.currentTimeSeconds,
        watchedPercent: viewingProgress.watchedPercent,
        completedAt: viewingProgress.completedAt,
      });
  } else {
    [savedProgress] = await db
      .insert(viewingProgress)
      .values({
        participantId,
        currentTimeSeconds: acceptedCurrentTime,
        maxTimeReachedSeconds: maxTime,
        watchedPercent: watchedPercent.toFixed(2),
        lastHeartbeatAt: now,
        completedAt: justCompleted ? now : null,
      })
      .onConflictDoNothing({ target: viewingProgress.participantId })
      .returning({
        currentTimeSeconds: viewingProgress.currentTimeSeconds,
        watchedPercent: viewingProgress.watchedPercent,
        completedAt: viewingProgress.completedAt,
      });

    if (!savedProgress) {
      [savedProgress] = await db
        .select({
          currentTimeSeconds: viewingProgress.currentTimeSeconds,
          watchedPercent: viewingProgress.watchedPercent,
          completedAt: viewingProgress.completedAt,
        })
        .from(viewingProgress)
        .where(eq(viewingProgress.participantId, participantId))
        .limit(1);
    }
  }

  return NextResponse.json({
    acceptedCurrentTime: savedProgress?.currentTimeSeconds ?? acceptedCurrentTime,
    watchedPercent: savedProgress ? Number(savedProgress.watchedPercent) : watchedPercent,
    completed: Boolean(savedProgress?.completedAt) || alreadyCompleted || justCompleted,
  });
}
