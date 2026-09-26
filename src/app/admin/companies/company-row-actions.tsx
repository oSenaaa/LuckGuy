"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowCounterClockwise,
  CircleNotch,
  DotsThreeVertical,
  PencilSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { archiveCompany, unarchiveCompany } from "./actions";
import { CompanyFormSheet } from "./company-form-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CompanyRowActionsProps = {
  id: string;
  name: string;
  cnpj: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isArchived: boolean;
};

export function CompanyRowActions({
  id,
  name,
  cnpj,
  contactEmail,
  contactPhone,
  isArchived,
}: CompanyRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Ações da empresa ${name}`}
          >
            {pending ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : (
              <DotsThreeVertical size={20} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilSimple size={16} />
            Editar dados
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => unarchiveCompany(id), "Empresa desarquivada.")
              }
            >
              <ArrowCounterClockwise size={16} />
              Desarquivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => run(() => archiveCompany(id), "Empresa arquivada.")}
            >
              <Archive size={16} />
              Arquivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CompanyFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        company={{ id, name, cnpj, contactEmail, contactPhone }}
      />
    </>
  );
}
