import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { courseSessions, courses } from "@/lib/db/schema";
import { getParticipantId } from "@/lib/participant-session";
import { identifyParticipant } from "./actions";

export default async function IdentifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = getDb();
  const [session] = await db
    .select({ id: courseSessions.id, status: courseSessions.status, courseName: courses.name })
    .from(courseSessions)
    .innerJoin(courses, eq(courses.id, courseSessions.courseId))
    .where(eq(courseSessions.accessSlug, slug))
    .limit(1);

  if (!session || session.status !== "published") {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Turma indisponível</h1>
        <p className="mt-2 text-sm text-gray-600">
          Este link não está mais ativo. Fale com a empresa responsável pelo treinamento.
        </p>
      </main>
    );
  }

  const existingParticipantId = await getParticipantId(session.id);
  if (existingParticipantId) {
    redirect(`/t/${slug}/assistir`);
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    await identifyParticipant(slug, formData);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-xl font-semibold">{session.courseName}</h1>
      <p className="mt-1 text-sm text-gray-600">
        Informe seu nome completo e telefone para confirmar sua presença e assistir ao treinamento.
      </p>
      <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="fullName" className="text-sm font-medium">Nome completo</label>
          <input
            id="fullName"
            name="fullName"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Seu nome completo"
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
          <input
            id="phone"
            name="phone"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="(00) 00000-0000"
          />
        </div>
        <button type="submit" className="mt-2 rounded bg-black px-4 py-2 text-white">
          Confirmar presença e começar
        </button>
      </form>
    </main>
  );
}
