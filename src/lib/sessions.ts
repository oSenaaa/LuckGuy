import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courseSessions } from "@/lib/db/schema";

/**
 * Published sessions whose end date has already passed get moved to
 * "archived" automatically. Called both lazily (on admin page loads, for
 * immediate feedback) and from the daily Vercel Cron job (so it also
 * happens even if nobody opens the admin panel that day).
 */
export async function archiveExpiredSessions() {
  await getDb()
    .update(courseSessions)
    .set({ status: "archived" })
    .where(and(eq(courseSessions.status, "published"), lt(courseSessions.endsAt, new Date())));
}
