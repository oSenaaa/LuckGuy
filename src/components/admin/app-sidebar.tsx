"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowSquareOut,
  BookOpenText,
  Buildings,
  Certificate,
  GearSix,
  Signature,
  SquaresFour,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

import { LiderLogo, LiderMark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/roles";

type NavItem = { label: string; href: string; icon: Icon };

const MANAGEMENT_NAV_ITEMS: NavItem[] = [
  { label: "Painel", href: "/admin", icon: SquaresFour },
  { label: "Empresas", href: "/admin/companies", icon: Buildings },
  { label: "Treinamentos", href: "/admin/courses", icon: BookOpenText },
  { label: "Turmas", href: "/admin/sessions", icon: UsersThree },
];

const CERTIFICATE_NAV_ITEMS: NavItem[] = [
  { label: "Modelo de certificado", href: "/admin/templates", icon: Certificate },
  { label: "Assinaturas", href: "/admin/signatures", icon: Signature },
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ label, href, icon: ItemIcon }) => {
            const active = isActivePath(pathname, href);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={active} tooltip={label}>
                  <Link href={href}>
                    <ItemIcon size={18} weight={active ? "fill" : "regular"} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({
  role,
  userName,
  userEmail,
}: {
  role: Role;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const settingsActive = isActivePath(pathname, "/admin/settings");

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
        <NavGroup label="Gestão" items={MANAGEMENT_NAV_ITEMS} pathname={pathname} />
        <NavGroup label="Certificados" items={CERTIFICATE_NAV_ITEMS} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {role === "admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={settingsActive} tooltip="Configurações">
                <Link href="/admin/settings">
                  <GearSix size={18} weight={settingsActive ? "fill" : "regular"} />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver site público">
              <Link href="/" target="_blank" rel="noreferrer">
                <ArrowSquareOut size={18} />
                <span>Ver site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <div className="flex items-center gap-2 overflow-hidden px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{userName}</span>
            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
