"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

import { CompanyRowActions } from "./company-row-actions";
import { normalizeText } from "@/lib/text";
import { onlyDigits } from "@/lib/document";
import { Input } from "@/components/ui/input";
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  workplace: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  archivedAt: Date | null;
};

function CompanyRow({ company }: { company: Company }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link
        href={`/admin/companies/${company.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 transition-colors hover:text-foreground"
      >
        <span className="font-medium">{company.name}</span>
        {company.cnpj && (
          <span className="text-xs text-muted-foreground">{company.cnpj}</span>
        )}
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </Link>
      <CompanyRowActions
        id={company.id}
        name={company.name}
        cnpj={company.cnpj}
        workplace={company.workplace}
        contactEmail={company.contactEmail}
        contactPhone={company.contactPhone}
        isArchived={Boolean(company.archivedAt)}
      />
    </li>
  );
}

export function CompanyList({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim();
    if (!term) return companies;

    const normalizedTerm = normalizeText(term);
    const digitsTerm = onlyDigits(term);

    return companies.filter((company) => {
      if (normalizeText(company.name).includes(normalizedTerm)) return true;
      if (normalizeText(company.workplace ?? "").includes(normalizedTerm)) return true;
      if (digitsTerm && onlyDigits(company.cnpj ?? "").includes(digitsTerm)) return true;
      return false;
    });
  }, [companies, query]);

  const active = filtered.filter((company) => !company.archivedAt);
  const archived = filtered.filter((company) => company.archivedAt);

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle>Empresas cadastradas</CardTitle>
        <CardAction className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, CNPJ/CPF ou posto"
              className="w-48 pl-8 sm:w-64"
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {companies.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma empresa cadastrada.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma empresa encontrada para essa busca.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {active.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </ul>

            {archived.length > 0 && (
              <details className="border-t">
                <summary className="cursor-pointer px-4 py-3 text-sm text-muted-foreground select-none marker:text-muted-foreground">
                  Arquivadas ({archived.length})
                </summary>
                <ul className="divide-y divide-border border-t text-muted-foreground">
                  {archived.map((company) => (
                    <CompanyRow key={company.id} company={company} />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </CardContent>
    </>
  );
}
