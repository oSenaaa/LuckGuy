import type { ComponentType } from "react";

export function PageHeader({
  title,
  description,
  badge,
  children,
}: {
  /** @deprecated Ícone decorativo não é mais exibido ao lado do título; prop mantida apenas para não quebrar chamadores ainda não refinados. */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Badge de status exibido ao lado do título (ex.: rascunho/publicada). */
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
