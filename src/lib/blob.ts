import { put } from "@vercel/blob";

export async function uploadPublicFile(pathname: string, file: Blob | File) {
  const blob = await put(pathname, file, { access: "public", addRandomSuffix: true });
  return blob.url;
}
