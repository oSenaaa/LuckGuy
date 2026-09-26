import { createClerkClient } from "@clerk/nextjs/server";
import { isRole } from "../src/lib/permissions";

/**
 * Migração única: antes desta feature, nenhuma conta Clerk tinha `publicMetadata.role`
 * e qualquer sessão válida era tratada como admin. Sem rodar isto antes do deploy do
 * gate de papel (src/app/admin/layout.tsx), todo mundo — inclusive quem já usa o
 * painel hoje — seria redirecionado para /sem-acesso.
 *
 * Uso: npx dotenv -e .env.local -- npx tsx scripts/backfill-admin-roles.ts
 */
const DEFAULT_ROLE = "admin" as const;

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY não definido no ambiente.");

  const client = createClerkClient({ secretKey });

  let processed = 0;
  let updated = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data: users, totalCount } = await client.users.getUserList({ limit, offset });
    if (users.length === 0) break;

    for (const user of users) {
      processed += 1;
      if (isRole(user.publicMetadata.role)) continue;

      await client.users.updateUserMetadata(user.id, {
        publicMetadata: { role: DEFAULT_ROLE },
      });
      updated += 1;
      console.log(
        `Papel "${DEFAULT_ROLE}" aplicado a ${user.primaryEmailAddress?.emailAddress ?? user.id}`,
      );
    }

    offset += users.length;
    if (offset >= totalCount) break;
  }

  console.log(`Concluído: ${updated}/${processed} usuário(s) atualizado(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
