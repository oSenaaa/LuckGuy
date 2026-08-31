import { LiderLogo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-muted bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
        <LiderLogo variant="mark" size="sm" />
        <p>
          © {new Date().getFullYear()} LÍDER Treinamentos — Treinamentos em Normas
          Regulamentadoras (NR).
        </p>
      </div>
    </footer>
  );
}
