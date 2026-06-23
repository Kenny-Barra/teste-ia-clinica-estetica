-- Migration 0001 — schema compartilhado entre o agente do n8n (escreve) e o
-- dashboard Next.js (le). Rode no SQL Editor do Supabase.

-- conversations: uma linha por contato/thread de WhatsApp
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  status text not null default 'em_andamento', -- em_andamento | encerrada | aguardando_humano
  intent text,                                  -- orcamento | duvida | agendamento | outro (opcional)
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

-- messages: uma linha por mensagem
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,                           -- 'user' | 'assistant'
  content text not null,
  message_type text not null default 'text',    -- text | image | audio
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on messages (conversation_id, created_at);
create index if not exists conversations_last_message_idx
  on conversations (last_message_at desc);

-- RLS: o dashboard usa a anon key (publica). Habilitamos RLS e permitimos
-- apenas leitura (select) anonima. A escrita vem do n8n, que se conecta direto
-- ao Postgres com a connection string (service role / senha), entao nao depende
-- destas policies.
alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "anon can read conversations" on conversations;
create policy "anon can read conversations"
  on conversations for select
  to anon
  using (true);

drop policy if exists "anon can read messages" on messages;
create policy "anon can read messages"
  on messages for select
  to anon
  using (true);
