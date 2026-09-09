import { NextResponse } from "next/server";
import { archiveExpiredSessions } from "@/lib/sessions";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await archiveExpiredSessions();
  return NextResponse.json({ ok: true });
}
