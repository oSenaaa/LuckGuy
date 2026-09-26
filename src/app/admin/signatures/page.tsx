import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { getCurrentRole } from "@/lib/permissions";
import { SignaturesView } from "./signatures-view";

export default async function SignaturesPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  const list = await getDb()
    .select()
    .from(certificateSignatures)
    .orderBy(desc(certificateSignatures.createdAt));

  const active = list.filter((signature) => !signature.archivedAt);
  const archived = list.filter((signature) => signature.archivedAt);

  return (
    <div className="w-full max-w-6xl">
      <SignaturesView active={active} archived={archived} canEdit={canEdit} />
    </div>
  );
}
