"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

type Step = "upload" | "preview" | "done";

function StepLabel({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
        {number}
      </span>
      {children}
    </div>
  );
}

export function CompanyImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  function reset() {
    setStep("upload");
    setFile(null);
    setPending(false);
    setError(null);
    setReport(null);
  }

  async function runImport(preview: boolean) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("preview", String(preview));
      const res = await fetch("/api/companies/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível importar a planilha.");
        return;
      }
      setReport(data);
      setStep(preview ? "preview" : "done");
      if (!preview && data.createdCount > 0) {
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

  function handleFileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo .xlsx.");
      return;
    }
    void runImport(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          onOpenChange(next);
          if (!next) reset();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar empresas via planilha</DialogTitle>
          <DialogDescription>
            Uma linha por posto de trabalho (ou vários postos separados por vírgula na mesma
            célula). Linhas com o mesmo CNPJ/CPF viram uma única empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <StepLabel number={1}>Baixar modelo</StepLabel>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <a href="/api/companies/template">
                <DownloadSimple size={16} />
                Baixar modelo (.xlsx)
              </a>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <StepLabel number={2}>Enviar arquivo preenchido</StepLabel>
            {step === "upload" ? (
              <form onSubmit={handleFileSubmit} className="flex flex-col gap-3">
                <Input
                  type="file"
                  accept=".xlsx"
                  disabled={pending}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {error && (
                  <p role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={pending} className="w-fit">
                  {pending && <CircleNotch size={16} className="animate-spin" />}
                  {pending ? "Analisando…" : "Analisar planilha"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">{file?.name}</p>
            )}
          </div>

          {(step === "preview" || step === "done") && report && (
            <div className="flex flex-col gap-2">
              <StepLabel number={3}>{step === "preview" ? "Revisar prévia" : "Confirmar"}</StepLabel>
              <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">
                  {report.createdCount} empresa{report.createdCount === 1 ? "" : "s"}{" "}
                  {step === "preview" ? "pronta" : "importada"}
                  {report.createdCount === 1 ? "" : "s"}
                  {step === "preview" ? " para importar" : ""}.
                </p>
                {report.createdCompanies.some((c) => c.sourceRows.length > 1) && (
                  <div>
                    <p className="text-muted-foreground">Linhas combinadas na mesma empresa:</p>
                    <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-muted-foreground">
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
                    <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-muted-foreground">
                      {report.skipped.map((item, index) => (
                        <li key={index}>
                          Linha {item.rowNumber}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button type="button" variant="ghost" disabled={pending} onClick={reset}>
                Voltar
              </Button>
              <Button
                type="button"
                disabled={pending || report?.createdCount === 0}
                onClick={() => void runImport(false)}
              >
                {pending && <CircleNotch size={16} className="animate-spin" />}
                {pending ? "Importando…" : "Confirmar importação"}
              </Button>
            </>
          )}
          {step === "done" && (
            <DialogClose asChild>
              <Button type="button">
                <UploadSimple size={16} />
                Concluir
              </Button>
            </DialogClose>
          )}
          {step === "upload" && (
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
