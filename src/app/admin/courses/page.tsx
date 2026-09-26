import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { certificateSignatures, courses } from "@/lib/db/schema";
import { CoursesView } from "./courses-view";
import { getCurrentRole } from "@/lib/permissions";

export default async function CoursesPage() {
  const current = await getCurrentRole();
  const canEdit = current?.role !== "viewer";

  const db = getDb();
  const [list, signatureList] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.createdAt)),
    db.select().from(certificateSignatures).orderBy(desc(certificateSignatures.isDefault)),
  ]);

  return (
    <div className="w-full max-w-6xl">
      <CoursesView courses={list} signatures={signatureList} canEdit={canEdit} />
    </div>
  );
}
