import Link from "next/link";

import { LiderLogo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <LiderLogo variant="mark" size="sm" />
          <p className="text-xs">
            © {new Date().getFullYear()} LÍDER Treinamentos — Treinamentos em Normas
            Regulamentadoras (NR).
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href="/" className="transition-colors hover:text-foreground">
            Início
          </Link>
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Área administrativa
          </Link>
        </nav>
      </div>
    </footer>
  );
}
