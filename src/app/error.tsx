"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <StatusCard
        icon={AlertTriangle}
        tone="destructive"
        title="Algo deu errado"
        description={error.message || "Não foi possível concluir a operação. Tente novamente."}
      >
        <Button onClick={reset}>Tentar novamente</Button>
      </StatusCard>
    </div>
  );
}
