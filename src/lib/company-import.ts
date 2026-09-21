import ExcelJS from "exceljs";
import { isValidCpfCnpj, onlyDigits } from "@/lib/document";
import { DEFAULT_PHONE_COUNTRY, buildPhoneValue, parsePhoneValue } from "@/lib/phone";
import { normalizeText } from "@/lib/text";

type CompanyImportField = "name" | "document" | "email" | "phone" | "workplaces";

const COMPANY_IMPORT_COLUMNS: {
  field: CompanyImportField;
  label: string;
  aliases: string[];
}[] = [
  { field: "name", label: "Nome", aliases: ["nome", "nome da empresa", "empresa"] },
  {
    field: "document",
    label: "CNPJ ou CPF",
    aliases: ["cnpj ou cpf", "cnpj/cpf", "cnpj", "cpf"],
  },
  {
    field: "email",
    label: "E-mail de contato",
    aliases: ["e-mail de contato", "email de contato", "e-mail", "email"],
  },
  {
    field: "phone",
    label: "Telefone de contato",
    aliases: ["telefone de contato", "telefone", "contato telefone"],
  },
  {
    field: "workplaces",
    label: "Postos de trabalho",
    aliases: ["postos de trabalho", "postos", "posto de trabalho"],
  },
];

const REQUIRED_FIELDS: CompanyImportField[] = ["name", "document"];

export type ParsedCompanyRow = {
  rowNumber: number;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  workplaces: string[];
};

export type CompanyImportRowError = { rowNumber: number; reason: string };

export type CompanyImportParseResult =
  | { ok: true; rows: ParsedCompanyRow[]; rowErrors: CompanyImportRowError[] }
  | { ok: false; error: string };

export async function buildCompanyImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Empresas");

  sheet.addRow(COMPANY_IMPORT_COLUMNS.map((column) => column.label));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow([
    "Construtora Alfa Ltda",
    "12345678000195",
    "contato@construtoraalfa.com.br",
    "11999999999",
    "Obra Alfa - Setor Administrativo, Obra Beta",
  ]);

  sheet.columns = [
    { width: 32 },
    { width: 18 },
    { width: 30 },
    { width: 18 },
    { width: 45 },
  ];
  // Formato texto na coluna de documento evita que o Excel converta pra
  // número e apague um zero à esquerda do CNPJ/CPF.
  sheet.getColumn(2).numFmt = "@";

  return workbook;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object") {
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("").trim();
    }
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    return "";
  }
  return String(value).trim();
}

export async function parseCompanyImportWorkbook(
  buffer: Buffer,
): Promise<CompanyImportParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs declara seu próprio tipo `Buffer` ambiente (um stub mínimo,
    // já que não depende de @types/node), que não bate estruturalmente com
    // o Buffer real do Node nas versões atuais — só um conflito de tipos,
    // funciona normalmente em runtime.
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { ok: false, error: "Não foi possível ler o arquivo. Envie um .xlsx válido." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return { ok: false, error: "A planilha está vazia." };

  const columnIndexByField = new Map<CompanyImportField, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const normalized = normalizeText(cellText(cell.value));
    for (const column of COMPANY_IMPORT_COLUMNS) {
      if (column.aliases.some((alias) => normalizeText(alias) === normalized)) {
        columnIndexByField.set(column.field, colNumber);
      }
    }
  });

  const missingRequired = REQUIRED_FIELDS.filter((field) => !columnIndexByField.has(field));
  if (missingRequired.length > 0) {
    return {
      ok: false,
      error:
        "Planilha em formato inesperado. Baixe o modelo novamente e preencha sem alterar o cabeçalho.",
    };
  }

  const rows: ParsedCompanyRow[] = [];
  const rowErrors: CompanyImportRowError[] = [];

  function fieldText(row: ExcelJS.Row, field: CompanyImportField) {
    const colNumber = columnIndexByField.get(field);
    if (!colNumber) return "";
    return cellText(row.getCell(colNumber).value);
  }

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const name = fieldText(row, "name");
    const documentRaw = fieldText(row, "document");

    if (!name && !documentRaw) continue; // linha em branco

    if (!name) {
      rowErrors.push({ rowNumber, reason: "Nome não informado." });
      continue;
    }

    const document = onlyDigits(documentRaw);
    if (!isValidCpfCnpj(document)) {
      rowErrors.push({ rowNumber, reason: "CNPJ/CPF inválido." });
      continue;
    }

    const emailRaw = fieldText(row, "email");
    const phoneRaw = fieldText(row, "phone");
    const workplacesRaw = fieldText(row, "workplaces");

    let phone: string | null = null;
    if (phoneRaw) {
      const { dial, national } = parsePhoneValue(phoneRaw);
      const maxDigits = dial === DEFAULT_PHONE_COUNTRY.dial ? 11 : 15;
      if (!national || national.length > maxDigits) {
        rowErrors.push({ rowNumber, reason: "Telefone inválido." });
        continue;
      }
      phone = buildPhoneValue(dial, national) || null;
    }

    const workplaces = [
      ...new Set(
        workplacesRaw
          .split(/[,;]/)
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    ];

    rows.push({
      rowNumber,
      name,
      document,
      email: emailRaw || null,
      phone,
      workplaces,
    });
  }

  return { ok: true, rows, rowErrors };
}
