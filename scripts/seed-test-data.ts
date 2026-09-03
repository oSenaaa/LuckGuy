import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { companies, courses, courseSessions, participants } from "../src/lib/db/schema";
import { generateAccessSlug } from "../src/lib/access-slug";

const YOUTUBE_VIDEO_ID = "b3qZg2EhIxQ";
const YOUTUBE_DURATION_SECONDS = 906; // #SextouComNR – NR-15 Atividades Insalubres

async function main() {
  const db = getDb();

  let [company] = await db.select().from(companies).where(eq(companies.name, "Empresa Teste Ltda")).limit(1);
  if (!company) {
    [company] = await db
      .insert(companies)
      .values({ name: "Empresa Teste Ltda", cnpj: null, contactEmail: null, contactPhone: null })
      .returning();
    console.log("Empresa criada:", company.id);
  } else {
    console.log("Empresa reaproveitada:", company.id);
  }

  let [course] = await db.select().from(courses).where(eq(courses.slug, "nr-15-teste")).limit(1);
  if (!course) {
    [course] = await db
      .insert(courses)
      .values({
        name: "NR-15 - Atividades Insalubres",
        slug: "nr-15-teste",
        nrCode: "NR-15",
        description: "Turma de teste para validação da plataforma.",
        defaultDurationMinutes: Math.round(YOUTUBE_DURATION_SECONDS / 60),
        videoProvider: "youtube",
        videoYoutubeId: YOUTUBE_VIDEO_ID,
        videoDurationSeconds: YOUTUBE_DURATION_SECONDS,
      })
      .returning();
    console.log("Treinamento criado:", course.id);
  } else {
    console.log("Treinamento reaproveitado:", course.id);
  }

  const accessSlug = generateAccessSlug();
  const [session] = await db
    .insert(courseSessions)
    .values({
      courseId: course.id,
      companyId: company.id,
      name: "NR-15 - Turma de Teste",
      workloadHours: (YOUTUBE_DURATION_SECONDS / 3600).toFixed(2),
      accessSlug,
      status: "published",
    })
    .returning();
  console.log("Turma criada:", session.id);

  const [participant] = await db
    .insert(participants)
    .values({
      courseSessionId: session.id,
      fullName: "Colaborador Teste",
      phone: "11999999999",
    })
    .returning();
  console.log("Participante fictício criado:", participant.id);

  console.log("\nLink público para teste:");
  console.log(`/t/${accessSlug}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
