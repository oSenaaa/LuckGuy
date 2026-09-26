"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreVertical, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { toast } from "sonner";

import { restoreAccess, revokeAccess, updateUserRole } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ROLE_LABELS, type Role } from "@/lib/roles";

type UserRowActionsProps = {
  userId: string;
  role: Role | null;
  banned: boolean;
  isCurrentUser: boolean;
};

export function UserRowActions({ userId, role, banned, isCurrentUser }: UserRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [rolePending, setRolePending] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  if (isCurrentUser) return null;

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, successMessage: string) {
    setPending(true);
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRolePending(true);
    setRoleError(null);
    try {
      const result = await updateUserRole(userId, new FormData(event.currentTarget));
      if (!result.ok) {
        setRoleError(result.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Permissão atualizada.");
      setRoleOpen(false);
      router.refresh();
    } catch {
      setRoleError("Não foi possível salvar. Tente novamente.");
    } finally {
      setRolePending(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Ações do usuário">
            {pending ? <Loader2 className="animate-spin" /> : <MoreVertical />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setRoleOpen(true)}>
            <UserCog />
            Alterar permissão
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {banned ? (
            <DropdownMenuItem onSelect={() => run(() => restoreAccess(userId), "Acesso restaurado.")}>
              <ShieldCheck />
              Restaurar acesso
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => run(() => revokeAccess(userId), "Acesso revogado.")}
            >
              <ShieldOff />
              Revogar acesso
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar permissão</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`role-${userId}`}>Nível de permissão</Label>
              <NativeSelect
                id={`role-${userId}`}
                name="role"
                defaultValue={role ?? "editor"}
                disabled={rolePending}
              >
                {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {roleError && (
              <p role="alert" className="text-sm text-destructive">
                {roleError}
              </p>
            )}
            <div>
              <Button type="submit" disabled={rolePending}>
                {rolePending && <Loader2 className="animate-spin" />}
                {rolePending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
