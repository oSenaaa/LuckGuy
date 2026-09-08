"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatWorkload } from "@/lib/workload";

type Course = {
  id: string;
  name: string;
  hasVideo: boolean;
  defaultDurationMinutes: number | null;
};

export function CourseAndDurationFields({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState("");
  const selectedCourse = courses.find((course) => course.id === courseId);

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="courseId">Treinamento</Label>
        <NativeSelect
          id="courseId"
          name="courseId"
          required
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
        >
          <option value="" disabled>
            Selecione um treinamento
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
              {!course.hasVideo ? " (sem vídeo)" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <Label>Carga horária</Label>
        {!selectedCourse ? (
          <p className="text-sm text-muted-foreground">
            Selecione um treinamento para ver a carga horária.
          </p>
        ) : selectedCourse.defaultDurationMinutes ? (
          <p className="rounded-lg border border-input bg-muted/40 px-2.5 py-1.5 text-sm">
            {formatWorkload(selectedCourse.defaultDurationMinutes / 60)}
          </p>
        ) : (
          <p className="text-sm text-destructive">
            Este treinamento não tem duração padrão cadastrada. Configure em Treinamentos
            antes de criar a turma.
          </p>
        )}
      </div>
    </>
  );
}
