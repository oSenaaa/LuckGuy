"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { SignatureFormDialog, type SignatureFormValue } from "./signature-form-dialog";
import { SignatureList } from "./signature-list";

export function SignaturesView({
  active,
  archived,
  canEdit,
}: {
  active: SignatureFormValue[];
  archived: SignatureFormValue[];
  canEdit: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas do coordenador"
        description="Assinatura sobreposta no certificado emitido."
      >
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Nova assinatura
          </Button>
        )}
      </PageHeader>

      <SignatureList
        active={active}
        archived={archived}
        canEdit={canEdit}
        onCreateClick={() => setCreateOpen(true)}
      />

      {canEdit && (
        <SignatureFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
