"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { createSession } from "../actions";
import { CompanySelector, type Company } from "./company-selector";
import { CourseAndDurationFields, type Course } from "./course-and-duration-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSessionForm({
  courses,
  companies,
}: {
  courses: Course[];
  companies: Company[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createSession(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Turma criada.");
      router.push(`/admin/sessions/${result.sessionId}`);
    } catch {
      const message = "Não foi possível criar a turma. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
      <CourseAndDurationFields courses={courses} />

      <div className="grid gap-2">
        <Label>Empresas clientes</Label>
        <CompanySelector companies={companies} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Nome da turma</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Ex: NR-01 - Agosto/2026 - Empresa X"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startsAt">Início (opcional, horário de Brasília)</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" disabled={pending} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endsAt">Fim (opcional, horário de Brasília)</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" disabled={pending} />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch size={16} className="animate-spin" />}
          {pending ? "Criando…" : "Criar turma"}
        </Button>
      </div>
    </form>
  );
}
