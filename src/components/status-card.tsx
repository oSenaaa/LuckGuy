import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatusCard({
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: "default" | "destructive" | "success";
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-primary/10 text-primary";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <span
          className={`flex size-12 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children && <div className="pt-1">{children}</div>}
      </CardContent>
    </Card>
  );
}
