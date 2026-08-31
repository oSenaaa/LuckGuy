import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="rounded-full border border-border-muted bg-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-brand-gray">
        Treinamentos NR online
      </span>
      <h1 className="mt-6 text-3xl font-semibold text-brand sm:text-4xl">
        Plataforma de Treinamentos NR
      </h1>
      <p className="mt-4 text-sm text-foreground/70 sm:text-base">
        Acesse o treinamento pelo link enviado pela sua empresa, ou entre no{" "}
        <Link href="/admin" className="font-medium text-brand underline underline-offset-2">
          painel administrativo
        </Link>
        .
      </p>
    </section>
  );
}
