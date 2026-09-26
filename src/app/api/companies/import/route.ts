import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "@/lib/db";
import { companies, companyWorkplaces } from "@/lib/db/schema";
import { AdminAuthError, requireEditor } from "@/lib/permissions";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { parseCompanyImportWorkbook, type ParsedCompanyRow } from "@/lib/company-import";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;

export async function POST(request: Request) {
  let adminId: string;
  try {
    ({ userId: adminId } = await requireEditor());
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw err;
  }

  const limited = await rateLimit("company-import", `${adminId}:${clientIp(request.headers)}`, {
    limit: 10,
    windowSeconds: 3600,
  });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Muitas importações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const formData = await request.formData();
  const preview = formData.get("preview") === "true";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecione um arquivo .xlsx." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 2 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseCompanyImportWorkbook(buffer);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.rows.length === 0 && parsed.rowErrors.length === 0) {
    return NextResponse.json(
      { error: "A planilha não tem nenhuma linha preenchida." },
      { status: 400 },
    );
  }
  if (parsed.rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Envie no máximo ${MAX_ROWS} empresas por vez.` },
      { status: 400 },
    );
  }

  const db = getDb();
  const existingCompanies = await db.select({ cnpj: companies.cnpj }).from(companies);
  const existingDocuments = new Set(
    existingCompanies.map((c) => c.cnpj).filter((v): v is string => Boolean(v)),
  );

  const skipped: { rowNumber: number; reason: string }[] = parsed.rowErrors.map((e) => ({
    rowNumber: e.rowNumber,
    reason: e.reason,
  }));
  const toInsert: ParsedCompanyRow[] = [];

  for (const row of parsed.rows) {
    if (existingDocuments.has(row.document)) {
      const linesLabel =
        row.sourceRows.length > 1 ? ` (linhas ${row.sourceRows.join(", ")})` : "";
      skipped.push({
        rowNumber: row.rowNumber,
        reason: `CNPJ/CPF já cadastrado.${linesLabel}`,
      });
      continue;
    }
    toInsert.push(row);
  }

  let createdCount = 0;
  if (!preview && toInsert.length > 0) {
    const batch: BatchItem<"pg">[] = [];
    for (const row of toInsert) {
      const companyId = crypto.randomUUID();
      batch.push(
        db.insert(companies).values({
          id: companyId,
          name: row.name,
          cnpj: row.document,
          contactEmail: row.email,
          contactPhone: row.phone,
        }),
      );
      for (const workplaceName of row.workplaces) {
        batch.push(
          db.insert(companyWorkplaces).values({ companyId, name: workplaceName }),
        );
      }
    }
    await db.batch(batch as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    createdCount = toInsert.length;
  } else if (preview) {
    createdCount = toInsert.length;
  }

  if (!preview) revalidatePath("/admin/companies");

  return NextResponse.json({
    preview,
    createdCount,
    createdCompanies: toInsert.map((row) => ({
      name: row.name,
      cnpj: row.document,
      workplaceCount: row.workplaces.length,
      sourceRows: row.sourceRows,
    })),
    skipped: skipped.sort((a, b) => a.rowNumber - b.rowNumber),
  });
}
