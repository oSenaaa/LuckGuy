import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as respostas.
// CSP completa (script-src/style-src restritos) fica como follow-up: exige
// alinhar com o que o Clerk e o Next injetam inline. Por ora aplicamos o que
// não tem risco de quebrar carregamento de recursos: anti-clickjacking, HSTS,
// nosniff, referrer e permissions-policy.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

// Sem estes segredos a emissão do certificado e a sessão do aluno lançam em
// runtime (signCertificate / getSecret). Falhar o build de produção na Vercel
// mantém o deploy anterior no ar, em vez de publicar uma versão que devolve 500.
const requiredProductionEnv = ["CERTIFICATE_SIGNING_SECRET", "PARTICIPANT_SESSION_SECRET"];

if (process.env.VERCEL_ENV === "production") {
  const missing = requiredProductionEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes no build de produção: ${missing.join(", ")}`,
    );
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
