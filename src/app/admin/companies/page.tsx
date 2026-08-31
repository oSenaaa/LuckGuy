import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { createCompany } from "./actions";

export default async function CompaniesPage() {
  const list = await getDb().select().from(companies).orderBy(desc(companies.createdAt));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold">Empresas clientes</h1>

      <form action={createCompany} className="mt-4 flex flex-col gap-3 rounded border p-4">
        <input name="name" required placeholder="Nome da empresa" className="rounded border px-3 py-2" />
        <input name="cnpj" placeholder="CNPJ (opcional)" className="rounded border px-3 py-2" />
        <input name="contactEmail" placeholder="E-mail de contato (opcional)" className="rounded border px-3 py-2" />
        <input name="contactPhone" placeholder="Telefone de contato (opcional)" className="rounded border px-3 py-2" />
        <button type="submit" className="self-start rounded bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark">
          Adicionar empresa
        </button>
      </form>

      <ul className="mt-6 divide-y">
        {list.map((company) => (
          <li key={company.id} className="py-2 text-sm">
            <span className="font-medium">{company.name}</span>
            {company.cnpj && <span className="ml-2 text-gray-500">{company.cnpj}</span>}
          </li>
        ))}
        {list.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhuma empresa cadastrada.</li>}
      </ul>
    </div>
  );
}
