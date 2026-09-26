"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { setCourseSignature } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Signature = {
  id: string;
  coordinatorName: string;
  coordinatorRole: string | null;
  isDefault: boolean;
};

export function CourseSignatureForm({
  courseId,
  coordinatorSignatureId,
  signatureList,
}: {
  courseId: string;
  coordinatorSignatureId: string | null;
  signatureList: Signature[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await setCourseSignature(new FormData(event.currentTarget));
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível salvar o instrutor.");
        return;
      }
      toast.success("Instrutor atualizado.");
      router.refresh();
    } catch {
      toast.error("Não foi possível salvar o instrutor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={courseId} />
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="coordinatorSignatureId">Instrutor</Label>
        <NativeSelect
          id="coordinatorSignatureId"
          name="coordinatorSignatureId"
          defaultValue={coordinatorSignatureId ?? ""}
          disabled={pending}
        >
          <option value="">Usar assinatura padrão automaticamente</option>
          {signatureList.map((signature) => (
            <option key={signature.id} value={signature.id}>
              {signature.coordinatorName}
              {signature.coordinatorRole ? ` — ${signature.coordinatorRole}` : ""}
              {signature.isDefault ? " (padrão)" : ""}
            </option>
          ))}
        </NativeSelect>
        {signatureList.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma assinatura cadastrada ainda. Cadastre uma em{" "}
            <Link href="/admin/signatures" className="underline underline-offset-4">
              Assinaturas
            </Link>
            .
          </p>
        )}
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch size={16} className="animate-spin" />}
          {pending ? "Salvando…" : "Salvar instrutor"}
        </Button>
      </div>
    </form>
  );
}
