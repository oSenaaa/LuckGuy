import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies, courses } from "@/lib/db/schema";
import { createSession } from "../actions";

export default async function NewSessionPage() {
  const db = getDb();
  const [courseList, companyList] = await Promise.all([
    db.select().from(courses).where(eq(courses.isActive, true)),
    db.select().from(companies),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-lg font-semibold">Nova turma</h1>

      <form action={createSession} className="mt-4 flex flex-col gap-3 rounded border p-4">
        <div>
          <label className="text-sm font-medium">Treinamento</label>
          <select name="courseId" required className="mt-1 w-full rounded border px-3 py-2">
            <option value="">Selecione</option>
            {courseList.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Empresa cliente</label>
          <select name="companyId" required className="mt-1 w-full rounded border px-3 py-2">
            <option value="">Selecione</option>
            {companyList.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Nome da turma</label>
          <input name="name" required placeholder="Ex: NR-01 - Agosto/2026 - Empresa X" className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm font-medium">Carga horária (horas)</label>
          <input name="workloadHours" type="number" min={0.5} step={0.5} required className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Início (opcional)</label>
            <input name="startsAt" type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Fim (opcional)</label>
            <input name="endsAt" type="datetime-local" className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <button type="submit" className="mt-2 self-start rounded bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark">
          Criar turma
        </button>
      </form>
    </div>
  );
}
