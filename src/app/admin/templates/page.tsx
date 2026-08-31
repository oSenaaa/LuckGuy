import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { createTemplate, setDefaultTemplate } from "./actions";

export default async function TemplatesPage() {
  const list = await getDb().select().from(certificateTemplates).orderBy(desc(certificateTemplates.createdAt));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold">Modelo de certificado</h1>
      <p className="mt-1 text-sm text-gray-600">
        Envie a imagem de fundo padrão do certificado (com a margem para assinatura já desenhada). O nome do
        colaborador, treinamento, carga horária e código de validação são sobrepostos automaticamente.
      </p>

      <form action={createTemplate} className="mt-4 flex flex-col gap-3 rounded border p-4">
        <input name="name" required placeholder="Nome do modelo (ex: Padrão 2026)" className="rounded border px-3 py-2" />
        <input name="backgroundImage" type="file" accept="image/png,image/jpeg" required className="rounded border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="isDefault" type="checkbox" /> Usar como modelo padrão
        </label>
        <button type="submit" className="self-start rounded bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark">
          Enviar modelo
        </button>
      </form>

      <ul className="mt-6 divide-y">
        {list.map((template) => (
          <li key={template.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {template.name} {template.isDefault && <span className="ml-2 text-xs text-green-700">(padrão)</span>}
            </span>
            {!template.isDefault && (
              <form action={setDefaultTemplate}>
                <input type="hidden" name="id" value={template.id} />
                <button type="submit" className="text-xs underline">
                  Tornar padrão
                </button>
              </form>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhum modelo cadastrado.</li>}
      </ul>
    </div>
  );
}
