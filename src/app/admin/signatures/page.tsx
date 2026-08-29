import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { certificateSignatures } from "@/lib/db/schema";
import { createSignature, setDefaultSignature } from "./actions";

export default async function SignaturesPage() {
  const list = await getDb().select().from(certificateSignatures).orderBy(desc(certificateSignatures.createdAt));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold">Assinaturas do coordenador</h1>

      <form action={createSignature} className="mt-4 flex flex-col gap-3 rounded border p-4">
        <input name="coordinatorName" required placeholder="Nome do coordenador" className="rounded border px-3 py-2" />
        <input name="coordinatorRole" placeholder="Cargo (ex: Coordenador Técnico)" className="rounded border px-3 py-2" />
        <input name="signatureImage" type="file" accept="image/png,image/jpeg" required className="rounded border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="isDefault" type="checkbox" /> Usar como assinatura padrão
        </label>
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-sm text-white">
          Enviar assinatura
        </button>
      </form>

      <ul className="mt-6 divide-y">
        {list.map((signature) => (
          <li key={signature.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {signature.coordinatorName}
              {signature.coordinatorRole && <span className="text-gray-500"> — {signature.coordinatorRole}</span>}
              {signature.isDefault && <span className="ml-2 text-xs text-green-700">(padrão)</span>}
            </span>
            {!signature.isDefault && (
              <form action={setDefaultSignature}>
                <input type="hidden" name="id" value={signature.id} />
                <button type="submit" className="text-xs underline">
                  Tornar padrão
                </button>
              </form>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="py-2 text-sm text-gray-500">Nenhuma assinatura cadastrada.</li>}
      </ul>
    </div>
  );
}
