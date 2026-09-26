"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { CourseFormSheet } from "./course-form-sheet";
import { CourseList, type Course } from "./course-list";

type Signature = {
  id: string;
  coordinatorName: string;
  coordinatorRole: string | null;
  isDefault: boolean;
};

export function CoursesView({
  courses,
  signatures,
  canEdit,
}: {
  courses: Course[];
  signatures: Signature[];
  canEdit: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treinamentos"
        description="Catálogo de treinamentos NR disponíveis para montar turmas."
      >
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Novo treinamento
          </Button>
        )}
      </PageHeader>

      <CourseList
        courses={courses}
        canEdit={canEdit}
        onCreateClick={() => setCreateOpen(true)}
      />

      {canEdit && (
        <CourseFormSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          signatures={signatures}
        />
      )}
    </div>
  );
}
