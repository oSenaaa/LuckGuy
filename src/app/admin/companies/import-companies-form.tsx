"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ImportReport = {
  createdCount: number;
  createdCompanies: {
    name: string;
    cnpj: string;
    workplaceCount: number;
    sourceRows: number[];
  }[];
  skipped: { rowNumber: number; reason: string }[];
};

export function ImportCompaniesForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const file = values.get("file");

    setError(null);
    setReport(null);

    if (!(file instanceof File) || file.size === 0) {
      setError("Selecione um arquivo .xlsx.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/companies/import", { method: "POST", body: values });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível importar a planilha.");
        return;
      }

      setReport(data);
      form.reset();
      if (data.createdCount > 0) {
        toast.success(
          `${data.createdCount} empresa${data.createdCount === 1 ? "" : "s"} importada${data.createdCount === 1 ? "" : "s"}.`,
        );
        router.refresh();
      }
    } catch {
      setError("Não foi possível importar a planilha. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Importar empresas via planilha</CardTitle>
        <CardDescription>
          Baixe o modelo, preencha uma linha por posto de trabalho (postos também podem ser
          separados por vírgula numa mesma célula) e envie o arquivo preenchido. Linhas com o
          mesmo CNPJ/CPF viram uma única empresa, com todos os postos vinculados a ela.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button asChild variant="outline" className="w-fit">
          <a href="/api/companies/template">
            <Download />
            Baixar modelo (.xlsx)
          </a>
        </Button>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-3 sm:flex sm:items-end sm:gap-2"
        >
          <div className="grid gap-2 sm:flex-1">
            <Label htmlFor="import-file">Planilha preenchida</Label>
            <Input id="import-file" name="file" type="file" accept=".xlsx" disabled={pending} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            {pending ? "Importando…" : "Importar"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {report && (
          <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">
              {report.createdCount} empresa{report.createdCount === 1 ? "" : "s"} importada
              {report.createdCount === 1 ? "" : "s"}.
            </p>
            {report.createdCompanies.some((c) => c.sourceRows.length > 1) && (
              <div>
                <p className="text-muted-foreground">Linhas combinadas na mesma empresa:</p>
                <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-muted-foreground">
                  {report.createdCompanies
                    .filter((c) => c.sourceRows.length > 1)
                    .map((c) => (
                      <li key={c.cnpj}>
                        {c.name}: linhas {c.sourceRows.join(", ")} ({c.workplaceCount} posto
                        {c.workplaceCount === 1 ? "" : "s"})
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {report.skipped.length > 0 && (
              <div>
                <p className="text-muted-foreground">
                  {report.skipped.length} linha{report.skipped.length === 1 ? "" : "s"} pulada
                  {report.skipped.length === 1 ? "" : "s"}:
                </p>
                <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-muted-foreground">
                  {report.skipped.map((item, index) => (
                    <li key={index}>
                      Linha {item.rowNumber}: {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
