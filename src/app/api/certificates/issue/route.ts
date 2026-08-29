import { NextRequest, NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant-session";
import { CertificateError, issueCertificate } from "@/lib/certificate/issue";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
