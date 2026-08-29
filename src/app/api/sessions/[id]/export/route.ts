import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { certificates, participants, viewingProgress } from "@/lib/db/schema";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
