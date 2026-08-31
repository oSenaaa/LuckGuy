import "server-only";

import { head, type HeadBlobResult } from "@vercel/blob";
import {
  VIDEO_CONTENT_TYPES,
  VIDEO_MAX_SIZE_BYTES,
  isAdminImageContentType,
  isVideoContentType,
} from "@/lib/upload-rules";

export class UploadedImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadedImageError";
  }
}

export async function verifyUploadedImage(
  url: string,
  expectedPrefix: string,
  maximumSizeInBytes: number,
  maximumSizeLabel: string,
): Promise<HeadBlobResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new UploadedImageError("A URL da imagem enviada é inválida.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    throw new UploadedImageError("A imagem não pertence ao armazenamento configurado.");
  }

  let blob: HeadBlobResult;
  try {
    // `head` usa o token do store e também impede que uma URL de outro Blob store
    // seja persistida diretamente por uma chamada forjada à Server Action.
    blob = await head(url);
  } catch {
    throw new UploadedImageError("Não foi possível confirmar a imagem enviada.");
  }

  if (!blob.pathname.startsWith(expectedPrefix)) {
    throw new UploadedImageError("A imagem foi enviada para um destino inválido.");
  }
  if (blob.size <= 0) {
    throw new UploadedImageError("A imagem enviada está vazia.");
  }
  if (!isAdminImageContentType(blob.contentType)) {
    throw new UploadedImageError("Use uma imagem PNG ou JPG.");
  }
  if (blob.size > maximumSizeInBytes) {
    throw new UploadedImageError(`A imagem excede o limite de ${maximumSizeLabel}.`);
  }

  await verifyImageSignature(blob.url, blob.contentType);

  return blob;
}

async function verifyImageSignature(url: string, contentType: string) {
  let bytes: Uint8Array;
  try {
    const response = await fetch(url, {
      headers: { Range: "bytes=0-15" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch {
    throw new UploadedImageError("Não foi possível ler a imagem enviada.");
  }

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isJpeg =
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  if (
    (contentType === "image/png" && !isPng) ||
    (contentType === "image/jpeg" && !isJpeg)
  ) {
    throw new UploadedImageError("O conteúdo do arquivo não corresponde a uma imagem PNG ou JPG válida.");
  }
}

export class UploadedVideoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadedVideoError";
  }
}

export async function verifyUploadedVideo(url: string, sessionId: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new UploadedVideoError("A URL do vídeo enviado é inválida.");
  }
  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    throw new UploadedVideoError("O vídeo não pertence ao armazenamento configurado.");
  }

  let blob: HeadBlobResult;
  try {
    blob = await head(url);
  } catch {
    throw new UploadedVideoError("Não foi possível confirmar o vídeo enviado.");
  }

  if (!blob.pathname.startsWith(`videos/${sessionId}/`)) {
    throw new UploadedVideoError("O vídeo foi enviado para uma turma diferente.");
  }
  if (blob.size <= 0 || blob.size > VIDEO_MAX_SIZE_BYTES) {
    throw new UploadedVideoError("O tamanho do vídeo enviado é inválido.");
  }
  if (!isVideoContentType(blob.contentType)) {
    throw new UploadedVideoError(
      `Use um vídeo em um dos formatos permitidos: ${VIDEO_CONTENT_TYPES.join(", ")}.`,
    );
  }

  return blob;
}
