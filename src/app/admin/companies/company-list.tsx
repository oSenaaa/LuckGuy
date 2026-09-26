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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEAD_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

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
        <Button size="sm" onClick={onCreateClick}>
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

  const filtered = useMemo(() => {
    const term = query.trim();
    const sorted = [...companies].sort((a, b) => {
      if (Boolean(a.archivedAt) === Boolean(b.archivedAt)) return 0;
      return a.archivedAt ? 1 : -1;
    });
    if (!term) return sorted;

    const normalizedTerm = normalizeText(term);
    const digitsTerm = onlyDigits(term);

    return sorted.filter((company) => {
      if (normalizeText(company.name).includes(normalizedTerm)) return true;
      if (digitsTerm && onlyDigits(company.cnpj ?? "").includes(digitsTerm)) return true;
      return false;
    });
  }, [companies, query]);

  return (
    <div className="space-y-3">
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

      <div className="rounded-lg border border-border">
        {companies.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa cadastrada."
            canEdit={canEdit}
            onCreateClick={onCreateClick}
          />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            Nenhuma empresa encontrada para essa busca.
          </p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
