"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  MagnifyingGlass,
  Plus,
  VideoCamera,
  VideoCameraSlash,
} from "@phosphor-icons/react";

import { CourseRowActions } from "./course-row-actions";
import { normalizeText } from "@/lib/text";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEAD_CLASS = "text-xs font-medium uppercase tracking-wide text-muted-foreground";

export type Course = {
  id: string;
  name: string;
  nrCode: string | null;
  description: string | null;
  defaultDurationMinutes: number | null;
  isActive: boolean;
  videoProvider: "blob" | "youtube";
  videoBlobUrl: string | null;
  videoYoutubeId: string | null;
};

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function EmptyState({
  title,
  canEdit,
  onCreateClick,
}: {
  title: string;
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <BookOpenText size={32} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onCreateClick}>
          <Plus size={16} />
          Novo treinamento
        </Button>
      )}
    </div>
  );
}

export function CourseList({
  courses,
  canEdit,
  onCreateClick,
}: {
  courses: Course[];
  canEdit: boolean;
  onCreateClick: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    if (!term) return courses;
    return courses.filter(
      (course) =>
        normalizeText(course.name).includes(term) ||
        normalizeText(course.nrCode ?? "").includes(term),
    );
  }, [courses, query]);

  return (
    <div className="space-y-3">
      <div className="relative w-full sm:w-72">
        <MagnifyingGlass
          size={16}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou código da NR"
          className="pl-8"
        />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            title="Nenhum treinamento cadastrado."
            canEdit={canEdit}
            onCreateClick={onCreateClick}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border">
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            Nenhum treinamento encontrado para essa busca.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:hidden">
            {filtered.map((course) => {
              const hasVideo =
                (course.videoProvider === "blob" && Boolean(course.videoBlobUrl)) ||
                (course.videoProvider === "youtube" && Boolean(course.videoYoutubeId));

              return (
                <li key={course.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="font-medium hover:underline"
                    >
                      {course.name}
                    </Link>
                    {canEdit && <CourseRowActions course={course} />}
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Código NR</dt>
                      <dd>{course.nrCode ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Duração</dt>
                      <dd className="tabular-nums">{formatDuration(course.defaultDurationMinutes)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Vídeo</dt>
                      <dd>
                        {hasVideo ? (
                          <VideoCamera size={16} className="text-muted-foreground" />
                        ) : (
                          <VideoCameraSlash size={16} className="text-muted-foreground" />
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    {course.isActive ? (
                      <StatusBadge status="active">Ativo</StatusBadge>
                    ) : (
                      <StatusBadge status="draft">Inativo</StatusBadge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={HEAD_CLASS}>Nome</TableHead>
                  <TableHead className={HEAD_CLASS}>Código NR</TableHead>
                  <TableHead className={HEAD_CLASS}>Duração</TableHead>
                  <TableHead className={HEAD_CLASS}>Vídeo</TableHead>
                  <TableHead className={HEAD_CLASS}>Status</TableHead>
                  <TableHead className={cn(HEAD_CLASS, "w-10")}>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((course) => {
                  const hasVideo =
                    (course.videoProvider === "blob" && Boolean(course.videoBlobUrl)) ||
                    (course.videoProvider === "youtube" && Boolean(course.videoYoutubeId));

                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-medium hover:underline"
                        >
                          {course.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {course.nrCode ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDuration(course.defaultDurationMinutes)}
                      </TableCell>
                      <TableCell>
                        {hasVideo ? (
                          <VideoCamera size={16} className="text-muted-foreground" />
                        ) : (
                          <VideoCameraSlash size={16} className="text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {course.isActive ? (
                          <StatusBadge status="active">Ativo</StatusBadge>
                        ) : (
                          <StatusBadge status="draft">Inativo</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit && <CourseRowActions course={course} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
