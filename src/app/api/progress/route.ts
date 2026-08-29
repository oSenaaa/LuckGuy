import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions, viewingProgress } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const courseSessionId = body?.courseSessionId;
  const currentTime = body?.currentTime;

  if (typeof courseSessionId !== "string" || typeof currentTime !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const participantId = await getParticipantId(courseSessionId);
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [session] = await db
    .select()
    .from(courseSessions)
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

  const clampedCurrent = Math.max(0, Math.min(Math.floor(currentTime), session.videoDurationSeconds));
  const maxTime = Math.max(existing?.maxTimeReachedSeconds ?? 0, clampedCurrent);
  const watchedPercent = Math.min(100, (maxTime / session.videoDurationSeconds) * 100);
  const alreadyCompleted = Boolean(existing?.completedAt);
  const justCompleted = !alreadyCompleted && watchedPercent >= session.minWatchPercent;
  const now = new Date();

  if (existing) {
    await db
      .update(viewingProgress)
      .set({
        currentTimeSeconds: clampedCurrent,
        maxTimeReachedSeconds: maxTime,
        watchedPercent: watchedPercent.toFixed(2),
        lastHeartbeatAt: now,
        completedAt: justCompleted ? now : existing.completedAt,
        updatedAt: now,
      })
      .where(eq(viewingProgress.id, existing.id));
  } else {
    await db.insert(viewingProgress).values({
      participantId,
      currentTimeSeconds: clampedCurrent,
      maxTimeReachedSeconds: maxTime,
      watchedPercent: watchedPercent.toFixed(2),
      lastHeartbeatAt: now,
      completedAt: justCompleted ? now : null,
    });
  }

  return NextResponse.json({ watchedPercent, completed: alreadyCompleted || justCompleted });
}
