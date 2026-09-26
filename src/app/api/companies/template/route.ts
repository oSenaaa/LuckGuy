import { NextResponse } from "next/server";
import { AdminAuthError, requireViewer } from "@/lib/permissions";
import { buildCompanyImportTemplate } from "@/lib/company-import";

export async function GET() {
  try {
    await requireViewer();
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw err;
  }

  const workbook = await buildCompanyImportTemplate();
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-empresas.xlsx"',
    },
  });
}
