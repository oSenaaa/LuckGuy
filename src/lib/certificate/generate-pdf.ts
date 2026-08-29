import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export type CertificateData = {
  participantName: string;
  courseName: string;
  workloadHours: number;
  issuedAt: Date;
  verificationCode: string;
};

export type TextPosition = { x: number; y: number; size?: number; maxWidth?: number };

export type TextPositions = {
  participantName: TextPosition;
  courseName: TextPosition;
  workloadHours: TextPosition;
  issuedAt: TextPosition;
  verificationCode: TextPosition;
};

export const DEFAULT_TEXT_POSITIONS: TextPositions = {
  participantName: { x: 421, y: 380, size: 28, maxWidth: 640 },
  courseName: { x: 421, y: 330, size: 16, maxWidth: 640 },
  workloadHours: { x: 421, y: 300, size: 12 },
  issuedAt: { x: 421, y: 280, size: 12 },
  verificationCode: { x: 421, y: 40, size: 9 },
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

  page.drawText(text, {
    x: pos.x - width / 2,
    y: pos.y,
    size,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
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
  drawCentered(page, data.courseName, positions.courseName, regularFont);
  drawCentered(page, `Carga horária: ${data.workloadHours}h`, positions.workloadHours, regularFont);
  drawCentered(page, formatDate(data.issuedAt), positions.issuedAt, regularFont);
  drawCentered(page, `Código de validação: ${data.verificationCode}`, positions.verificationCode, regularFont);

  if (signatureImageBytes) {
    const sigImage = await embedImageAnyFormat(pdfDoc, signatureImageBytes);
    const sigDims = sigImage.scale(0.3);
    page.drawImage(sigImage, {
      x: width / 2 - sigDims.width / 2,
      y: 90,
      width: sigDims.width,
      height: sigDims.height,
    });
  }

  return pdfDoc.save();
}
