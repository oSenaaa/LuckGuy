"use client";

import { useState } from "react";
import { DotsThreeVertical, PencilSimple } from "@phosphor-icons/react";

import { CourseFormSheet } from "./course-form-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Course = {
  id: string;
  name: string;
  nrCode: string | null;
  description: string | null;
  defaultDurationMinutes: number | null;
  isActive: boolean;
};

export function CourseRowActions({ course }: { course: Course }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações do treinamento ${course.name}`}
          >
            <DotsThreeVertical size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilSimple size={16} />
            Editar dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CourseFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        course={course}
        signatures={[]}
      />
    </>
  );
}
