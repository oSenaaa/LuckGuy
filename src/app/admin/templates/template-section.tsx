"use client";

import { useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function TemplateSection({
  title,
  description,
  defaultOpen = true,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
        <span className="space-y-1">
          <span className="block text-base font-semibold">{title}</span>
          {description && (
            <span className="block text-sm text-muted-foreground">{description}</span>
          )}
        </span>
        <CaretDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn("border-t border-border", contentClassName ?? "px-4 py-4")}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
