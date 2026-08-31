import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { createCourse } from "./actions";

export default async function CoursesPage() {
  const list = await getDb().select().from(courses).orderBy(desc(courses.createdAt));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold">Treinamentos</h1>

      <form action={createCourse} className="mt-4 flex flex-col gap-3 rounded border p-4">
        <input name="name" required placeholder="Nome (ex: NR-01 - Disposições Gerais)" className="rounded border px-3 py-2" />
        <input name="nrCode" placeholder="Código da NR (ex: NR-01)" className="rounded border px-3 py-2" />
        <input
          name="defaultDurationMinutes"
          type="number"
          min={1}
          placeholder="Duração padrão em minutos"
          className="rounded border px-3 py-2"
        />
        <textarea name="description" placeholder="Descrição (opcional)" className="rounded border px-3 py-2" />
        <button type="submit" className="self-start rounded bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark">
          Adicionar treinamento
        </button>
      </form>

      <ul className="mt-6 divide-y">
        {list.map((course) => (
          <li key={course.id} className="py-2 text-sm">
            <span className="font-medium">{course.name}</span>
            {course.nrCode && <span className="ml-2 text-gray-500">{course.nrCode}</span>}
          </li>
        ))}
        {list.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhum treinamento cadastrado.</li>}
      </ul>
    </div>
  );
}
