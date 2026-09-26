import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isRole, ROLES, type Role } from "@/lib/roles";

export type { Role };
export { ROLES, ROLE_LABELS, isRole } from "@/lib/roles";

/**
 * Acesso administrativo do painel é regido por `publicMetadata.role` no Clerk (sem
 * tabela local de usuários). Lido via Backend API — não depende de custom session
 * claims configurados no Clerk Dashboard — e memoizado por request (React `cache`)
 * já que layout, página e Server Actions frequentemente leem o papel na mesma
 * renderização/submissão.
 *
 * `proxy.ts` já exige uma sessão Clerk válida para `/admin(.*)`; este módulo faz a
 * verificação de papel em profundidade, e cada Server Action / Route Handler que
 * muda dados DEVE chamar `requireEditor()` (ou `requireAdmin()` quando for restrito
 * a administradores).
 *
 * Importa exclusivamente de código de servidor (`@clerk/nextjs/server`) — por isso
 * `Role`/`ROLES`/`ROLE_LABELS`/`isRole`, que também são usados por Client Components,
 * vivem em `src/lib/roles.ts` (sem esse import), evitando puxar `server-only` para o
 * bundle do cliente.
 */
export const getCurrentRole = cache(async (): Promise<{ userId: string; role: Role } | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata.role;
  if (!isRole(role)) return null;

  return { userId, role };
});

export class AdminAuthError extends Error {
  constructor(message = "Acesso administrativo negado") {
    super(message);
    this.name = "AdminAuthError";
  }
}

async function requireRole(allowed: readonly Role[]) {
  const current = await getCurrentRole();
  if (!current) throw new AdminAuthError("Não autenticado");
  if (!allowed.includes(current.role)) throw new AdminAuthError("Permissão insuficiente");
  return current;
}

/** Qualquer papel com acesso ao painel (admin, editor ou visualizador). */
export function requireViewer() {
  return requireRole(ROLES);
}

/** Admin ou editor — necessário para qualquer mutação de dados do painel. */
export function requireEditor() {
  return requireRole(["admin", "editor"]);
}

/** Somente admin — gestão de usuários e outras ações restritas. */
export function requireAdmin() {
  return requireRole(["admin"]);
}
