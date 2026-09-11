import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const SEP = "\x1f"; // unit separator, improvável no conteúdo

function getSecret() {
  const secret = process.env.CERTIFICATE_SIGNING_SECRET;
  if (!secret) throw new Error("CERTIFICATE_SIGNING_SECRET não configurado");
  return secret;
}

export type CertificateSnapshot = {
  verificationCode: string;
  participantName: string;
  courseName: string;
  /** String já formatada como no banco (`numeric(5,2)` -> `toFixed(2)`). */
  workloadHours: string;
  issuedAt: Date;
};

function canonical(s: CertificateSnapshot) {
  // Data em segundos-epoch para não depender de precisão sub-segundo no
  // round-trip do banco.
  return [
    s.verificationCode,
    s.participantName,
    s.courseName,
    s.workloadHours,
    String(Math.floor(s.issuedAt.getTime() / 1000)),
  ].join(SEP);
}

export function signCertificate(s: CertificateSnapshot): string {
  return createHmac("sha256", getSecret()).update(canonical(s)).digest("hex");
}

export type CertificateIntegrity = "valid" | "tampered" | "unverifiable";

export function verifyCertificate(
  s: CertificateSnapshot,
  hmac: string | null | undefined,
): CertificateIntegrity {
  if (!hmac) return "unverifiable";

  let expected: string;
  try {
    expected = signCertificate(s);
  } catch {
    return "unverifiable";
  }

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hmac, "hex");
  if (a.length === 0 || a.length !== b.length) return "tampered";
  return timingSafeEqual(a, b) ? "valid" : "tampered";
}
