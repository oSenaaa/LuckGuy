import Link from "next/link";
import { Compass } from "lucide-react";

import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <StatusCard
        icon={Compass}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
      >
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </StatusCard>
    </div>
  );
}
