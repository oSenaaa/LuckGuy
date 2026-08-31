import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Building2,
  Clock,
  Link2,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

import { LiderMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    icon: Link2,
    title: "Receba o link da empresa",
    text: "Sua empresa envia um link exclusivo da turma do treinamento.",
  },
  {
    icon: PlayCircle,
    title: "Assista ao treinamento",
    text: "Assista ao vídeo no seu ritmo, de qualquer dispositivo, acompanhando o progresso.",
  },
  {
    icon: Award,
    title: "Emita seu certificado",
    text: "Ao concluir a carga mínima, gere o certificado com código de verificação.",
  },
];

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Conformidade NR", text: "Conteúdo alinhado às Normas Regulamentadoras." },
  { icon: Clock, title: "No seu ritmo", text: "Sem horário marcado — o progresso fica salvo." },
  { icon: BadgeCheck, title: "Certificado verificável", text: "Cada certificado tem um código público de validação." },
  { icon: Building2, title: "Gestão por empresa", text: "Turmas, participantes e certificados organizados por cliente." },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <LiderMark className="size-16" />
        <Badge variant="secondary" className="uppercase tracking-[0.2em]">
          Treinamentos NR online
        </Badge>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Plataforma de treinamentos em Normas Regulamentadoras
        </h1>
        <p className="max-w-xl text-muted-foreground text-pretty">
          A LÍDER capacita os colaboradores da sua empresa com treinamentos NR em
          vídeo, controle de presença e emissão de certificados.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/admin">
              <ShieldCheck />
              Área administrativa
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#como-funciona">Recebi um link da minha empresa</a>
          </Button>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 py-12">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Como funciona
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Card key={title}>
              <CardContent className="space-y-3 py-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Passo {i + 1}
                  </span>
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="space-y-2 py-6">
                <Icon className="size-5 text-primary" />
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
