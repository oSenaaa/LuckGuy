import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LiderLogo } from "@/components/brand/logo";
import { AdminNavLink } from "@/components/brand/admin-nav-link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border-muted px-6 py-3">
        <div className="flex items-center gap-6">
          <LiderLogo variant="mark" size="sm" href="/admin" />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <AdminNavLink href="/admin">Painel</AdminNavLink>
            <AdminNavLink href="/admin/companies">Empresas</AdminNavLink>
            <AdminNavLink href="/admin/courses">Treinamentos</AdminNavLink>
            <AdminNavLink href="/admin/sessions">Turmas</AdminNavLink>
            <AdminNavLink href="/admin/templates">Modelo de certificado</AdminNavLink>
            <AdminNavLink href="/admin/signatures">Assinaturas</AdminNavLink>
          </nav>
        </div>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
