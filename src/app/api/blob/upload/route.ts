import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import {
  ADMIN_IMAGE_CONTENT_TYPES,
  SIGNATURE_IMAGE_MAX_SIZE_BYTES,
  TEMPLATE_IMAGE_MAX_SIZE_BYTES,
  VIDEO_CONTENT_TYPES,
  VIDEO_MAX_SIZE_BYTES,
  getVideoCourseIdFromUploadPath,
  isSignatureUploadPath,
  isTemplateUploadPath,
} from "@/lib/upload-rules";

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (isTemplateUploadPath(pathname)) {
          return {
            allowedContentTypes: [...ADMIN_IMAGE_CONTENT_TYPES],
            maximumSizeInBytes: TEMPLATE_IMAGE_MAX_SIZE_BYTES,
            addRandomSuffix: true,
            validUntil: Date.now() + TEN_MINUTES_IN_MS,
          };
        }

        if (isSignatureUploadPath(pathname)) {
          return {
            allowedContentTypes: [...ADMIN_IMAGE_CONTENT_TYPES],
            maximumSizeInBytes: SIGNATURE_IMAGE_MAX_SIZE_BYTES,
            addRandomSuffix: true,
            validUntil: Date.now() + TEN_MINUTES_IN_MS,
          };
        }

        const courseId = getVideoCourseIdFromUploadPath(pathname);
        if (courseId) {
          const [course] = await getDb()
            .select({ id: courses.id })
            .from(courses)
            .where(eq(courses.id, courseId))
            .limit(1);
          if (!course) throw new Error("Treinamento não encontrado.");

          return {
            allowedContentTypes: [...VIDEO_CONTENT_TYPES],
            maximumSizeInBytes: VIDEO_MAX_SIZE_BYTES,
            addRandomSuffix: true,
            validUntil: Date.now() + ONE_HOUR_IN_MS,
          };
        }

        throw new Error("Destino de upload inválido.");
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Falha ao autorizar upload para o Vercel Blob", error);
    return NextResponse.json(
      { error: "Não foi possível autorizar o upload." },
      { status: 400 },
    );
  }
}
