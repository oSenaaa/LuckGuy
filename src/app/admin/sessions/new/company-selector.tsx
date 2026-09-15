"use client";

import { useId, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { normalizeText } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Workplace = { id: string; name: string };
type Company = { id: string; name: string; workplaces: Workplace[] };
type PendingWorkplace = { key: string; companyId: string; name: string };

export function CompanySelector({ companies }: { companies: Company[] }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [excludedWorkplaceIds, setExcludedWorkplaceIds] = useState<Set<string>>(new Set());
  const [pendingWorkplaces, setPendingWorkplaces] = useState<PendingWorkplace[]>([]);
  const [newWorkplaceDrafts, setNewWorkplaceDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return companies;
    return companies.filter((company) => normalizeText(company.name).includes(term));
  }, [query, companies]);

  const selectedCompanies = useMemo(
    () => companies.filter((company) => selectedCompanyIds.has(company.id)),
    [companies, selectedCompanyIds],
  );

  function toggleCompany(companyId: string) {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
        setPendingWorkplaces((pending) => pending.filter((w) => w.companyId !== companyId));
      } else {
        next.add(companyId);
      }
      return next;
    });
  }

  function toggleWorkplace(workplaceId: string) {
    setExcludedWorkplaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(workplaceId)) next.delete(workplaceId);
      else next.add(workplaceId);
      return next;
    });
  }

  function addPendingWorkplace(companyId: string) {
    const name = (newWorkplaceDrafts[companyId] ?? "").trim();
    if (!name) return;
    setPendingWorkplaces((prev) => [
      ...prev,
      { key: crypto.randomUUID(), companyId, name },
    ]);
    setNewWorkplaceDrafts((prev) => ({ ...prev, [companyId]: "" }));
  }

  function removePendingWorkplace(key: string) {
    setPendingWorkplaces((prev) => prev.filter((w) => w.key !== key));
  }

  return (
    <div className="grid gap-3">
      {selectedCompanies.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selectedCompanies.map((company) => (
            <li key={company.id}>
              <input type="hidden" name="companyIds" value={company.id} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                {company.name}
                <button
                  type="button"
                  onClick={() => toggleCompany(company.id)}
                  aria-label={`Remover ${company.name}`}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          role="combobox"
          aria-controls={listId}
          autoComplete="off"
          placeholder="Buscar empresa para adicionar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-8"
        />
      </div>

      <div
        id={listId}
        className="max-h-40 overflow-auto rounded-lg border border-input"
      >
        {filtered.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
        ) : (
          filtered.map((company) => (
            <label
              key={company.id}
              className="flex cursor-pointer items-center gap-2 border-b border-border px-2.5 py-2 text-sm last:border-b-0 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedCompanyIds.has(company.id)}
                onCheckedChange={() => toggleCompany(company.id)}
              />
              {company.name}
            </label>
          ))
        )}
      </div>

      {selectedCompanies.map((company) => (
        <div key={company.id} className="rounded-lg border border-input p-3">
          <p className="text-sm font-medium">Postos de trabalho — {company.name}</p>
          <p className="text-xs text-muted-foreground">
            Deixe desmarcado o que não vale para esta turma.
          </p>
          <div className="mt-2 grid gap-1.5">
            {company.workplaces.map((workplace) => (
              <label key={workplace.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!excludedWorkplaceIds.has(workplace.id)}
                  onCheckedChange={() => toggleWorkplace(workplace.id)}
                />
                {!excludedWorkplaceIds.has(workplace.id) && (
                  <input type="hidden" name="workplaceIds" value={workplace.id} />
                )}
                {workplace.name}
              </label>
            ))}
            {pendingWorkplaces
              .filter((w) => w.companyId === company.id)
              .map((workplace) => (
                <div key={workplace.key} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="newWorkplaceCompanyId" value={workplace.companyId} />
                  <input type="hidden" name="newWorkplaceName" value={workplace.name} />
                  <Checkbox checked disabled />
                  {workplace.name}
                  <span className="text-xs text-muted-foreground">(novo)</span>
                  <button
                    type="button"
                    onClick={() => removePendingWorkplace(workplace.key)}
                    aria-label={`Remover posto ${workplace.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Label htmlFor={`new-workplace-${company.id}`} className="sr-only">
              Novo posto para {company.name}
            </Label>
            <Input
              id={`new-workplace-${company.id}`}
              value={newWorkplaceDrafts[company.id] ?? ""}
              onChange={(event) =>
                setNewWorkplaceDrafts((prev) => ({ ...prev, [company.id]: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPendingWorkplace(company.id);
                }
              }}
              placeholder="Novo posto de trabalho"
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addPendingWorkplace(company.id)}
            >
              <Plus />
              Adicionar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
