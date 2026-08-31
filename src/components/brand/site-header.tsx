import Link from "next/link";
import { LiderLogo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-border-muted">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <LiderLogo variant="full" size="sm" href="/" />
        <Link
          href="/admin"
          className="text-sm font-medium text-brand transition-colors hover:text-brand-dark"
        >
          Área administrativa
        </Link>
      </div>
    </header>
  );
}
