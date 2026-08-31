import { SignIn } from "@clerk/nextjs";
import { LiderLogo } from "@/components/brand/logo";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <LiderLogo variant="full" size="lg" href="/" />
      <SignIn />
      <p className="text-xs text-muted-foreground">Acesso restrito à equipe LÍDER.</p>
    </div>
  );
}
