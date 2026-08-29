import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/admin">Painel</Link>
          <Link href="/admin/companies">Empresas</Link>
          <Link href="/admin/courses">Treinamentos</Link>
          <Link href="/admin/sessions">Turmas</Link>
          <Link href="/admin/templates">Modelo de certificado</Link>
          <Link href="/admin/signatures">Assinaturas</Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
