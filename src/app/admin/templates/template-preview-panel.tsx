import { Image as ImageIcon } from "@phosphor-icons/react";

export type TemplatePreview = { name: string; url: string } | null;

export function TemplatePreviewPanel({ preview }: { preview: TemplatePreview }) {
  return (
    <div className="rounded-lg border border-border lg:sticky lg:top-20">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Pré-visualização</h2>
        <p className="text-sm text-muted-foreground">
          {preview ? preview.name : "Selecione ou envie um modelo para visualizar."}
        </p>
      </div>
      <div className="p-4">
        {preview ? (
          // Blob URL e URLs temporárias (createObjectURL) não estão em
          // images.remotePatterns; usar <img> puro.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt={`Pré-visualização do modelo ${preview.name}`}
            className="w-full rounded-md border border-border object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ImageIcon size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma imagem selecionada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
