"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MoreVertical, Search } from "lucide-react";

import { normalizeText } from "@/lib/text";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionRow = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  courseName: string;
  companyName: string;
};

function SessionTableRow({ session }: { session: SessionRow }) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/admin/sessions/${session.id}`}
          className="flex items-center gap-2 font-medium transition-colors hover:text-foreground"
        >
          {session.name}
          <ArrowUpRight className="size-3.5 text-muted-foreground" />
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {session.courseName} · {session.companyName}
      </TableCell>
      <TableCell>
        <SessionStatusBadge status={session.status} />
      </TableCell>
    </TableRow>
  );
}

export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return sessions;
    return sessions.filter(
      (session) =>
        normalizeText(session.name).includes(term) ||
        normalizeText(session.courseName).includes(term) ||
        normalizeText(session.companyName).includes(term),
    );
  }, [sessions, query]);

  const active = filtered.filter((session) => session.status !== "archived");
  const archived = filtered.filter((session) => session.status === "archived");

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle>Turmas</CardTitle>
        <CardAction className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por turma, curso ou empresa"
              className="w-48 pl-8 sm:w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Opções da tabela de turmas">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuCheckboxItem
                checked={showArchived}
                onCheckedChange={setShowArchived}
                onSelect={(event) => event.preventDefault()}
              >
                Mostrar arquivadas
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma turma ainda.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma turma encontrada para essa busca.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turma</TableHead>
                <TableHead>Curso / Empresa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((session) => (
                <SessionTableRow key={session.id} session={session} />
              ))}
              {showArchived && archived.length > 0 && (
                <>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="bg-muted/40 text-xs font-medium text-muted-foreground"
                    >
                      Arquivadas ({archived.length})
                    </TableCell>
                  </TableRow>
                  {archived.map((session) => (
                    <SessionTableRow key={session.id} session={session} />
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </>
  );
}
