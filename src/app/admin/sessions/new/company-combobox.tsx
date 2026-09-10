"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { normalizeText } from "@/lib/text";

type Company = { id: string; name: string };

export function CompanyCombobox({ companies }: { companies: Company[] }) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return companies;
    return companies.filter((company) => normalizeText(company.name).includes(term));
  }, [query, companies]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCompany(company: Company) {
    setSelectedId(company.id);
    setQuery(company.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="companyId" value={selectedId} />
      <Input
        id="companyId"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        placeholder="Digite ou selecione a empresa"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          setOpen(true);
        }}
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-input bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <p className="px-2.5 py-1.5 text-sm text-muted-foreground">
              Nenhuma empresa encontrada.
            </p>
          ) : (
            filtered.map((company) => (
              <button
                key={company.id}
                type="button"
                role="option"
                aria-selected={company.id === selectedId}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => selectCompany(company)}
              >
                {company.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
