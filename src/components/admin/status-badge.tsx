import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-400",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-400",
  ended: "bg-red-500/15 text-red-400",
} as const;

export function StatusBadge({
  status,
  children,
}: {
  status: keyof typeof STATUS_STYLES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
