"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Buildings, MagnifyingGlass, Plus } from "@phosphor-icons/react";

import { CompanyRowActions } from "./company-row-actions";
import { normalizeText } from "@/lib/text";
import { onlyDigits } from "@/lib/document";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
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
  { value: "active", label: "Ativas" },
  { value: "archived", label: "Arquivadas" },
] as const;

export type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  archivedAt: Date | null;
};

function EmptyState({
  title,
  canEdit,
  onCreateClick,
}: {
  title: string;
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Buildings size={32} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onCreateClick}>
          <Plus size={16} />
          Nova empresa
        </Button>
      )}
    </div>
  );
}

export function CompanyList({
  companies,
  canEdit,
  onCreateClick,
}: {
  companies: Company[];
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const filtered = useMemo(() => {
    const term = query.trim();
    const sorted = [...companies].sort((a, b) => {
      if (Boolean(a.archivedAt) === Boolean(b.archivedAt)) return 0;
      return a.archivedAt ? 1 : -1;
    });

    const statusFiltered = sorted.filter((company) => {
      if (statusFilter === "active") return !company.archivedAt;
      if (statusFilter === "archived") return Boolean(company.archivedAt);
      return true;
    });

    if (!term) return statusFiltered;

    const normalizedTerm = normalizeText(term);
    const digitsTerm = onlyDigits(term);

    return statusFiltered.filter((company) => {
      if (normalizeText(company.name).includes(normalizedTerm)) return true;
      if (digitsTerm && onlyDigits(company.cnpj ?? "").includes(digitsTerm)) return true;
      return false;
    });
  }, [companies, query, statusFilter]);

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
            placeholder="Buscar por nome ou CNPJ/CPF"
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
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            title="Nenhuma empresa cadastrada."
            canEdit={canEdit}
            onCreateClick={onCreateClick}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border">
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            Nenhuma empresa encontrada para esses filtros.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:hidden">
            {filtered.map((company) => (
              <li key={company.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="font-medium hover:underline"
                  >
                    {company.name}
                  </Link>
                  {canEdit && (
                    <CompanyRowActions
                      id={company.id}
                      name={company.name}
                      cnpj={company.cnpj}
                      contactEmail={company.contactEmail}
                      contactPhone={company.contactPhone}
                      isArchived={Boolean(company.archivedAt)}
                    />
                  )}
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">CNPJ/CPF</dt>
                    <dd className="tabular-nums">{company.cnpj ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Contato</dt>
                    <dd className="truncate">{company.contactEmail ?? company.contactPhone ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  {company.archivedAt ? (
                    <StatusBadge status="ended">Arquivada</StatusBadge>
                  ) : (
                    <StatusBadge status="active">Ativa</StatusBadge>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={HEAD_CLASS}>Nome</TableHead>
                  <TableHead className={HEAD_CLASS}>CNPJ/CPF</TableHead>
                  <TableHead className={HEAD_CLASS}>Contato</TableHead>
                  <TableHead className={HEAD_CLASS}>Status</TableHead>
                  <TableHead className={cn(HEAD_CLASS, "w-10")}>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="font-medium hover:underline"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {company.cnpj ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.contactEmail ?? company.contactPhone ?? "—"}
                    </TableCell>
                    <TableCell>
                      {company.archivedAt ? (
                        <StatusBadge status="ended">Arquivada</StatusBadge>
                      ) : (
                        <StatusBadge status="active">Ativa</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <CompanyRowActions
                          id={company.id}
                          name={company.name}
                          cnpj={company.cnpj}
                          contactEmail={company.contactEmail}
                          contactPhone={company.contactPhone}
                          isArchived={Boolean(company.archivedAt)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
