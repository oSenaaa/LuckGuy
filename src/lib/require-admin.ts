import { auth } from "@clerk/nextjs/server";

/**
 * Acesso administrativo exige apenas sessão Clerk válida (`userId`) — toda conta
 * autenticada é tratada como admin. O produto é single-tenant (uso exclusivo da
 * equipe LÍDER, sem múltiplos clientes com o próprio painel), então não há
 * restrição por organização por enquanto.
 *
 * Para reativar o controle por organização (`ADMIN_ORG_ID` + papel `org:admin`)
 * quando for necessário separar por cliente, ver a implementação de referência
 * no commit 3708ad3 do histórico do git.
 *
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

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) throw new AdminAuthError("Não autenticado");

  return { userId };
}
