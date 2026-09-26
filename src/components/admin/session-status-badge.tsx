import { StatusBadge } from "@/components/admin/status-badge";

const STATUS_MAP: Record<
  string,
  { status: "active" | "draft" | "ended"; label: string }
> = {
  draft: { status: "draft", label: "Rascunho" },
  published: { status: "active", label: "Publicada" },
  archived: { status: "ended", label: "Encerrada" },
};

export function SessionStatusBadge({ status }: { status: string }) {
  const item = STATUS_MAP[status] ?? { status: "draft" as const, label: status };
  return <StatusBadge status={item.status}>{item.label}</StatusBadge>;
}
