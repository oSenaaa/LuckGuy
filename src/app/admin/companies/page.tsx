import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { CompaniesView } from "./companies-view";
import { getCurrentRole } from "@/lib/permissions";

export default async function CompaniesPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  const list = await getDb()
    .select()
    .from(companies)
    .orderBy(desc(companies.createdAt));

  return (
    <div className="w-full max-w-6xl">
      <CompaniesView companies={list} canEdit={canEdit} />
    </div>
  );
}
