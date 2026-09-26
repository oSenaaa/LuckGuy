import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";

import { PageHeader } from "@/components/admin/page-header";
import { UserRowActions } from "@/components/admin/settings/user-row-actions";
import { InvitationRowActions } from "@/components/admin/settings/invitation-row-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentRole, isRole, ROLE_LABELS, type Role } from "@/lib/permissions";
import { inviteUser } from "./actions";

export default async function SettingsPage() {
  const current = await getCurrentRole();
  if (current?.role !== "admin") redirect("/admin");

  const client = await clerkClient();
  const [{ data: users }, { data: invitations }] = await Promise.all([
    client.users.getUserList({ limit: 100 }),
    client.invitations.getInvitationList({ status: "pending", limit: 100 }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title="Configurações"
        description="Usuários com acesso ao painel e seus níveis de permissão."
      />

      <Tabs defaultValue="usuarios">
        <TabsList variant="line">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="convites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Pessoas com acesso ao painel e seus níveis de permissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {users.map((user) => {
                    const role = isRole(user.publicMetadata.role)
                      ? user.publicMetadata.role
                      : null;
                    const isCurrentUser = user.id === current.userId;
                    return (
                      <li
                        key={user.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {user.fullName?.trim() || user.publicMetadata.name || "Sem nome"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline">
                              {role ? ROLE_LABELS[role] : "Sem permissão"}
                            </Badge>
                            {user.banned && <Badge variant="destructive">Acesso revogado</Badge>}
                            {isCurrentUser && <Badge variant="secondary">Você</Badge>}
                          </div>
                        </div>
                        <UserRowActions
                          userId={user.id}
                          role={role}
                          banned={user.banned}
                          isCurrentUser={isCurrentUser}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convites" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Convidar usuário</CardTitle>
              <CardDescription>
                Um e-mail de convite é enviado pelo Clerk. O nível de permissão escolhido é
                aplicado assim que a pessoa aceitar o convite.
              </CardDescription>
            </CardHeader>
            <form action={inviteUser}>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_180px]">
                  <div className="grid gap-2">
                    <Label htmlFor="invite-name">Nome</Label>
                    <Input id="invite-name" name="name" required placeholder="Nome completo" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invite-email">E-mail</Label>
                    <Input
                      id="invite-email"
                      name="email"
                      type="email"
                      required
                      placeholder="pessoa@empresa.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invite-role">Permissão</Label>
                    <NativeSelect id="invite-role" name="role" defaultValue="editor" required>
                      {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <SubmitButton pendingText="Enviando…">Convidar</SubmitButton>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Convites pendentes</CardTitle>
              <CardDescription>
                Ainda não aceitos — podem ser revogados a qualquer momento.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invitations.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum convite pendente.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {invitations.map((invitation) => {
                    const role = isRole(invitation.publicMetadata?.role)
                      ? invitation.publicMetadata.role
                      : null;
                    const name =
                      typeof invitation.publicMetadata?.name === "string"
                        ? invitation.publicMetadata.name
                        : null;
                    return (
                      <li
                        key={invitation.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{name ?? "Sem nome"}</p>
                          {role && (
                            <Badge variant="outline" className="mt-1">
                              {ROLE_LABELS[role]}
                            </Badge>
                          )}
                        </div>
                        <InvitationRowActions invitationId={invitation.id} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
