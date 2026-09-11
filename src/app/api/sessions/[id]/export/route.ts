import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificates, participants, viewingProgress } from "@/lib/db/schema";
import { AdminAuthError, requireAdmin } from "@/lib/require-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function csvEscape(value: string) {
  // Neutraliza formula/CSV injection: uma célula que começa com =, +, -, @, tab ou CR
  // é interpretada como fórmula pelo Excel/Sheets. Prefixa com apóstrofo.
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let adminId: string;
  try {
    ({ userId: adminId } = await requireAdmin());
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw err;
  }

  const limited = await rateLimit("csv-export", `${adminId}:${clientIp(request.headers)}`, {
    limit: 20,
    windowSeconds: 3600,
  });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Muitas exportações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const { id } = await params;
  const db = getDb();

  const rows = await db
    .select({
      fullName: participants.fullName,
      phone: participants.phone,
      watchedPercent: viewingProgress.watchedPercent,
      completedAt: viewingProgress.completedAt,
      certificateCode: certificates.verificationCode,
    })
    .from(participants)
    .leftJoin(viewingProgress, eq(viewingProgress.participantId, participants.id))
    .leftJoin(
      certificates,
      and(eq(certificates.participantId, participants.id), isNull(certificates.revokedAt)),
    )
    .where(eq(participants.courseSessionId, id));

  const header = ["Nome", "Telefone", "% assistido", "Concluído", "Código do certificado"];
  const lines = rows.map((row) =>
    [
      row.fullName,
      row.phone,
      row.watchedPercent ? Number(row.watchedPercent).toFixed(0) : "0",
      row.completedAt ? "Sim" : "Não",
      row.certificateCode ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="turma-${id}.csv"`,
    },
  });
}
