"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DurationInput } from "@/components/admin/duration-input";

type Course = {
  id: string;
  name: string;
  hasVideo: boolean;
  defaultDurationMinutes: number | null;
};

export function CourseAndDurationFields({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState("");
  const selectedCourse = courses.find((course) => course.id === courseId);

  const durationUnit =
    selectedCourse?.defaultDurationMinutes && selectedCourse.defaultDurationMinutes < 60
      ? "minutes"
      : "hours";
  const durationValue = selectedCourse?.defaultDurationMinutes
    ? durationUnit === "minutes"
      ? selectedCourse.defaultDurationMinutes
      : selectedCourse.defaultDurationMinutes / 60
    : undefined;

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
        <DurationInput
          key={courseId}
          valueName="workloadValue"
          unitName="workloadUnit"
          defaultUnit={durationUnit}
          defaultValue={durationValue}
          required
        />
        {selectedCourse && !selectedCourse.defaultDurationMinutes && (
          <p className="text-xs text-muted-foreground">
            Este treinamento não tem duração padrão cadastrada — informe manualmente.
          </p>
        )}
      </div>
    </>
  );
}
