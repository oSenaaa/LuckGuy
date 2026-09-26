"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CircleNotch,
  DotsThreeVertical,
  ShieldCheck,
  ShieldSlash,
  Trash,
  UserGear,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { deleteUser, restoreAccess, revokeAccess, updateUserRole } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  userName: string;
  role: Role | null;
  banned: boolean;
  isCurrentUser: boolean;
};

export function UserRowActions({ userId, userName, role, banned, isCurrentUser }: UserRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [rolePending, setRolePending] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

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
            {pending ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : (
              <DotsThreeVertical size={20} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setRoleOpen(true)}>
            <UserGear size={16} />
            Alterar permissão
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {banned ? (
            <DropdownMenuItem onSelect={() => run(() => restoreAccess(userId), "Acesso restaurado.")}>
              <ShieldCheck size={16} />
              Restaurar acesso
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={() => setRevokeOpen(true)}>
              <ShieldSlash size={16} />
              Revogar acesso
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash size={16} />
            Excluir usuário
          </DropdownMenuItem>
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
              <p role="alert" className="text-xs text-destructive">
                {roleError}
              </p>
            )}
            <div>
              <Button type="submit" disabled={rolePending}>
                {rolePending && <CircleNotch size={16} className="animate-spin" />}
                {rolePending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {userName} não vai conseguir mais entrar no painel até que o acesso seja restaurado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                await run(() => revokeAccess(userId), "Acesso revogado.");
                setRevokeOpen(false);
              }}
            >
              {pending && <CircleNotch size={16} className="animate-spin" />}
              Revogar acesso
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir {userName} apaga a conta permanentemente e não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                await run(() => deleteUser(userId), "Usuário excluído.");
                setDeleteOpen(false);
              }}
            >
              {pending && <CircleNotch size={16} className="animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
