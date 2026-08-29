import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, courseSessions, courses } from "@/lib/db/schema";

export default async function AdminDashboard() {
  const recentSessions = await getDb()
    .select({
      id: courseSessions.id,
      name: courseSessions.name,
      status: courseSessions.status,
      courseName: courses.name,
      companyName: companies.name,
    })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .innerJoin(companies, eq(companies.id, courseSessions.companyId))
    .orderBy(desc(courseSessions.createdAt))
    .limit(5);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold">Painel</h1>

      <div className="mt-6 flex gap-3">
        <Link href="/admin/sessions/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          Nova turma
        </Link>
        <Link href="/admin/courses" className="rounded border px-4 py-2 text-sm">
          Treinamentos
        </Link>
        <Link href="/admin/companies" className="rounded border px-4 py-2 text-sm">
          Empresas
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-semibold">Turmas recentes</h2>
      <ul className="mt-2 divide-y">
        {recentSessions.map((session) => (
          <li key={session.id} className="py-2 text-sm">
            <Link href={`/admin/sessions/${session.id}`} className="underline">
              {session.name}
            </Link>
            <span className="ml-2 text-gray-500">
              {session.courseName} · {session.companyName} · {session.status}
            </span>
          </li>
        ))}
        {recentSessions.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhuma turma ainda.</li>}
      </ul>
    </div>
  );
}
