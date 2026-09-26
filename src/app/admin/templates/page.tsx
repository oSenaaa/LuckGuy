import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { getCurrentRole } from "@/lib/permissions";
import { TemplatesView } from "./templates-view";

export default async function TemplatesPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  const list = await getDb()
    .select()
    .from(certificateTemplates)
    .orderBy(desc(certificateTemplates.createdAt));

  return (
    <div className="w-full max-w-6xl">
      <TemplatesView templates={list} canEdit={canEdit} />
    </div>
  );
}
