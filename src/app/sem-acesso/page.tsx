import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sem acesso",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <StatusCard
        icon={ShieldX}
        tone="destructive"
        title="Acesso restrito"
        description="Sua conta está autenticada, mas não tem permissão configurada no painel. Fale com um administrador para receber acesso."
      >
        <SignOutButton>
          <Button variant="outline" size="sm">
            Sair da conta
          </Button>
        </SignOutButton>
      </StatusCard>
    </div>
  );
}
