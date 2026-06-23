# Atendimento WhatsApp + Dashboard — Clínica de Estética

Teste técnico (Analista de IA e Automações). São dois desafios que compartilham
um banco de dados:

1. **Agente de WhatsApp** (n8n + Evolution API + Gemini) que atende clientes de
   uma clínica de estética e grava a conversa.
2. **Dashboard** (Next.js na Vercel) que lê esse mesmo banco e mostra métricas,
   gráfico e as conversas.

```
WhatsApp (número real) ⇄ Evolution API ⇄ n8n
   n8n: recebe msg → grava no Supabase → Gemini → grava resposta → responde via Evolution
                          ↓
                      Supabase (Postgres)  ←── Dashboard (Next.js / Vercel, lê o Supabase)
```

O **Supabase** é o ponto de encontro: o n8n escreve as conversas dos clientes lá,
e o dashboard lê de lá. É isso que garante "dados reais, sem mock".

---

## Stack e o porquê

| Camada | Escolha | Por quê |
|---|---|---|
| Mensageria WhatsApp | **Evolution API v2.3.7** | API de WhatsApp gratuita e self-hosted. Fixada na v2.3.7 porque a v2.4.0+ exige ativação de licença. |
| Orquestração | **n8n** (self-hosted) | Monta o fluxo visual (webhook → banco → IA → resposta) sem escrever backend. |
| IA | **Google Gemini** (`gemini-2.0-flash`) | Free tier generoso, ótimo em PT-BR, chamada simples via HTTP. |
| Banco compartilhado | **Supabase (Postgres)** | Postgres gerenciado no free tier; serve de banco para o n8n **e** para o dashboard, com API REST pronta (anon key) para o front. |
| Dashboard | **Next.js 14 (App Router) + TypeScript** | Server Components leem o Supabase no request; deploy trivial na Vercel. |
| Estilo / Gráfico | **Tailwind CSS** + **Recharts** | UI rápida e responsiva; gráfico de barras pronto. |
| Infra local | **Docker Compose** | Sobe Evolution + n8n + Postgres + Redis com um comando. |
| Deploy | **Vercel (Hobby)** | Free, integra com GitHub, variáveis de ambiente no painel. |

Custo total: **R$ 0** (tudo em free tier).

---

## Estrutura do projeto

```
.
├── docker-compose.yml            # Evolution v2.3.7 + n8n + Postgres + Redis (local)
├── n8n-agente-estetica.json      # fluxo do agente para importar no n8n
├── supabase/
│   └── migrations/0001_init.sql  # schema (conversations, messages, índices, RLS)
├── app/                          # Next.js App Router (layout + página)
├── components/                   # cards, gráfico, lista, drawer de mensagens
├── lib/                          # client do Supabase, data fetching, helpers de data
├── .env.example                  # modelo das chaves do dashboard
└── README.md
```

---

## Como rodar localmente

### Pré-requisitos
- Node 18+ (testado no 20) e npm
- Docker Desktop (com WSL 2 atualizado no Windows: `wsl --update`)
- **~5 GB livres em disco** — as imagens somam ~4 GB. Se o disco encher durante
  o `docker compose up`, a imagem é extraída corrompida (arquivos com 0 byte) e o
  Evolution reinicia em loop; nesse caso, libere espaço e rode
  `docker compose pull evolution` de novo.
- Uma conta no Supabase e uma API key do Google Gemini (free)

### 1) Banco (Supabase)
1. Crie um projeto no [Supabase](https://supabase.com).
2. Em **SQL Editor**, cole e rode o conteúdo de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Em **Settings → API**, anote a **Project URL** e a **anon key** (para o
   dashboard) e, em **Settings → Database**, a **connection string** (para o n8n).

### 2) Stack local (Desafio 1)
```bash
docker compose up -d
```
URLs:
- **Evolution Manager:** http://localhost:8080/manager
- **n8n:** http://localhost:5678

Depois, no n8n:
1. **Importe** `n8n-agente-estetica.json` (Workflows → Import from File).
2. No nó **Gemini**, troque `YOUR_GEMINI_API_KEY` na URL pela sua chave do Gemini.
3. No nó **Envia WhatsApp**, no header `apikey`, use a chave da Evolution
   (default do compose: `estetica-bh-evolution-key-2026`, ou a que você definiu
   em `EVOLUTION_API_KEY`).
4. Nos três nós **Postgres**, crie uma credencial apontando para o **Supabase**
   (host/porta/usuário/senha/db da connection string). É assim que o agente grava
   as conversas no banco compartilhado.
5. No **Evolution Manager**, crie uma instância chamada **`main`** (o fluxo envia
   para `/message/sendText/main`), escaneie o QR code com o WhatsApp e configure o
   **webhook** da instância para `http://n8n:5678/webhook/whatsapp`, evento
   `MESSAGES_UPSERT`.
6. Ative o workflow no n8n.

> Observação: Evolution e n8n conversam dentro da rede do Docker, e o n8n só faz
> chamadas de saída (Supabase, Gemini). Por isso **não é preciso túnel**
> (ngrok/cloudflared).

### 3) Dashboard (Desafio 2)
```bash
cp .env.example .env.local      # preencha com a URL e a anon key do Supabase
npm install
npm run dev                     # http://localhost:3000
```

---

## Decisões de arquitetura

- **Supabase como banco compartilhado.** Em vez de o dashboard chamar o n8n ou a
  Evolution, ambos os desafios convergem para o mesmo Postgres. O n8n escreve via
  connection string (dono da tabela, ignora RLS); o dashboard lê via anon key.
- **Evolution local, sem túnel.** Todo o tráfego é interno ao Docker ou saída para
  a internet. Não há webhook de entrada vindo da internet, então não precisa expor
  nada publicamente.
- **RLS ligado, anon só lê.** A migration habilita Row Level Security e libera
  apenas `select` para o papel `anon`. A anon key é pública por natureza (vai no
  bundle do front), então o banco nunca aceita escrita por ela.
- **Server Components + `force-dynamic`.** A página lê o Supabase a cada request
  (sem cache estático), garantindo dados reais. O `next build` não quebra mesmo
  sem as chaves porque o client do Supabase é criado de forma preguiçosa, só no
  request.
- **Fuso de São Paulo fixo (UTC-3).** "Conversas de hoje" e o gráfico por dia são
  calculados em horário de Brasília. Como o Brasil não tem mais horário de verão,
  tratar como offset fixo dispensa biblioteca de timezone.

---

## Deploy do dashboard na Vercel

1. Suba o repositório para o GitHub (`git push`).
2. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o repo.
3. Framework: **Next.js** (detectado sozinho). Não mexa em build/output.
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` → a Project URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → a anon key
5. **Deploy.** Ao abrir a URL, o painel já mostra o que estiver no Supabase.
   Para ver novas conversas, use o botão **Atualizar**.

---

## Vibe Coding Journal

**Ferramenta:** Claude Code (Opus), pilotado pelo Kenny.

**Estratégia.** A regra do projeto foi *MVP primeiro, sem firula*. Em vez de pedir
"faz um dashboard", quebrei o trabalho em passos pequenos e verificáveis e deixei
o brief inteiro num `CLAUDE.md` na raiz, com schema, prompt do agente e divisão de
trabalho (o que a IA faz x o que eu faço na mão). Isso manteve a IA no trilho:
infra-como-arquivo, commits incrementais a cada etapa, e *pausa para me pedir
segredo* em vez de inventar valor.

**Prompts que funcionaram melhor.**
- Dar **contexto persistente** num arquivo (`CLAUDE.md`) em vez de repetir tudo a
  cada mensagem — a IA passou a respeitar restrições (custo zero, sem mock, sem
  travessão no agente) sozinha.
- Ser explícito sobre **versão e armadilha** ("Evolution fixada na v2.3.7 porque a
  v2.4.0+ pede licença", "volume em `/evolution/instances` senão a sessão se
  perde") — evitou que a IA usasse `latest` e quebrasse.
- Pedir **commits por etapa** desde o começo, então o histórico conta a iteração.

**Onde a IA errou / precisei corrigir (código).**
- O scaffold inicial criava o client do Supabase no topo do módulo, o que faria o
  `next build` quebrar sem as chaves. Ajustei para criação preguiçosa + página
  `force-dynamic` — assim builda na Vercel mesmo antes de configurar as env vars.
- A versão do Next escolhida (`14.2.15`) tinha um aviso de segurança; subi para o
  patch mais recente da linha 14.2 sem pular para a 15 (que pediria React 19 e
  mexeria no Recharts).
- "Conversas de hoje" calculado em UTC contava errado perto da meia-noite; troquei
  para horário de Brasília (UTC-3 fixo).
- A Evolution v2 depende de cache; subir só com cache local é frágil, então
  adicionei o Redis ao `docker-compose` e o boot ficou confiável.

**Bugs reais que só apareceram rodando o fluxo (e foram corrigidos).**
- **Imagem da Evolution no repo errado.** `atendai/evolution-api` parou na v2.2.3;
  a v2.3.7 está no repo oficial atual `evoapicloud/evolution-api`. O `docker compose`
  falhava com "not found" até trocar.
- **Modelo do Gemini 404.** O fluxo vinha com `gemini-2.0-flash`, que retorna 404
  na API atual. Listei os modelos da minha chave e troquei para `gemini-2.5-flash`.
- **Mensagem truncada na vírgula.** Os nós Postgres usavam `queryReplacement`
  separado por vírgula — o n8n quebra isso no primeiro `,`, então "Oi, queria saber..."
  era salvo só como "Oi". Descobri testando o pipeline com uma mensagem real e
  corrigi passando os parâmetros como array (`[id, texto]`), à prova de vírgula.

**As maiores batalhas (debugging de infra).**
- **WSL desatualizado.** O Docker Desktop não subia ("problem with WSL"): o kernel
  do WSL 2 estava ausente e a versão era antiga demais (`wsl --version` nem existia).
  Resolvido com `wsl --update` num terminal admin.
- **Disco cheio corrompendo imagem.** A pior: a Evolution reiniciava em loop saindo
  com *exit 0 e zero logs*. Descartei arquitetura, RAM e config até inspecionar o
  filesystem do container e achar arquivos críticos com **0 byte** (o schema do
  Prisma e o script de migration). A causa: o C: tinha enchido (0 byte livre) bem
  na hora da extração da imagem, gerando arquivos truncados. Re-baixei a imagem e
  voltou. Depois movi o disco do Docker para outro drive (`F:`) com `Disk image
  location`, eliminando o problema de vez.

**Automação além do código.** Boa parte do setup manual foi automatizada via API,
deixando para mim só o que exige olho/mão humana (instalar Docker, escanear o QR):
a migration rodou pela **Management API do Supabase**; a instância e o webhook do
WhatsApp pela **API da Evolution**; e o n8n inteiro (credencial do Postgres, import
do fluxo com as chaves embutidas e ativação) pela **API pública do n8n**. Antes de
publicar o repositório, validei que nenhuma chave secreta tinha vazado para arquivos
versionados — segredos ficam em `.env.local`/credenciais, nunca no Git.
