import { desc } from "drizzle-orm";
import { Building2 } from "lucide-react";

import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { createCompany } from "./actions";
import { PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
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
            Apenas o nome é obrigatório. Os demais campos são opcionais.
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
              <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">E-mail de contato</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="contato@empresa.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Telefone de contato</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="(00) 00000-0000" />
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
            <ul className="divide-y divide-border">
              {list.map((company) => (
                <li
                  key={company.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3"
                >
                  <span className="font-medium">{company.name}</span>
                  {company.cnpj && (
                    <span className="text-xs text-muted-foreground">
                      {company.cnpj}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
