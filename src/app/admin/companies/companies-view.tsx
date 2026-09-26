"use client";

import { useState } from "react";
import { CaretDown, DownloadSimple, Plus, UploadSimple } from "@phosphor-icons/react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyFormSheet } from "./company-form-sheet";
import { CompanyImportDialog } from "./company-import-dialog";
import { CompanyList, type Company } from "./company-list";

export function CompaniesView({
  companies,
  canEdit,
}: {
  companies: Company[];
  canEdit: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas clientes"
        description="Cadastre as empresas que contratam os treinamentos."
      >
        {canEdit && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Importar
                  <CaretDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                  <UploadSimple size={16} />
                  Importar planilha
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/companies/template">
                    <DownloadSimple size={16} />
                    Baixar modelo
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Nova empresa
            </Button>
          </div>
        )}
      </PageHeader>

      <CompanyList
        companies={companies}
        canEdit={canEdit}
        onCreateClick={() => setCreateOpen(true)}
      />

      {canEdit && (
        <>
          <CompanyFormSheet open={createOpen} onOpenChange={setCreateOpen} />
          <CompanyImportDialog open={importOpen} onOpenChange={setImportOpen} />
        </>
      )}
    </div>
  );
}
