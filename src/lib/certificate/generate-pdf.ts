import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export type CertificateData = {
  participantName: string;
  courseName: string;
  workloadHours: number;
  issuedAt: Date;
  verificationCode: string;
};

export type RGB = [number, number, number];

export type TextPosition = {
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  color?: RGB;
  /** Paints over the placeholder sample text baked into the background image before drawing the real value. */
  cover?: { x: number; y: number; width: number; height: number; color?: RGB };
};

export type SignaturePosition = { x: number; y: number; width: number; maxHeight: number };

export type TextPositions = {
  participantName: TextPosition;
  courseName: TextPosition;
  workloadHours: TextPosition;
  workloadHoursInline: TextPosition;
  issuedAt: TextPosition;
  verificationCode: TextPosition;
  signature: SignaturePosition;
};

const BRAND_MAROON: RGB = [0.42, 0.1, 0.1];
const PAGE_BACKGROUND: RGB = [0.954, 0.954, 0.955];

/**
 * Calibrated against the current default template (2760x1952px, "ModeloCert"),
 * whose background image has sample placeholder text ("Seu Nome Completo",
 * "NOME DO CURSO", "XX", "00/00/0000") drawn where each field belongs.
 * A future template with different dimensions/layout needs its own
 * `certificateTemplates.textPositions` override.
 */
export const DEFAULT_TEXT_POSITIONS: TextPositions = {
  participantName: {
    x: 1384,
    y: 1012,
    size: 92,
    maxWidth: 1500,
    color: BRAND_MAROON,
    cover: { x: 790, y: 992, width: 1187, height: 177 },
  },
  courseName: {
    x: 1379,
    y: 787,
    size: 70,
    maxWidth: 1900,
    color: BRAND_MAROON,
    cover: { x: 992, y: 778, width: 774, height: 99 },
  },
  workloadHours: {
    x: 1424,
    y: 331,
    size: 30,
    maxWidth: 250,
    color: BRAND_MAROON,
    cover: { x: 1318, y: 322, width: 213, height: 56 },
  },
  workloadHoursInline: {
    x: 1562,
    y: 706,
    size: 40,
    maxWidth: 110,
    color: BRAND_MAROON,
    cover: { x: 1524, y: 700, width: 75, height: 58 },
  },
  issuedAt: {
    x: 830,
    y: 325,
    size: 34,
    maxWidth: 280,
    color: BRAND_MAROON,
    cover: { x: 701, y: 316, width: 257, height: 68 },
  },
  verificationCode: {
    x: 2450,
    y: 72,
    size: 18,
    maxWidth: 420,
    color: [0.45, 0.45, 0.45],
  },
  signature: { x: 1380, y: 205, width: 300, maxHeight: 88 },
};

function drawCentered(
  page: PDFPage,
  text: string,
  pos: TextPosition,
  font: PDFFont,
) {
  let size = pos.size ?? 14;
  let width = font.widthOfTextAtSize(text, size);

  if (pos.maxWidth && width > pos.maxWidth) {
    size = size * (pos.maxWidth / width);
    size = Math.max(size, 8);
    width = font.widthOfTextAtSize(text, size);
  }

  if (pos.cover) {
    // Cover at least the baked-in placeholder's footprint, but hug tightly
    // shrunk to the actual rendered text so short values don't leave a
    // visibly mismatched patch wider than the text itself.
    const pad = 14;
    const coverWidth = Math.max(pos.cover.width, width + pad * 2);
    const coverX = pos.x - coverWidth / 2;
    const [cr, cg, cb] = pos.cover.color ?? PAGE_BACKGROUND;
    page.drawRectangle({
      x: coverX,
      y: pos.cover.y,
      width: coverWidth,
      height: pos.cover.height,
      color: rgb(cr, cg, cb),
    });
  }

  const [r, g, b] = pos.color ?? [0.1, 0.1, 0.1];
  page.drawText(text, {
    x: pos.x - width / 2,
    y: pos.y,
    size,
    font,
    color: rgb(r, g, b),
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function embedImageAnyFormat(pdfDoc: PDFDocument, bytes: Uint8Array) {
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    return pdfDoc.embedJpg(bytes);
  }
}

export async function generateCertificatePdf({
  data,
  backgroundImageBytes,
  signatureImageBytes,
  positions = DEFAULT_TEXT_POSITIONS,
}: {
  data: CertificateData;
  backgroundImageBytes: Uint8Array;
  signatureImageBytes?: Uint8Array;
  positions?: TextPositions;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const bgImage = await embedImageAnyFormat(pdfDoc, backgroundImageBytes);
  const { width, height } = bgImage.scale(1);

  const page = pdfDoc.addPage([width, height]);
  page.drawImage(bgImage, { x: 0, y: 0, width, height });

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  drawCentered(page, data.participantName, positions.participantName, boldFont);
  drawCentered(page, data.courseName, positions.courseName, boldFont);
  drawCentered(page, `${data.workloadHours} HORAS`, positions.workloadHours, boldFont);
  drawCentered(page, String(data.workloadHours), positions.workloadHoursInline, regularFont);
  drawCentered(page, formatDate(data.issuedAt), positions.issuedAt, boldFont);
  drawCentered(page, `Código de validação: ${data.verificationCode}`, positions.verificationCode, regularFont);

  if (signatureImageBytes) {
    const sigImage = await embedImageAnyFormat(pdfDoc, signatureImageBytes);
    const natural = sigImage.scale(1);
    const sigPos = positions.signature;
    const scale = Math.min(sigPos.width / natural.width, sigPos.maxHeight / natural.height);
    const w = natural.width * scale;
    const h = natural.height * scale;
    page.drawImage(sigImage, {
      x: sigPos.x - w / 2,
      y: sigPos.y,
      width: w,
      height: h,
    });
  }

  return pdfDoc.save();
}
