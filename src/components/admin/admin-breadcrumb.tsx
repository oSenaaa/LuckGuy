"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  admin: "Painel",
  companies: "Empresas",
  courses: "Treinamentos",
  sessions: "Turmas",
  templates: "Modelo de certificado",
  signatures: "Assinaturas",
  new: "Nova turma",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // e.g. ["admin", "sessions", "abc"]

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isDynamicId =
      index > 0 && !LABELS[segment] && segments[index - 1] === "sessions";
    const label = isDynamicId ? "Detalhe da turma" : LABELS[segment] ?? segment;
    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map(({ href, label, isLast }) => (
          <Fragment key={href}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
