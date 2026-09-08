import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import JSZip from "jszip";
import { getDb } from "@/lib/db";
import { certificates, participants } from "@/lib/db/schema";

function sanitizeFilename(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim();
  return clean || "certificado";
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
      pdfBlobUrl: certificates.pdfBlobUrl,
      verificationCode: certificates.verificationCode,
    })
    .from(certificates)
    .innerJoin(participants, eq(participants.id, certificates.participantId))
    .where(and(eq(participants.courseSessionId, id), isNull(certificates.revokedAt)));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Nenhum certificado emitido para esta turma ainda." },
      { status: 404 },
    );
  }

  const zip = new JSZip();

  await Promise.all(
    rows.map(async (row) => {
      const res = await fetch(row.pdfBlobUrl);
      if (!res.ok) return;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const filename = `${sanitizeFilename(row.fullName)}-${row.verificationCode}.pdf`;
      zip.file(filename, bytes);
    }),
  );

  const zipBytes = await zip.generateAsync({ type: "uint8array" });

  return new NextResponse(Buffer.from(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certificados-turma-${id}.zip"`,
    },
  });
}
