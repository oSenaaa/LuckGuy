"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Video, VideoOff } from "lucide-react";

import { normalizeText } from "@/lib/text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Course = {
  id: string;
  name: string;
  nrCode: string | null;
  isActive: boolean;
  videoProvider: "blob" | "youtube";
  videoBlobUrl: string | null;
  videoYoutubeId: string | null;
};

function CourseRow({ course }: { course: Course }) {
  const hasVideo =
    (course.videoProvider === "blob" && course.videoBlobUrl) ||
    (course.videoProvider === "youtube" && course.videoYoutubeId);

  return (
    <li>
      <Link
        href={`/admin/courses/${course.id}`}
        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50"
      >
        <span className="font-medium">{course.name}</span>
        <div className="flex shrink-0 items-center gap-2">
          {course.nrCode && <Badge variant="outline">{course.nrCode}</Badge>}
          {!course.isActive && <Badge variant="outline">Inativo</Badge>}
          {hasVideo ? (
            <Video className="size-4 text-muted-foreground" />
          ) : (
            <VideoOff className="size-4 text-muted-foreground" />
          )}
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </div>
      </Link>
    </li>
  );
}

export function CoursesList({ courses }: { courses: Course[] }) {
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
    <>
      <CardHeader className="border-b">
        <CardTitle>Treinamentos cadastrados</CardTitle>
        <CardAction>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou código da NR"
              className="w-48 pl-8 sm:w-64"
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {courses.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum treinamento cadastrado.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum treinamento encontrado para essa busca.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((course) => (
              <CourseRow key={course.id} course={course} />
            ))}
          </ul>
        )}
      </CardContent>
    </>
  );
}
