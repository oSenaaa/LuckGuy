"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LiderLogo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const isWatchPage = /^\/t\/[^/]+\/assistir\/?$/.test(pathname ?? "");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <LiderLogo variant="full" size="sm" href="/" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!isWatchPage && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <ShieldCheck />
                <span className="hidden sm:inline">Área administrativa</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
