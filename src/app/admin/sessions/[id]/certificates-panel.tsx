import { Certificate, DownloadSimple } from "@phosphor-icons/react/dist/ssr";

import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CertificatesPanel({
  total,
  issuedCount,
  downloadAllHref,
}: {
  total: number;
  issuedCount: number;
  downloadAllHref: string;
}) {
  const pendingCount = total - issuedCount;

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle>Certificados</CardTitle>
        <CardDescription>
          {total === 0
            ? "Nenhum participante nesta turma ainda."
            : `${issuedCount} de ${total} participante${total === 1 ? "" : "s"} com certificado emitido.`}
        </CardDescription>
        {issuedCount > 0 && (
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <a href={downloadAllHref}>
                <DownloadSimple size={16} />
                Baixar todos (ZIP)
              </a>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Certificate size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Os certificados aparecem aqui conforme os participantes concluem o treinamento.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="active">{issuedCount} emitido{issuedCount === 1 ? "" : "s"}</StatusBadge>
            <StatusBadge status="pending">{pendingCount} pendente{pendingCount === 1 ? "" : "s"}</StatusBadge>
          </div>
        )}
      </CardContent>
    </>
  );
}
