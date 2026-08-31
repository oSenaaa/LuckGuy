# Plataforma de Treinamentos NR

Aplicação web (Next.js) para **aplicar treinamentos de NR (Normas Regulamentadoras) online**: a empresa contratante cadastra turmas, o colaborador assiste ao vídeo do treinamento por um link público (sem criar conta) e, ao concluir, recebe um **certificado em PDF com código de verificação público**.

> Projeto privado, ainda em estágio de MVP. Este README é o documento de contexto para subir e validar o projeto em outra máquina.

---

## 1. Proposta / visão do produto

Empresas precisam aplicar treinamentos obrigatórios de NR aos colaboradores e **comprovar** essa capacitação com certificado e carga horária. Hoje isso costuma ser feito de forma manual (presencial, planilha, PDF editado à mão).

A plataforma resolve isso com **duas frentes**:

| Frente | Quem usa | Como funciona |
| --- | --- | --- |
| **Colaborador** | Funcionário da empresa | Abre um link público da turma, se identifica com **nome completo + telefone** (sem senha), assiste ao vídeo com acompanhamento de progresso e, ao atingir a % mínima assistida, emite o certificado. |
| **Painel administrativo** | Operador da plataforma | Login via Clerk. Cadastra empresas, treinamentos e turmas, sobe o vídeo (Vercel Blob ou link do YouTube), configura o modelo do certificado e a assinatura do coordenador, acompanha o progresso dos participantes, exporta CSV e reemite certificados. |

O que caracteriza o **MVP atual**: o caminho completo "criar turma → colaborador assiste → certificado emitido → verificação pública" já funciona ponta a ponta.

---

## 2. Status atual (MVP)

**Já funciona:**

- Fluxo do colaborador: identificação por nome + telefone, sessão via cookie assinado (JWT), player com *heartbeat* de progresso, métrica anti-avanço (só conta o trecho realmente assistido), emissão automática do certificado ao atingir a % mínima.
- Certificado: PDF gerado com `pdf-lib` sobre uma imagem de fundo, com assinatura opcional do coordenador, armazenado no Vercel Blob; página pública `/verificar/<codigo>`.
- Painel admin: empresas, treinamentos (cursos), turmas, upload de vídeo por **Blob** ou **YouTube**, publicar/arquivar turma, modelos de certificado, assinaturas, tabela de participantes, download e reemissão de certificado, export CSV.

**Limitações conhecidas (importante para quem for validar/mexer):**

- **Não há migrações versionadas.** O schema é aplicado direto no banco com `npm run db:push`. A pasta `drizzle/` ainda não existe.
- **Qualquer usuário logado no Clerk é admin.** `requireAdmin()` só verifica se há sessão — não há papéis nem allowlist.
- **Revogação de certificado** existe no banco e na página de verificação, mas **não tem UI** no admin.
- Não há testes automatizados.
- Não há UI para escolher modelo/assinatura por turma (a emissão usa o marcado como *default*).
- O `metadata` do layout raiz ainda diz "Create Next App".

---

## 3. Stack

| Camada | Tecnologia | Observações |
| --- | --- | --- |
| Framework | **Next.js 16.3.3** (App Router, `src/`, Turbopack) | Middleware fica em **`src/proxy.ts`** (não `middleware.ts`). Ver seção 13. |
| UI | React 19.2.8, Tailwind CSS v4 | Tailwind v4 é *CSS-first*: sem `tailwind.config`, config em `src/app/globals.css`. |
| Banco | **Neon** (Postgres serverless) | Driver HTTP `@neondatabase/serverless` — espera um Postgres hospedado tipo Neon, não um Postgres local via TCP. |
| ORM | **Drizzle ORM** + `drizzle-kit` | Schema como código em `src/lib/db/schema.ts`. |
| Auth admin | **Clerk** (`@clerk/nextjs`) | Chaves de teste (`pk_test_`/`sk_test_`) servem para local. |
| Sessão do colaborador | JWT próprio via `jose` | Cookie `ps_<courseSessionId>` por turma, assinado com `PARTICIPANT_SESSION_SECRET`, validade 30 dias. |
| Storage | **Vercel Blob** | Vídeos, imagens de modelo/assinatura e PDFs de certificado. |
| PDF | `pdf-lib` | |
| IDs / códigos | `nanoid` | `accessSlug` (8 chars) e `verificationCode` (10 chars). |
| YouTube | IFrame API pública + parsing de URL | **Sem API key.** |

---

## 4. Arquitetura em 1 minuto

**Fluxo do colaborador**

1. `GET /t/[slug]` — `src/app/(public)/t/[slug]/page.tsx`. Se já houver cookie de sessão, redireciona para `/t/[slug]/assistir`.
2. Formulário de identificação → *server action* `identifyParticipant` (`src/app/(public)/t/[slug]/actions.ts`): faz *upsert* do participante por `(courseSessionId, phone)`, valida a janela `startsAt`/`endsAt` da turma e grava o cookie JWT.
3. `GET /t/[slug]/assistir` — `.../assistir/page.tsx` + `video-player.tsx` (client). O player envia *heartbeats* para `POST /api/progress`, que grava `maxTimeReachedSeconds` (só o trecho efetivamente assistido), calcula `watchedPercent` e define `completedAt` quando `watchedPercent >= minWatchPercent` (default **90%**).
4. Concluído o vídeo, o client chama `POST /api/certificates/issue` (`runtime = "nodejs"`) → `issueCertificate` (`src/lib/certificate/issue.ts`): idempotente, exige `viewing_progress.completedAt`, resolve modelo e assinatura (da turma ou o *default*), gera o PDF, sobe em `certificates/<code>.pdf` e grava a linha em `certificates` com *snapshots* de nome/curso/carga horária.
5. `GET /verificar/[codigo]` — verificação pública: nome, curso, carga horária, data de emissão e status de revogação.

**Fluxo do admin** — tudo sob `src/app/admin/`, protegido pelo `src/proxy.ts` (Clerk) e por `requireAdmin()` em cada *server action*. CRUD de empresas, cursos, turmas, modelos e assinaturas; vídeos e imagens são enviados diretamente do navegador ao Vercel Blob por tokens emitidos em `POST /api/blob/upload`, evitando os limites de corpo das Functions; vídeo também pode ser configurado por link do YouTube; export CSV via `GET /api/sessions/[id]/export`.

---

## 5. Estrutura de pastas

```
src/
  proxy.ts                      # middleware (Clerk) — protege /admin, /api/sessions, /api/blob
  app/
    layout.tsx                  # ClerkProvider, lang pt-BR
    page.tsx                    # landing
    sign-in/[[...sign-in]]/     # tela de login do Clerk
    (public)/
      t/[slug]/                 # identificação do colaborador + actions
      t/[slug]/assistir/        # player + heartbeat de progresso
      verificar/[codigo]/       # verificação pública do certificado
    admin/
      layout.tsx                # exige sessão Clerk, nav + UserButton
      page.tsx                  # dashboard (5 turmas recentes)
      companies/  courses/  sessions/  templates/  signatures/
      sessions/[id]/            # detalhe da turma: link público, CSV, vídeo, participantes
    api/
      blob/upload/              # token de client-upload do Vercel Blob (Clerk)
      certificates/issue/       # emissão do certificado (cookie do colaborador)
      progress/                 # heartbeat de progresso (cookie do colaborador)
      sessions/[id]/export/     # CSV de participantes (Clerk)
  lib/
    db/{index.ts,schema.ts}     # cliente Drizzle/Neon + schema
    certificate/                # generate-pdf, issue, verification-code
    participant-session.ts      # JWT/cookie do colaborador
    require-admin.ts            # guarda de admin (Clerk)
    blob.ts  youtube.ts  youtube-iframe-api.ts  access-slug.ts
scripts/
  seed-test-data.ts             # dados de teste (ver seção 9.6)
```

---

## 6. Modelo de dados

Definido em `src/lib/db/schema.ts` (Postgres). Enums: `session_status` (`draft` | `published` | `archived`), `video_provider` (`blob` | `youtube`).

| Tabela | O que é |
| --- | --- |
| `companies` | Empresa-cliente (nome, CNPJ opcional, contato). |
| `courses` | Definição do treinamento/NR (nome, `slug` único, `nrCode`, carga padrão). |
| `certificate_templates` | Imagem de fundo do certificado + posições de texto opcionais + flag `isDefault`. |
| `certificate_signatures` | Nome/cargo do coordenador + imagem de assinatura + flag `isDefault`. |
| `course_sessions` | **A turma**: vincula `course` + `company`, fonte do vídeo (`blob`/`youtube`), duração, `workloadHours`, `accessSlug` único (o link público), janela `startsAt`/`endsAt`, `minWatchPercent` (default 90), `status`. |
| `participants` | Colaborador matriculado numa turma (nome, telefone, CPF opcional). Único por `(courseSessionId, phone)`. |
| `viewing_progress` | 1:1 com `participants`: `maxTimeReachedSeconds`, `watchedPercent`, `completedAt`. |
| `certificates` | Certificado emitido: `verificationCode` único, URL do PDF, *snapshots* de nome/curso/carga, `templateIdUsed`/`signatureIdUsed`, `revokedAt`/`revokedReason`. |

Relações: `company 1—N course_sessions`; `course 1—N course_sessions`; `course_session 1—N participants`; `participant 1—1 viewing_progress`; `participant 1—N certificates`. Não há helpers `relations()` do Drizzle — os joins são escritos à mão.

Para explorar os dados: `npm run db:studio`.

---

## 7. Pré-requisitos

- **Node.js 20 LTS ou superior** (Next.js 16 exige ≥ 20.9). Não há `.nvmrc` nem campo `engines`.
- **npm** (o lockfile é `package-lock.json`, v3).
- **git**.
- **Conta no Vercel com acesso ao projeto `treinamentos-nr-app`** (para baixar as variáveis de ambiente prontas).
- **Vercel CLI**: `npm i -g vercel`.

> Sem acesso ao projeto no Vercel? Veja o *fallback* no fim da seção 9.

---

## 8. Contexto antes de rodar qualquer coisa

- **`.env.local` não vem no repositório** (é git-ignored). O que está versionado é o template `.env.local.example`. Você precisa gerar o seu (passo 9.4).
- **O banco é compartilhado** entre quem usa `vercel env pull`. `db:push` e o seed escrevem nesse banco Neon real — não é um banco local isolado.
- **`AGENTS.md` é reescrito pelo `next dev`.** Se ele aparecer como modificado no `git status`, é esperado; commite junto com o resto para manter a árvore limpa.
- Segredos em `.env.local` são **segredos de verdade** — não commite, não cole em chat/issue/PR.

---

## 9. Setup local (passo a passo)

Cada comando tem o contexto do que faz e do que exige.

### 9.1 Clonar

```bash
git clone <url-do-repo> LuckGuy
cd LuckGuy
```

### 9.2 Instalar dependências

```bash
npm install
```

Usa `package-lock.json` (npm 7+). Não há hooks `postinstall`/`prepare` — nada roda automaticamente depois.

### 9.3 Vincular ao projeto Vercel

```bash
vercel link
```

- Exige `vercel login` feito e **acesso ao projeto**.
- Selecione o time/escopo correto e o projeto **`treinamentos-nr-app`**.
- Cria/atualiza `.vercel/project.json` (git-ignored).

### 9.4 Baixar as variáveis de ambiente

```bash
vercel env pull .env.local
```

- Gera o `.env.local` já preenchido com **todas** as credenciais (Neon, Vercel Blob, Clerk e o `PARTICIPANT_SESSION_SECRET`).
- **Sobrescreve** um `.env.local` existente. É git-ignored. Contém segredos.
- As variáveis que o app realmente usa são as 6 listadas na seção 12; o `pull` traz várias extras da integração Neon que o código não referencia diretamente.

### 9.5 Criar as tabelas no banco

```bash
npm run db:push
```

- Lê `src/lib/db/schema.ts` e aplica **direto** no banco apontado por `DATABASE_URL` (carrega `.env.local` via `dotenv`).
- **Não há migrações** — este é o caminho oficial de setup.
- É o banco compartilhado do projeto: rodar de novo é seguro (só sincroniza o schema), mas o `drizzle-kit` pode **pedir confirmação** em alterações potencialmente destrutivas — leia o prompt antes de aceitar.

### 9.6 (Opcional) Popular dados de teste

```bash
npx dotenv -e .env.local -- npx tsx scripts/seed-test-data.ts
```

- Rode **depois** do `db:push`. Não há script `npm` para isso — o comando acima carrega o `.env.local` e executa o TypeScript direto.
- Cria (reaproveita se já existir): empresa **"Empresa Teste Ltda"** e curso **"NR-15 - Atividades Insalubres"** (slug `nr-15-teste`).
- Cria **sempre uma turma nova** (publicada, vídeo do YouTube, ~15 min) e um participante **"Colaborador Teste"** / telefone **`11999999999`**. Ou seja: rodar várias vezes gera várias turmas.
- No final ele **imprime o link público** `/t/<accessSlug>` — anote.

### 9.7 Subir o servidor de desenvolvimento

```bash
npm run dev
```

- Abre em **http://localhost:3000**. Landing em `/`, admin em `/admin`, login em `/sign-in`.
- Na primeira execução o Next também gera tipos internos (`.next/types`) e pode reescrever `AGENTS.md` (ver seção 8).

### Fallback — sem acesso ao projeto Vercel

1. `cp .env.local.example .env.local`.
2. Provisione por conta própria: um banco **Neon**, um store **Vercel Blob**, e um app **Clerk** (chaves de teste).
3. Preencha no `.env.local`: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` e um `PARTICIPANT_SESSION_SECRET` gerado com `openssl rand -hex 32`.
4. Siga a partir do passo 9.5.

---

## 10. Como validar (roteiro ponta a ponta)

1. **Criar o admin.** No dashboard do Clerk (o app de teste), crie um usuário. Acesse `http://localhost:3000/sign-in` e entre.
2. **Montar uma turma no `/admin`.**
   - `Empresas` → criar uma empresa.
   - `Treinamentos` → criar um curso (o slug é gerado do nome).
   - `Turmas` → `Nova`: escolher curso + empresa, nome, carga horária.
   - Abrir a turma (`/admin/sessions/[id]`): subir um vídeo (`.mp4`/`.webm`) **ou** colar um link do YouTube; depois **Publicar**.
   - *(Ou pule tudo isso e use a turma criada pelo seed — passo 9.6.)*
3. **Fluxo do colaborador.** Abra o link público `/t/<slug>` (o do `/admin/sessions/[id]` ou o impresso pelo seed). Identifique-se com nome + telefone. Assista ao vídeo — o progresso sobe via *heartbeat*; ao passar de **90%** o certificado é emitido automaticamente.
4. **Certificado.** Baixe o PDF na tela de assistir e confira a página pública `/verificar/<codigo>`.
5. **Volta ao admin.** Em `/admin/sessions/[id]`, veja o participante na tabela, baixe o **CSV**, e teste **reemitir** o certificado.
6. **Inspecionar o banco:** `npm run db:studio` para olhar `viewing_progress` e `certificates`.

---

## 11. Referência de comandos

| Comando | O que faz | Quando usar / pré-requisito |
| --- | --- | --- |
| `npm install` | Instala dependências. | Após clonar; após mudança no `package.json`. |
| `npm run dev` | Servidor de desenvolvimento (Turbopack) em `:3000`. | Dia a dia. Precisa do `.env.local`. |
| `npm run build` | Build de produção. | Antes de deploy / para checar erros de tipo e build. |
| `npm run start` | Serve o build de produção. | Após `npm run build`. |
| `npm run lint` | ESLint (`eslint-config-next`). | Antes de commit/PR. |
| `npm run db:push` | Aplica o schema (`schema.ts`) direto no banco. | Setup inicial e sempre que mudar `schema.ts`. Carrega `.env.local`. |
| `npm run db:generate` | Gera SQL de migração em `drizzle/`. | Só se decidirem **versionar** migrações (hoje não é usado). |
| `npm run db:studio` | Abre o Drizzle Studio (GUI do banco). | Inspecionar/editar dados. Carrega `.env.local`. |
| `npx dotenv -e .env.local -- npx tsx scripts/seed-test-data.ts` | Popula dados de teste. | Após `db:push`. Opcional. |
| `vercel env pull .env.local` | Baixa as variáveis de ambiente do projeto. | Setup inicial; quando as credenciais mudarem. Sobrescreve o arquivo. |

---

## 12. Variáveis de ambiente

Template em [.env.local.example](.env.local.example). Com `vercel env pull` **todas já vêm preenchidas**.

| Variável | Para que serve | Obrigatória? | Origem |
| --- | --- | --- | --- |
| `DATABASE_URL` | Conexão com o Postgres (Neon). Usada pelo app e por todos os `db:*`. | **Sim** | Neon (via Vercel Marketplace) |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob (upload de vídeos, imagens e PDFs). | **Sim** para uploads/certificados | Vercel Blob |
| `CLERK_SECRET_KEY` | Chave backend do Clerk (auth do admin). | **Sim** para o `/admin` | Clerk (via Vercel Marketplace) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Chave frontend do Clerk (`<ClerkProvider>`). | **Sim** para a UI de auth | Clerk |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Rota da tela de login (`/sign-in`). | Recomendada (o template define) | Clerk |
| `PARTICIPANT_SESSION_SECRET` | Segredo próprio que assina o cookie JWT do colaborador. O app lança erro se faltar. | **Sim** para o fluxo público | Você (`openssl rand -hex 32`) |

Nenhuma credencial de YouTube/Google é necessária.

---

## 13. Notas para quem for mexer no código

- **Este não é o Next.js "de sempre".** O Next 16 tem breaking changes: o middleware se chama **`proxy.ts`**, `cookies()`/`auth()` são assíncronos, e os tipos globais `PageProps`/`LayoutProps` só resolvem depois de um `next dev`/`next build`. Antes de escrever código, leia o guia da versão em `node_modules/next/dist/docs/` (é o que o `AGENTS.md` pede).
- **Alias de import:** `@/*` → `src/*`.
- **Sem camada de migrações.** Mudança de schema = editar `src/lib/db/schema.ts` + `npm run db:push`. Se for adotar migrações versionadas, passe a usar `npm run db:generate` e commite a pasta `drizzle/`.
- **Tailwind v4:** não existe `tailwind.config`; a configuração fica em `src/app/globals.css`.
- **Auth do admin é frouxa** de propósito no MVP (qualquer usuário Clerk logado). Se for expor, adicione verificação de papel/allowlist em `src/lib/require-admin.ts`.

---

## 14. Deploy

Hospedado no **Vercel** (projeto `treinamentos-nr-app`). A branch **`main`** é a de produção. As variáveis de ambiente são gerenciadas no painel do Vercel (ou via `vercel env`), e é de lá que o `vercel env pull` as obtém.
