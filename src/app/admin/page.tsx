import Link from "next/link";
import { count, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { certificates, companies, courses, courseSessions } from "@/lib/db/schema";
import { getCompanyNamesBySessionId } from "@/lib/sessions";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { RecentSessionsTable } from "@/components/admin/recent-sessions-table";

const RECENT_SESSIONS_LIMIT = 5;

export default async function AdminDashboard() {
  const db = getDb();

  const [
    [{ value: activeCompanies }],
    [{ value: activeCourses }],
    [{ value: publishedSessions }],
    [{ value: issuedCertificates }],
    recentSessionList,
  ] = await Promise.all([
    db.select({ value: count() }).from(companies).where(isNull(companies.archivedAt)),
    db.select({ value: count() }).from(courses).where(eq(courses.isActive, true)),
    db.select({ value: count() }).from(courseSessions).where(eq(courseSessions.status, "published")),
    db.select({ value: count() }).from(certificates),
    db
      .select({
        id: courseSessions.id,
        name: courseSessions.name,
        status: courseSessions.status,
        courseName: courses.name,
      })
      .from(courseSessions)
      .innerJoin(courses, eq(courses.id, courseSessions.courseId))
      .orderBy(desc(courseSessions.createdAt))
      .limit(RECENT_SESSIONS_LIMIT),
  ]);

  const companyNamesBySession = await getCompanyNamesBySessionId(
    recentSessionList.map((session) => session.id),
  );
  const recentSessions = recentSessionList.map((session) => ({
    ...session,
    companyName: companyNamesBySession.get(session.id) ?? "",
  }));

  return (
    <div className="w-full max-w-6xl space-y-6">
      <PageHeader title="Painel" description="Visão geral das turmas e indicadores da plataforma." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Empresas ativas" value={Number(activeCompanies)} href="/admin/companies" />
        <MetricCard label="Treinamentos ativos" value={Number(activeCourses)} href="/admin/courses" />
        <MetricCard label="Turmas publicadas" value={Number(publishedSessions)} href="/admin/sessions" />
        <MetricCard label="Certificados emitidos" value={Number(issuedCertificates)} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Turmas recentes</h2>
          <Link href="/admin/sessions" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todas
          </Link>
        </div>
        <RecentSessionsTable sessions={recentSessions} />
      </div>
    </div>
  );
}
