"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Building2,
  CalendarClock,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  PenLine,
} from "lucide-react";

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

const NAV_ITEMS = [
  { label: "Painel", href: "/admin", icon: LayoutDashboard },
  { label: "Empresas", href: "/admin/companies", icon: Building2 },
  { label: "Treinamentos", href: "/admin/courses", icon: GraduationCap },
  { label: "Turmas", href: "/admin/sessions", icon: CalendarClock },
  { label: "Modelo de certificado", href: "/admin/templates", icon: Award },
  { label: "Assinaturas", href: "/admin/signatures", icon: PenLine },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();

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
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver site público">
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink />
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
