import { NextRequest, NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant-session";
import { CertificateError, issueCertificate } from "@/lib/certificate/issue";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = await rateLimit("cert-issue", clientIp(request.headers), {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const courseSessionId = body?.courseSessionId;
  if (typeof courseSessionId !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const participantId = await getParticipantId(courseSessionId);
  if (!participantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await issueCertificate(participantId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CertificateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
