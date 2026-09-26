"use client";

import { Plus, Signature as SignatureIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { SignatureCard } from "./signature-card";
import type { SignatureFormValue } from "./signature-form-dialog";

function EmptyState({
  canEdit,
  onCreateClick,
}: {
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
      <SignatureIcon size={32} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</p>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onCreateClick}>
          <Plus size={16} />
          Nova assinatura
        </Button>
      )}
    </div>
  );
}

export function SignatureList({
  active,
  archived,
  canEdit,
  onCreateClick,
}: {
  active: SignatureFormValue[];
  archived: SignatureFormValue[];
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  if (active.length === 0 && archived.length === 0) {
    return <EmptyState canEdit={canEdit} onCreateClick={onCreateClick} />;
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((signature) => (
            <SignatureCard
              key={signature.id}
              signature={signature}
              isArchived={false}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground select-none marker:text-muted-foreground">
            Arquivadas ({archived.length})
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((signature) => (
              <SignatureCard
                key={signature.id}
                signature={signature}
                isArchived
                canEdit={canEdit}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
