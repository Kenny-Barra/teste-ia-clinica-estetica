# CLAUDE.md — Teste Técnico: Analista de IA e Automações

## Contexto e missão

Estou (Kenny) fazendo um teste técnico com **entrega para amanhã**. São dois desafios que compartilham um banco de dados. Você (Claude Code) vai escrever o código e a infra-como-arquivo; eu faço a parte manual (criar contas, escanear QR do WhatsApp, deploy, gravar vídeos).

**Regra de ouro deste projeto: MVP primeiro, sem firula.** Nada de diferenciais (RAG, análise de sentimento, CI/CD, auth, etc.) até o mínimo dos dois desafios estar funcionando e publicado. Se eu não pedir explicitamente, não implemente diferencial.

## Restrições

- **Custo zero.** Só stack gratuita: Docker Desktop (free), Supabase (free), Gemini (free), Vercel (Hobby free), GitHub, Loom/OBS.
- **Prazo curtíssimo.** Otimize para "funcionando e publicado", não para perfeição.
- Código legível, estrutura de pastas organizada, **commits incrementais** ao longo do caminho (o teste avalia iteração — não jogue um commit único no fim).

## Arquitetura (decidida, não mude sem me avisar)

```
WhatsApp (número real) ⇄ Evolution API ⇄ n8n
   n8n: recebe msg → grava no Supabase → Gemini → grava resposta → responde via Evolution
                          ↓
                      Supabase (Postgres)  ←── Dashboard (Next.js na Vercel, lê o Supabase)
```

- **Evolution API + n8n + Postgres** rodam LOCAL via Docker (`docker-compose`). Tudo é saída ou localhost-pra-localhost, então **não precisa de túnel (ngrok/cloudflared)**.
- **Supabase** é o banco compartilhado: o n8n grava as conversas dos clientes, o dashboard lê de lá. É isso que satisfaz o requisito "dados reais, sem mock".
- O **dashboard** é a peça que você (Claude Code) constrói por inteiro.

## Divisão de trabalho

**Você (Claude Code) faz:**
1. Verificar pré-requisitos (Node 18+, Git, Docker) e me ajudar a instalar o que faltar.
2. `docker-compose.yml` que sobe Evolution API + n8n + Postgres.
3. Arquivo de migration SQL do Supabase (schema abaixo).
4. Dashboard Next.js completo lendo o Supabase.
5. README com seção "Vibe Coding Journal".
6. Me dar o passo-a-passo EXATO de deploy na Vercel.

**Eu (Kenny) faço manualmente — não tente fazer por mim:**
- Criar contas: Supabase, Vercel, GitHub; gerar a API key do Gemini.
- Escanear o QR code do WhatsApp no celular.
- Montar o fluxo visual no n8n (eu monto com ajuda à parte; você só precisa garantir que o schema do banco bate).
- `git push`, conectar Vercel, colar as chaves nos painéis, gravar os 2 vídeos.

**Quando precisar de um segredo (URL/anon key do Supabase, API key do Gemini, key da Evolution), PARE e me peça.** Não invente valores nem coloque placeholder e siga em frente.

## Schema do Supabase (use exatamente isto)

```sql
-- conversations: uma linha por contato/thread de WhatsApp
create table conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  status text not null default 'em_andamento', -- em_andamento | encerrada | aguardando_humano
  intent text,                                  -- orcamento | duvida | agendamento | outro (opcional)
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

-- messages: uma linha por mensagem
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,                           -- 'user' | 'assistant'
  content text not null,
  message_type text not null default 'text',    -- text | image | audio
  created_at timestamptz not null default now()
);

create index on messages (conversation_id, created_at);
create index on conversations (last_message_at desc);
```

> Importante: as "conversas" que o dashboard lista são as dos **clientes no WhatsApp** falando com o agente da clínica. Não são conversas minhas com a IA.

## Desafio 1 — Agente de WhatsApp no n8n (nicho: clínica de estética)

Eu monto o fluxo no n8n. Você precisa garantir só que:
- O `docker-compose.yml` sobe Evolution API **fixada na versão `v2.3.7`** (a v2.4.0+ exige ativação de licença e trava), com um **volume montado em `/evolution/instances`** (sem isso a sessão do WhatsApp se perde a cada restart) e Postgres.
- O n8n sobe junto, com volume persistente para os workflows.
- Documente no README como subir (`docker compose up -d`) e as URLs locais (Evolution Manager, n8n).

### Prompt do agente (para eu colar no nó de IA do n8n)

> Você é a atendente virtual de uma clínica de estética em Belo Horizonte. Atende mulheres interessadas em procedimentos estéticos faciais e corporais. Seu tom é caloroso, próximo e profissional, em português brasileiro coloquial. NUNCA use travessões (—) nas mensagens. Mantenha respostas curtas, próprias para WhatsApp.
>
> Seus objetivos, nesta ordem: (1) acolher a pessoa; (2) entender o que ela procura; (3) qualificar o interesse (qual procedimento, qual a expectativa, qual a urgência); (4) responder dúvidas frequentes sobre procedimentos, valores aproximados e como funciona o agendamento.
>
> Classifique mentalmente a intenção em: orçamento, dúvida, agendamento, ou outro. Se a pessoa pedir algo que exige uma pessoa real (negociar valor, caso clínico específico, reclamação), diga que vai chamar uma atendente humana e sinalize que a conversa precisa de intervenção humana.
>
> Nunca prometa resultado clínico nem dê diagnóstico médico. Para procedimentos, fale de forma geral e sempre direcione para uma avaliação presencial.

## Desafio 2 — Dashboard (você constrói inteiro)

Stack: **Next.js (App Router) + Supabase + deploy Vercel**. TypeScript. Tailwind para estilo. `recharts` para o gráfico.

### Escopo MVP (só isto):
1. **Cards de métricas no topo:** total de conversas, total de mensagens, conversas de hoje.
2. **Um gráfico** simples de barras: conversas por dia (últimos 7-14 dias).
3. **Lista de conversas:** telefone, nome (se houver), badge de status, qtd de mensagens, última atividade. Ordenar por `last_message_at` desc.
4. **Ver mensagens de uma conversa:** ao clicar, abrir as mensagens (drawer ou página de detalhe), mostrando role (cliente/agente) e horário.
5. Responsivo, UX clara.

### Regras técnicas:
- Ler do Supabase via `@supabase/supabase-js`. Use as chaves `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (me peça os valores).
- **Sem dados mockados, sem seed estático.** O dashboard tem que refletir o que estiver no Supabase de verdade.
- Atualização pode ser por refresh manual no MVP. (Realtime do Supabase fica como possível diferencial DEPOIS, só se eu pedir.)
- Estrutura sugerida: `/app`, `/components`, `/lib/supabase.ts`, `/supabase/migrations/0001_init.sql`, `docker-compose.yml` na raiz, `README.md`.

### README precisa conter:
- Stack utilizada e por quê.
- Como rodar localmente (Docker + dashboard).
- Decisões de arquitetura (por que Supabase como banco compartilhado, por que Evolution local, etc.).
- Seção **"Vibe Coding Journal"**: ferramenta usada (Claude Code), estratégia, prompts que funcionaram melhor, onde a IA errou e como corrigi.

## Ordem de execução sugerida

1. Verificar/instalar pré-requisitos.
2. Inicializar o repositório Git e a estrutura de pastas. **Primeiro commit.**
3. Escrever o `docker-compose.yml` (Evolution v2.3.7 + n8n + Postgres). Commit.
4. Escrever o `supabase/migrations/0001_init.sql`. Commit.
5. Scaffold do Next.js + Supabase client + layout. Commit.
6. Construir métricas, lista e detalhe de conversa. Commits por etapa.
7. README + Vibe Coding Journal. Commit.
8. Me dar o passo-a-passo de deploy na Vercel.

Antes de começar a codar, me confirme o plano em 3 linhas e me diga qual o primeiro segredo/conta que você vai precisar de mim.
