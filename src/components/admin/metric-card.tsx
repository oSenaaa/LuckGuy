import Link from "next/link";

export function MetricCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number;
  href?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      {href ? (
        <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
          Ver todos
        </Link>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
