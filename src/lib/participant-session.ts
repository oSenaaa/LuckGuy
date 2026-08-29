import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.PARTICIPANT_SESSION_SECRET;
  if (!secret) throw new Error("PARTICIPANT_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function cookieName(courseSessionId: string) {
  return `ps_${courseSessionId}`;
}

export async function createParticipantSession(courseSessionId: string, participantId: string) {
  const token = await new SignJWT({ participantId, courseSessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName(courseSessionId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getParticipantId(courseSessionId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(courseSessionId))?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.courseSessionId !== courseSessionId) return null;
    return typeof payload.participantId === "string" ? payload.participantId : null;
  } catch {
    return null;
  }
}
