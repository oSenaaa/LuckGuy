function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) return `https://${productionUrl}`;

  const previewUrl = process.env.VERCEL_URL;
  if (previewUrl) return `https://${previewUrl}`;

  return "http://localhost:3000";
}

export function getVerificationUrl(verificationCode: string) {
  return `${resolveSiteUrl()}/verificar/${verificationCode}`;
}
