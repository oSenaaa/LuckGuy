"use client";

import { CaretDown, Certificate } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TemplateRowActions } from "./template-row-actions";
import type { TemplatePreview } from "./template-preview-panel";

export type Template = {
  id: string;
  name: string;
  backgroundImageBlobUrl: string;
  isDefault: boolean;
  archivedAt: Date | null;
};

function TemplateRow({
  template,
  isArchived,
  canEdit,
  onPreview,
}: {
  template: Template;
  isArchived: boolean;
  canEdit: boolean;
  onPreview: (preview: TemplatePreview) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        {template.name}
        {template.isDefault && <Badge variant="secondary">Padrão</Badge>}
      </span>
      <TemplateRowActions
        id={template.id}
        name={template.name}
        backgroundImageBlobUrl={template.backgroundImageBlobUrl}
        isDefault={template.isDefault}
        isArchived={isArchived}
        canEdit={canEdit}
        onPreview={onPreview}
      />
    </li>
  );
}

export function TemplateList({
  templates,
  canEdit,
  onPreview,
}: {
  templates: Template[];
  canEdit: boolean;
  onPreview: (preview: TemplatePreview) => void;
}) {
  const active = templates.filter((template) => !template.archivedAt);
  const archived = templates.filter((template) => template.archivedAt);

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Certificate size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {active.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            isArchived={false}
            canEdit={canEdit}
            onPreview={onPreview}
          />
        ))}
      </ul>

      {archived.length > 0 && (
        <Collapsible className="border-t border-border">
          <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <CaretDown
              size={16}
              className="shrink-0 transition-transform group-data-[state=open]:rotate-180"
            />
            Arquivados ({archived.length})
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="divide-y divide-border border-t border-border text-muted-foreground">
              {archived.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  isArchived
                  canEdit={canEdit}
                  onPreview={onPreview}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
