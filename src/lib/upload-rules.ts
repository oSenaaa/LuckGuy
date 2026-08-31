export const ADMIN_IMAGE_CONTENT_TYPES = ["image/png", "image/jpeg"] as const;
export const TEMPLATE_IMAGE_MAX_SIZE_BYTES = 20 * 1024 * 1024;
export const TEMPLATE_IMAGE_MAX_SIZE_LABEL = "20 MB";
export const SIGNATURE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const SIGNATURE_IMAGE_MAX_SIZE_LABEL = "5 MB";

export const VIDEO_CONTENT_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const VIDEO_MAX_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
export const VIDEO_MAX_DURATION_SECONDS = 24 * 60 * 60;

export const TEMPLATE_UPLOAD_PREFIX = "templates/";
export const SIGNATURE_UPLOAD_PREFIX = "signatures/";
export const VIDEO_UPLOAD_PREFIX = "videos/";

const SAFE_FILENAME_PATTERN = "[a-zA-Z0-9._-]{1,180}";
const UPLOAD_TIMESTAMP_PATTERN = "[0-9]{10,16}";
const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

const TEMPLATE_UPLOAD_PATH_PATTERN = new RegExp(
  `^${TEMPLATE_UPLOAD_PREFIX}${UPLOAD_TIMESTAMP_PATTERN}-${SAFE_FILENAME_PATTERN}$`,
);
const SIGNATURE_UPLOAD_PATH_PATTERN = new RegExp(
  `^${SIGNATURE_UPLOAD_PREFIX}${UPLOAD_TIMESTAMP_PATTERN}-${SAFE_FILENAME_PATTERN}$`,
);
const VIDEO_UPLOAD_PATH_PATTERN = new RegExp(
  `^${VIDEO_UPLOAD_PREFIX}(${UUID_PATTERN})/${UPLOAD_TIMESTAMP_PATTERN}-${SAFE_FILENAME_PATTERN}$`,
  "i",
);

export function isAdminImageContentType(contentType: string) {
  return ADMIN_IMAGE_CONTENT_TYPES.some((allowedType) => allowedType === contentType);
}

export function isVideoContentType(contentType: string) {
  return VIDEO_CONTENT_TYPES.some((allowedType) => allowedType === contentType);
}

export function isTemplateUploadPath(pathname: string) {
  return TEMPLATE_UPLOAD_PATH_PATTERN.test(pathname);
}

export function isSignatureUploadPath(pathname: string) {
  return SIGNATURE_UPLOAD_PATH_PATTERN.test(pathname);
}

export function getVideoSessionIdFromUploadPath(pathname: string) {
  return VIDEO_UPLOAD_PATH_PATTERN.exec(pathname)?.[1] ?? null;
}

export function sanitizeUploadFilename(filename: string) {
  const sanitized = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

  return sanitized || "arquivo";
}
