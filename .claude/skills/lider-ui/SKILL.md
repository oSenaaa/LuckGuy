---
name: lider-ui
description: Use SEMPRE que criar, editar, revisar ou refinar qualquer página, componente, layout, ícone ou estilo da interface do sistema Líder Treinamentos (painel admin e site). Define tipografia, ícones, cores, layout de páginas e padrões obrigatórios.
---

# Design system — Líder Treinamentos

Stack: Next.js + Tailwind + shadcn/ui. Tema dark é o principal; o light precisa funcionar igual.
As CORES atuais estão aprovadas: não alterar os tokens de cor existentes em globals.css, apenas aplicar as regras de uso abaixo.

## Ícones
- Biblioteca única: Phosphor (`@phosphor-icons/react`). Remover todos os imports de `lucide-react` ao refatorar uma tela.
- Peso padrão: `regular`. Item ativo do menu: `fill`.
- Tamanhos: 16 (dentro de botões, badges e inputs), 18 (menu lateral), 20 (ações isoladas).
- Mapeamento fixo:
  - Painel → SquaresFour
  - Empresas → Buildings
  - Treinamentos → BookOpenText
  - Turmas → UsersThree
  - Modelo de certificado → Certificate
  - Assinaturas → Signature
  - Configurações → GearSix
  - Ver site → ArrowSquareOut
  - Buscar → MagnifyingGlass
  - Novo/adicionar → Plus
  - Importar → UploadSimple / Baixar → DownloadSimple
  - Mais ações → DotsThreeVertical
- Não usar ícone decorativo ao lado do título da página.

## Tipografia
- Fonte: Geist Sans (via `geist/font`), fallback system-ui. Números em tabelas com `tabular-nums`.
- Escala (usar só estas):
  - Título da página: text-2xl font-semibold tracking-tight
  - Título de card/seção: text-base font-semibold
  - Corpo e itens de menu: text-sm
  - Labels de formulário: text-sm font-medium
  - Texto de apoio/descrições: text-sm text-muted-foreground
  - Cabeçalho de tabela: text-xs font-medium uppercase tracking-wide text-muted-foreground
  - Metadados/legendas: text-xs text-muted-foreground
- Nunca exibir dados do usuário em CAIXA ALTA forçada; normalizar nomes de empresa para exibição.
- Descrições com no máximo 1 linha e meia. Texto longo de instrução vai para tooltip, popover "Como funciona" ou para o próprio dialog da ação.

## Cores (uso)
- `primary` (rosa da marca): somente ação principal da tela, item ativo do menu e foco. No máximo 1 botão primary visível por área.
- Botões secundários: variant `outline` ou `ghost`.
- Status nunca usa primary:
  - Publicada/Ativa → verde (bg-emerald-500/15 text-emerald-400)
  - Rascunho → neutro (bg-muted text-muted-foreground)
  - Pendente de assinatura → âmbar (bg-amber-500/15 text-amber-400)
  - Encerrada/Cancelada → vermelho discreto (bg-red-500/15 text-red-400)
- Badges: text-xs font-medium, rounded-md, px-2 py-0.5, com ponto de cor à esquerda.

## Layout
- Sidebar: largura 240px, itens h-9 px-3 text-sm, gap de ícone 3. Agrupar com labels pequenos:
  - "Gestão": Painel, Empresas, Treinamentos, Turmas
  - "Certificados": Modelo de certificado, Assinaturas
  - Rodapé: Configurações, Ver site, avatar com nome e e-mail
- Conteúdo: max-w-6xl, padding px-6 py-8, alinhado à esquerda com a sidebar (não centralizar com vazio dos dois lados).
- Cabeçalho de página: título + descrição curta à esquerda; ações da página à direita, na mesma linha.
- Espaçamento vertical entre seções: space-y-6.

## Padrões de página
- Páginas de cadastro (Empresas, Treinamentos, Turmas):
  1. Cabeçalho com botão primary "Nova X" à direita e, ao lado, botão outline com dropdown para ações secundárias (Importar planilha, Baixar modelo, Exportar).
  2. Barra de filtros/busca.
  3. Tabela (DataTable do shadcn) com paginação e estado vazio.
  4. Criação/edição em Sheet lateral (lado direito, largura ~480px), nunca como formulário fixo no topo da página.
  5. Importação em Dialog com os passos numerados: baixar modelo → enviar arquivo → revisar prévia → confirmar.
- Painel:
  1. Linha de 4 cards de métrica (título text-sm muted, valor text-3xl font-semibold tabular-nums, variação ou link "ver todos").
  2. Tabela "Turmas recentes" com status e ações.
  3. Sem botões de atalho que repetem o menu lateral.

## Formulários
- Labels acima do campo; placeholder só como exemplo, nunca como instrução.
- Máscaras em CNPJ/CPF e telefone (formatar enquanto digita) em vez de "Somente números".
- Erros de validação abaixo do campo em text-xs text-destructive.
- Botões de submit alinhados à direita no rodapé do Sheet/Dialog, com Cancelar (ghost) antes.

## Estados obrigatórios
Todo componente interativo: hover, focus-visible, disabled e loading. Toda tabela: skeleton ao carregar e estado vazio com ícone, frase curta e botão da ação principal.

## Processo ao refinar uma tela
1. Listar o que está fora deste padrão ANTES de editar e mostrar a lista.
2. Aplicar primeiro layout, depois tipografia, depois ícones, depois estados.
3. Não alterar lógica de negócio, rotas, queries ou validações de backend.
4. Refatorar uma página por vez e parar para revisão.
