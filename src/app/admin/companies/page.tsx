import { desc } from "drizzle-orm";
import { ArrowUpRight, Building2 } from "lucide-react";
import Link from "next/link";

import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { createCompany } from "./actions";
import { CompanyRowActions } from "./company-row-actions";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { DigitsInput } from "@/components/ui/digits-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CompaniesPage() {
  const list = await getDb()
    .select()
    .from(companies)
    .orderBy(desc(companies.createdAt));

  const active = list.filter((company) => !company.archivedAt);
  const archived = list.filter((company) => company.archivedAt);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        icon={Building2}
        title="Empresas clientes"
        description="Cadastre as empresas que contratam os treinamentos."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Nova empresa</CardTitle>
          <CardDescription>
            Nome, CNPJ (14 dígitos) e posto de trabalho são obrigatórios. Os demais campos são opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCompany} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Nome da empresa</Label>
              <Input id="name" name="name" required placeholder="Ex: Construtora Alfa Ltda" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <DigitsInput
                id="cnpj"
                name="cnpj"
                required
                maxDigits={14}
                pattern="\d{14}"
                title="Digite os 14 dígitos do CNPJ, sem pontuação"
                placeholder="Somente números (14 dígitos)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workplace">Posto de trabalho</Label>
              <Input
                id="workplace"
                name="workplace"
                required
                placeholder="Ex: Obra Alfa - Setor Administrativo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">E-mail de contato</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="contato@empresa.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Telefone de contato</Label>
              <DigitsInput
                id="contactPhone"
                name="contactPhone"
                maxDigits={11}
                pattern="\d{10,11}"
                title="Digite o telefone com DDD (10 ou 11 dígitos), sem pontuação"
                placeholder="Somente números, com DDD"
              />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Adicionando…">Adicionar empresa</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Empresas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma empresa cadastrada.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {active.map((company) => (
                  <li
                    key={company.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 transition-colors hover:text-foreground"
                    >
                      <span className="font-medium">{company.name}</span>
                      {company.cnpj && (
                        <span className="text-xs text-muted-foreground">
                          {company.cnpj}
                        </span>
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
                      isArchived={false}
                    />
                  </li>
                ))}
              </ul>

              {archived.length > 0 && (
                <details className="border-t">
                  <summary className="cursor-pointer px-4 py-3 text-sm text-muted-foreground select-none marker:text-muted-foreground">
                    Arquivadas ({archived.length})
                  </summary>
                  <ul className="divide-y divide-border border-t">
                    {archived.map((company) => (
                      <li
                        key={company.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-muted-foreground"
                      >
                        <Link
                          href={`/admin/companies/${company.id}`}
                          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 transition-colors hover:text-foreground"
                        >
                          <span className="font-medium">{company.name}</span>
                          {company.cnpj && (
                            <span className="text-xs">{company.cnpj}</span>
                          )}
                          <ArrowUpRight className="size-4" />
                        </Link>
                        <CompanyRowActions
                          id={company.id}
                          name={company.name}
                          cnpj={company.cnpj}
                          workplace={company.workplace}
                          contactEmail={company.contactEmail}
                          contactPhone={company.contactPhone}
                          isArchived
                        />
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
