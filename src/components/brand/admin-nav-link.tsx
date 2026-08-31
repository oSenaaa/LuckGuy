"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 pb-0.5 transition-colors ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-foreground/70 hover:text-brand"
      }`}
    >
      {children}
    </Link>
  );
}
