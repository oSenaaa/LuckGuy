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
        title="Acesso restrito à equipe LÍDER"
        description="Sua conta está autenticada, mas não pertence à organização autorizada ou não tem o papel de administrador. Fale com o responsável pela plataforma para receber o convite."
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
