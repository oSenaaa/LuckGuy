"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";

import { BulkReissueButton } from "./bulk-reissue-button";
import { ReissueCertificateButton } from "./reissue-certificate-button";
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
};

export function ParticipantsPanel({
  participants,
  sessionId,
  downloadAllHref,
}: {
  participants: Participant[];
  sessionId: string;
  downloadAllHref: string;
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
        {withCertificate.length > 0 && (
          <CardAction className="flex flex-wrap items-center gap-2">
            {selected.size > 0 && (
              <BulkReissueButton
                participantIds={Array.from(selected)}
                sessionId={sessionId}
                label={`Reemitir selecionados (${selected.size})`}
              />
            )}
            <BulkReissueButton
              participantIds={withCertificate.map((p) => p.id)}
              sessionId={sessionId}
            />
            <Button asChild variant="outline" size="sm">
              <a href={downloadAllHref}>
                <Download />
                Baixar todos (ZIP)
              </a>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {participants.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum participante ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {withCertificate.length > 0 && (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos os participantes com certificado"
                    />
                  )}
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-right">% assistido</TableHead>
                <TableHead>Concluído</TableHead>
                <TableHead className="text-right">Certificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.certificateUrl && (
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleOne(p.id)}
                        aria-label={`Selecionar ${p.fullName}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.watchedPercent ? Number(p.watchedPercent).toFixed(0) : 0}%
                  </TableCell>
                  <TableCell>
                    {p.completedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        Sim
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.certificateUrl ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={p.certificateUrl} target="_blank">
                            <Download />
                            Baixar
                          </Link>
                        </Button>
                        <ReissueCertificateButton participantId={p.id} sessionId={sessionId} />
                      </div>
                    ) : (
                      <span className="block text-right text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </>
  );
}
