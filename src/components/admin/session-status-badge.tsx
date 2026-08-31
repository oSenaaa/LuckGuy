import { Badge } from "@/components/ui/badge";

const MAP: Record<
  string,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  archived: { label: "Arquivada", variant: "outline" },
};

export function SessionStatusBadge({ status }: { status: string }) {
  const item = MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
