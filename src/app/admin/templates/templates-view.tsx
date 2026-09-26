"use client";

import { useState } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { TemplateSection } from "./template-section";
import { TemplateUploadForm } from "./template-upload-form";
import { TemplateList, type Template } from "./template-list";
import { TemplatePreviewPanel, type TemplatePreview } from "./template-preview-panel";

export function TemplatesView({
  templates,
  canEdit,
}: {
  templates: Template[];
  canEdit: boolean;
}) {
  const defaultTemplate = templates.find((template) => template.isDefault && !template.archivedAt);
  const [preview, setPreview] = useState<TemplatePreview>(
    defaultTemplate
      ? { name: defaultTemplate.name, url: defaultTemplate.backgroundImageBlobUrl }
      : null,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelo de certificado"
        description="Imagem de fundo padrão do certificado emitido aos participantes."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {canEdit && (
            <TemplateSection
              title="Novo modelo"
              description="Envie a imagem de fundo com a margem para assinatura já desenhada."
            >
              <TemplateUploadForm onPreviewChange={setPreview} />
            </TemplateSection>
          )}

          <TemplateSection title="Modelos cadastrados" contentClassName="">
            <TemplateList templates={templates} canEdit={canEdit} onPreview={setPreview} />
          </TemplateSection>
        </div>

        <TemplatePreviewPanel preview={preview} />
      </div>
    </div>
  );
}
