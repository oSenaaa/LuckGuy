"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { SessionList, type Company, type Session } from "./session-list";

export function SessionsView({
  sessions,
  companies,
  canEdit,
}: {
  sessions: Session[];
  companies: Company[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Turmas"
        description="Turmas de treinamento com link de acesso para os participantes."
      >
        {canEdit && (
          <Button asChild>
            <Link href="/admin/sessions/new">
              <Plus size={16} />
              Nova turma
            </Link>
          </Button>
        )}
      </PageHeader>

      <SessionList sessions={sessions} companies={companies} />
    </div>
  );
}
