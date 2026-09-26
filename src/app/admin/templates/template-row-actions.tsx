"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowCounterClockwise,
  CircleNotch,
  DotsThreeVertical,
  Eye,
  Star,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import {
  archiveTemplate,
  setDefaultTemplate,
  unarchiveTemplate,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplatePreview } from "./template-preview-panel";

type TemplateRowActionsProps = {
  id: string;
  name: string;
  backgroundImageBlobUrl: string;
  isDefault: boolean;
  isArchived: boolean;
  canEdit: boolean;
  onPreview: (preview: TemplatePreview) => void;
};

export function TemplateRowActions({
  id,
  name,
  backgroundImageBlobUrl,
  isDefault,
  isArchived,
  canEdit,
  onPreview,
}: TemplateRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label={`Ações do modelo ${name}`}
        >
          {pending ? (
            <CircleNotch size={20} className="animate-spin" />
          ) : (
            <DotsThreeVertical size={20} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={() => onPreview({ name, url: backgroundImageBlobUrl })}
        >
          <Eye size={16} />
          Visualizar
        </DropdownMenuItem>

        {canEdit && <DropdownMenuSeparator />}

        {canEdit && !isArchived && !isDefault && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setDefaultTemplate(id), "Modelo definido como padrão.")
            }
          >
            <Star size={16} />
            Tornar padrão
          </DropdownMenuItem>
        )}

        {canEdit &&
          (isArchived ? (
            <DropdownMenuItem
              onSelect={() =>
                run(() => unarchiveTemplate(id), "Modelo desarquivado.")
              }
            >
              <ArrowCounterClockwise size={16} />
              Desarquivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isDefault}
              title={
                isDefault
                  ? "Torne outro modelo padrão antes de arquivar este."
                  : undefined
              }
              onSelect={() => run(() => archiveTemplate(id), "Modelo arquivado.")}
            >
              <Archive size={16} />
              Arquivar
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
