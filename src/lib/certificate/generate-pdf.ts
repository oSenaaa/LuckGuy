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
  issuedAt: TextPosition;
  verificationCode: TextPosition;
  signature: SignaturePosition;
};

const BRAND_MAROON: RGB = [0.42, 0.1, 0.1];
const META_GRAY: RGB = [0.45, 0.45, 0.45];
const PAGE_BACKGROUND: RGB = [0.954, 0.954, 0.955];

/**
 * Calibrated against the current default template ("2026_2Semestre_V3",
 * 1492x1054px), which has blank underlines (no baked-in sample text) for
 * participant name, course name and workload hours, plus a signature line
 * above "LÍDER SAÚDE OCUPACIONAL / Instrutor Responsável".
 *
 * IMPORTANT: these are absolute pixel coordinates tied to THIS specific
 * background image's layout and dimensions. Uploading a differently sized
 * or laid-out template as the new default (as already happened once) will
 * misalign every field again — there's no admin UI yet to calibrate
 * `certificateTemplates.textPositions` per template, so this fallback is
 * all that's used in practice (see issue.ts).
 */
export const DEFAULT_TEXT_POSITIONS: TextPositions = {
  participantName: { x: 746, y: 534, size: 44, maxWidth: 850, color: BRAND_MAROON },
  courseName: { x: 741, y: 421, size: 34, maxWidth: 620, color: BRAND_MAROON },
  workloadHours: { x: 847, y: 367, size: 26, maxWidth: 200, color: BRAND_MAROON },
  issuedAt: { x: 1220, y: 79, size: 15, maxWidth: 420, color: META_GRAY },
  verificationCode: { x: 1220, y: 54, size: 13, maxWidth: 420, color: META_GRAY },
  signature: { x: 749, y: 134, width: 200, maxHeight: 90 },
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
  drawCentered(page, String(data.workloadHours), positions.workloadHours, regularFont);
  drawCentered(page, `Emitido em ${formatDate(data.issuedAt)}`, positions.issuedAt, regularFont);
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
