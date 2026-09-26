"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, UsersThree } from "@phosphor-icons/react";

import { normalizeText } from "@/lib/text";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEAD_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicada" },
  { value: "archived", label: "Encerrada" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function formatSessionDate(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt && !endsAt) return "A definir";
  if (startsAt && endsAt) {
    const start = dateFormatter.format(startsAt);
    const end = dateFormatter.format(endsAt);
    return start === end ? start : `${start} – ${end}`;
  }
  return dateFormatter.format(startsAt ?? endsAt!);
}

export type Company = {
  id: string;
  name: string;
};

export type Session = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  courseName: string;
  companies: Company[];
  startsAt: Date | null;
  endsAt: Date | null;
  participantCount: number;
};

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <UsersThree size={32} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

export function SessionList({
  sessions,
  companies,
}: {
  sessions: Session[];
  companies: Company[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());

    const sorted = [...sessions].sort((a, b) => {
      const aArchived = a.status === "archived";
      const bArchived = b.status === "archived";
      if (aArchived === bArchived) return 0;
      return aArchived ? 1 : -1;
    });

    return sorted.filter((session) => {
      if (statusFilter !== "all" && session.status !== statusFilter) return false;
      if (companyFilter !== "all" && !session.companies.some((company) => company.id === companyFilter)) {
        return false;
      }
      if (!term) return true;

      const companyNames = session.companies.map((company) => company.name).join(" ");
      return (
        normalizeText(session.name).includes(term) ||
        normalizeText(session.courseName).includes(term) ||
        normalizeText(companyNames).includes(term)
      );
    });
  }, [sessions, query, statusFilter, companyFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por turma, treinamento ou empresa"
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        {sessions.length === 0 ? (
          <EmptyState title="Nenhuma turma criada ainda." />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            Nenhuma turma encontrada para esses filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD_CLASS}>Turma</TableHead>
                <TableHead className={HEAD_CLASS}>Treinamento</TableHead>
                <TableHead className={HEAD_CLASS}>Empresa</TableHead>
                <TableHead className={HEAD_CLASS}>Data</TableHead>
                <TableHead className={HEAD_CLASS}>Participantes</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <Link
                      href={`/admin/sessions/${session.id}`}
                      className="font-medium hover:underline"
                    >
                      {session.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{session.courseName}</TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">
                    {session.companies.length > 0
                      ? session.companies.map((company) => company.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatSessionDate(session.startsAt, session.endsAt)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {session.participantCount}
                  </TableCell>
                  <TableCell>
                    <SessionStatusBadge status={session.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
