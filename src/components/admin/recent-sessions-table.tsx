import Link from "next/link";
import { ArrowSquareOut, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEAD_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

type SessionRow = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  courseName: string;
  companyName: string;
};

const STATUS_LABEL: Record<SessionRow["status"], { status: "active" | "draft" | "ended"; label: string }> = {
  draft: { status: "draft", label: "Rascunho" },
  published: { status: "active", label: "Publicada" },
  archived: { status: "ended", label: "Encerrada" },
};

export function RecentSessionsTable({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
        <UsersThree size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhuma turma criada ainda.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-3 sm:hidden">
        {sessions.map((session) => {
          const { status, label } = STATUS_LABEL[session.status] ?? {
            status: "draft" as const,
            label: session.status,
          };
          return (
            <li key={session.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/sessions/${session.id}`}
                  className="flex items-center gap-1.5 font-medium hover:underline"
                >
                  {session.name}
                  <ArrowSquareOut size={16} className="text-muted-foreground" />
                </Link>
                <StatusBadge status={status}>{label}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.courseName} · {session.companyName}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="hidden rounded-lg border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS}>Turma</TableHead>
              <TableHead className={HEAD_CLASS}>Curso / Empresa</TableHead>
              <TableHead className={HEAD_CLASS}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const { status, label } = STATUS_LABEL[session.status] ?? {
                status: "draft" as const,
                label: session.status,
              };
              return (
                <TableRow key={session.id}>
                  <TableCell>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="flex items-center gap-1.5 font-medium hover:underline"
                    >
                      {session.name}
                      <ArrowSquareOut size={16} className="text-muted-foreground" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.courseName} · {session.companyName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status}>{label}</StatusBadge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
