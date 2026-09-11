import { auth } from "@clerk/nextjs/server";

/**
 * Acesso administrativo exige:
 *  - sessão Clerk válida (`userId`),
 *  - organização ativa igual a `ADMIN_ORG_ID` (a org da LÍDER Saúde), e
 *  - papel `org:admin` nessa organização.
 *
 * Falha fechada: se `ADMIN_ORG_ID` não estiver configurado, ninguém é admin.
 * O `proxy.ts` faz a mesma verificação como defesa em profundidade, mas cada
 * Server Action / Route Handler que muda dados DEVE chamar `requireAdmin()`
 * porque o proxy pode ser contornado por refator de rota (ver docs do Next
 * sobre Proxy + Server Functions).
 */
export class AdminAuthError extends Error {
  constructor(message = "Acesso administrativo negado") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export const ADMIN_ORG_ID = process.env.ADMIN_ORG_ID;

export async function requireAdmin() {
  const { userId, orgId, has } = await auth();

  if (!userId) throw new AdminAuthError("Não autenticado");
  if (!ADMIN_ORG_ID) {
    throw new AdminAuthError(
      "ADMIN_ORG_ID não configurado — acesso administrativo bloqueado.",
    );
  }
  if (orgId !== ADMIN_ORG_ID) throw new AdminAuthError("Organização não autorizada");
  if (!has({ role: "org:admin" })) throw new AdminAuthError("Papel insuficiente");

  return { userId, orgId };
}
