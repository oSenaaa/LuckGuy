"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowSquareOut,
  BookOpenText,
  Buildings,
  Certificate,
  GearSix,
  Signature,
  SquaresFour,
  UsersThree,
} from "@phosphor-icons/react";

import { LiderLogo, LiderMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/roles";

const NAV_ITEMS = [
  { label: "Painel", href: "/admin", icon: SquaresFour },
  { label: "Empresas", href: "/admin/companies", icon: Buildings },
  { label: "Treinamentos", href: "/admin/courses", icon: BookOpenText },
  { label: "Turmas", href: "/admin/sessions", icon: UsersThree },
  { label: "Modelo de certificado", href: "/admin/templates", icon: Certificate },
  { label: "Assinaturas", href: "/admin/signatures", icon: Signature },
] as const;

const ADMIN_ONLY_NAV_ITEMS = [
  { label: "Configurações", href: "/admin/settings", icon: GearSix },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const navItems = role === "admin" ? [...NAV_ITEMS, ...ADMIN_ONLY_NAV_ITEMS] : NAV_ITEMS;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <Link
          href="/admin"
          className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center"
        >
          <LiderMark className="hidden size-7 shrink-0 group-data-[collapsible=icon]:block" />
          <span className="group-data-[collapsible=icon]:hidden">
            <LiderLogo variant="full" size="sm" />
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={href}>
                        <Icon size={18} weight={active ? "fill" : "regular"} />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver site público">
              <Link href="/" target="_blank" rel="noreferrer">
                <ArrowSquareOut size={18} weight="regular" />
                <span>Ver site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
