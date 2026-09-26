"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

import { inviteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function InviteUserForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await inviteUser(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Convite enviado.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      const message = "Não foi possível enviar o convite. Tente novamente.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_180px]">
          <div className="grid gap-2">
            <Label htmlFor="invite-name">Nome</Label>
            <Input
              id="invite-name"
              name="name"
              required
              placeholder="Nome completo"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="pessoa@empresa.com"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Permissão</Label>
            <NativeSelect id="invite-role" name="role" defaultValue="editor" required disabled={pending}>
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch size={16} className="animate-spin" />}
          {pending ? "Enviando…" : "Convidar"}
        </Button>
      </CardFooter>
    </form>
  );
}
