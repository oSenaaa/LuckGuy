import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";

export default async function SessionsPage() {
  const list = await getDb()
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      accessSlug: courseSessions.accessSlug,
      courseName: courses.name,
      companyName: companies.name,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .innerJoin(companies, eq(companies.id, courseSessions.companyId))
    .orderBy(desc(courseSessions.createdAt));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Turmas</h1>
        <Link href="/admin/sessions/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          Nova turma
        </Link>
      </div>

      <ul className="mt-6 divide-y">
        {list.map((session) => (
          <li key={session.id} className="py-3 text-sm">
            <Link href={`/admin/sessions/${session.id}`} className="font-medium underline">
              {session.name}
            </Link>
            <div className="text-gray-500">
              {session.courseName} · {session.companyName} · {session.status}
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhuma turma cadastrada.</li>}
      </ul>
    </div>
  );
}
