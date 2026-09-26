"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DownloadSimple, UsersThree } from "@phosphor-icons/react";

import { BulkReissueButton } from "./bulk-reissue-button";
import { ReissueCertificateButton } from "./reissue-certificate-button";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Participant = {
  id: string;
  fullName: string;
  phone: string;
  watchedPercent: string | null;
  completedAt: Date | null;
  certificateUrl: string | null;
  certificateCode: string | null;
  companyName: string | null;
  workplaceName: string | null;
};

export function ParticipantsPanel({
  participants,
  sessionId,
  publicUrl,
  exportHref,
  canEdit,
}: {
  participants: Participant[];
  sessionId: string;
  publicUrl: string;
  exportHref: string;
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const withCertificate = useMemo(
    () => participants.filter((p) => p.certificateUrl),
    [participants],
  );
  const allSelected =
    withCertificate.length > 0 && withCertificate.every((p) => selected.has(p.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(withCertificate.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          Participantes
          <Badge variant="secondary">{participants.length}</Badge>
        </CardTitle>
        <CardAction className="flex flex-wrap items-center gap-2">
          {canEdit && selected.size > 0 && (
            <BulkReissueButton
              participantIds={Array.from(selected)}
              sessionId={sessionId}
              label={`Reemitir selecionados (${selected.size})`}
            />
          )}
          {participants.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <a href={exportHref}>
                <DownloadSimple size={16} />
                Exportar CSV
              </a>
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <UsersThree size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum participante ainda.</p>
            <CopyButton value={publicUrl} label="Copiar link de acesso" />
          </div>
        ) : (
          <>
            <div className="sm:hidden">
              {canEdit && withCertificate.length > 0 && (
                <label className="flex items-center gap-2 border-b px-4 py-3 text-sm text-muted-foreground">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Selecionar todos os participantes com certificado"
                  />
                  Selecionar todos com certificado
                </label>
              )}
              <ul className="divide-y divide-border">
                {participants.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {canEdit && p.certificateUrl && (
                          <Checkbox
                            className="mt-0.5"
                            checked={selected.has(p.id)}
                            onCheckedChange={() => toggleOne(p.id)}
                            aria-label={`Selecionar ${p.fullName}`}
                          />
                        )}
                        <span className="font-medium">{p.fullName}</span>
                      </div>
                      {p.certificateUrl ? (
                        <StatusBadge status="active">Assinado</StatusBadge>
                      ) : (
                        <StatusBadge status="pending">Pendente</StatusBadge>
                      )}
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Telefone</dt>
                        <dd>{p.phone}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Empresa</dt>
                        <dd className="truncate">{p.companyName ?? "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Posto de trabalho</dt>
                        <dd className="truncate">{p.workplaceName ?? "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">% assistido</dt>
                        <dd className="tabular-nums">
                          {p.watchedPercent ? Number(p.watchedPercent).toFixed(0) : 0}%
                        </dd>
                      </div>
                    </dl>
                    {p.certificateUrl && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={p.certificateUrl} target="_blank">
                            <DownloadSimple size={16} />
                            Baixar certificado
                          </Link>
                        </Button>
                        {canEdit && (
                          <ReissueCertificateButton participantId={p.id} sessionId={sessionId} />
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      {canEdit && withCertificate.length > 0 && (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Selecionar todos os participantes com certificado"
                        />
                      )}
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Posto de trabalho</TableHead>
                    <TableHead className="text-right">% assistido</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead className="sticky right-0 z-10 border-l bg-background text-right">
                      Certificado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        {canEdit && p.certificateUrl && (
                          <Checkbox
                            checked={selected.has(p.id)}
                            onCheckedChange={() => toggleOne(p.id)}
                            aria-label={`Selecionar ${p.fullName}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                      <TableCell
                        className="max-w-40 truncate text-muted-foreground"
                        title={p.companyName ?? undefined}
                      >
                        {p.companyName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.workplaceName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.watchedPercent ? Number(p.watchedPercent).toFixed(0) : 0}%
                      </TableCell>
                      <TableCell>
                        {p.certificateUrl ? (
                          <StatusBadge status="active">Assinado</StatusBadge>
                        ) : (
                          <StatusBadge status="pending">Pendente de assinatura</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell className="sticky right-0 border-l bg-background group-hover:bg-muted/50">
                        {p.certificateUrl ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="icon-sm" aria-label="Baixar certificado" title="Baixar certificado">
                              <Link href={p.certificateUrl} target="_blank">
                                <DownloadSimple size={20} />
                              </Link>
                            </Button>
                            {canEdit && (
                              <ReissueCertificateButton participantId={p.id} sessionId={sessionId} />
                            )}
                          </div>
                        ) : (
                          <span className="block text-right text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </>
  );
}
