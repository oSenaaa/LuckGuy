"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { createCourse, updateCourse } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DurationInput } from "@/components/admin/duration-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Signature = {
  id: string;
  coordinatorName: string;
  coordinatorRole: string | null;
  isDefault: boolean;
};

type Course = {
  id: string;
  name: string;
  nrCode: string | null;
  description: string | null;
  defaultDurationMinutes: number | null;
  isActive: boolean;
};

export function CourseFormSheet({
  open,
  onOpenChange,
  course,
  signatures,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  signatures: Signature[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(course);
  const idPrefix = course?.id ?? "new";

  const durationUnit =
    course?.defaultDurationMinutes && course.defaultDurationMinutes < 60 ? "minutes" : "hours";
  const durationValue = course?.defaultDurationMinutes
    ? durationUnit === "minutes"
      ? course.defaultDurationMinutes
      : course.defaultDurationMinutes / 60
    : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const result = course
        ? await updateCourse(course.id, formData)
        : await createCourse(formData);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success(isEdit ? "Treinamento atualizado." : "Treinamento adicionado.");
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setError(null);
          onOpenChange(next);
        }
      }}
    >
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Editar ${course?.name}` : "Novo treinamento"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "O vídeo e o instrutor deste treinamento são configurados na página de detalhes."
              : "Após criar, você poderá enviar o vídeo e definir o instrutor na página de detalhes."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="course-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
            <Input
              id={`${idPrefix}-name`}
              name="name"
              required
              placeholder="Ex: NR-01 - Disposições Gerais"
              defaultValue={course?.name}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-nrCode`}>Código da NR</Label>
            <Input
              id={`${idPrefix}-nrCode`}
              name="nrCode"
              placeholder="Ex: NR-01"
              defaultValue={course?.nrCode ?? ""}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label>Duração padrão</Label>
            <DurationInput
              valueName="defaultDurationValue"
              unitName="defaultDurationUnit"
              defaultUnit={durationUnit}
              defaultValue={durationValue}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-description`}>Descrição</Label>
            <Textarea
              id={`${idPrefix}-description`}
              name="description"
              placeholder="Breve descrição do conteúdo (opcional)"
              defaultValue={course?.description ?? ""}
              disabled={pending}
            />
          </div>

          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="coordinatorSignatureId">Instrutor (assinatura no certificado)</Label>
              <NativeSelect id="coordinatorSignatureId" name="coordinatorSignatureId" defaultValue="">
                <option value="">Usar assinatura padrão automaticamente</option>
                {signatures.map((signature) => (
                  <option key={signature.id} value={signature.id}>
                    {signature.coordinatorName}
                    {signature.coordinatorRole ? ` — ${signature.coordinatorRole}` : ""}
                    {signature.isDefault ? " (padrão)" : ""}
                  </option>
                ))}
              </NativeSelect>
              {signatures.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma assinatura cadastrada ainda. Cadastre uma em{" "}
                  <Link href="/admin/signatures" className="underline underline-offset-4">
                    Assinaturas
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox id="isActive" name="isActive" value="on" defaultChecked={course?.isActive} />
              <Label htmlFor="isActive" className="font-normal">
                Disponível para criar novas turmas
              </Label>
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
          <SheetClose asChild>
            <Button type="button" variant="ghost" disabled={pending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button type="submit" form="course-form" disabled={pending}>
            {pending && <CircleNotch size={16} className="animate-spin" />}
            {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar treinamento"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
