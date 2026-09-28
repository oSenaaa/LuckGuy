/**
 * Perímetro de acesso à área administrativa: só e-mails do domínio da empresa
 * podem ter (ou receber) um papel — mais duas contas pessoais das fundadoras
 * do produto, mantidas como exceção explícita enquanto não migram para um
 * e-mail @lidersaude.com.br. Isso é verificado independentemente do papel
 * (`publicMetadata.role`) já atribuído no Clerk: mesmo que alguém tenha um
 * papel configurado manualmente por engano, um e-mail fora desta lista nunca
 * ganha acesso.
 */
const ALLOWED_EMAIL_DOMAIN = "lidersaude.com.br";

const ALLOWED_EXTRA_EMAILS = [
  "senalucas.santos21@gmail.com",
  "lucaspaznogueira840@gmail.com",
];

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) return true;
  return ALLOWED_EXTRA_EMAILS.includes(normalized);
}
