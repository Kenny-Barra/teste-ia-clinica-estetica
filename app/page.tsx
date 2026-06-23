import MetricCards from "@/components/MetricCards";
import ConversationsChart from "@/components/ConversationsChart";
import ConversationsList from "@/components/ConversationsList";
import RefreshButton from "@/components/RefreshButton";
import {
  getConversations,
  getDailyConversations,
  getMetrics,
} from "@/lib/data";

// Sempre lê do Supabase no request (sem cache estático) — dados reais.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let content: React.ReactNode;

  try {
    const [metrics, daily, conversations] = await Promise.all([
      getMetrics(),
      getDailyConversations(),
      getConversations(),
    ]);

    content = (
      <div className="space-y-6">
        <MetricCards metrics={metrics} />
        <ConversationsChart data={daily} />
        <ConversationsList conversations={conversations} />
      </div>
    );
  } catch (err: any) {
    content = (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-base font-semibold text-amber-900">
          Não consegui ler o Supabase
        </h2>
        <p className="mt-2 text-sm text-amber-800">
          Confira se as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão configuradas e se a
          migration <code>0001_init.sql</code> já foi aplicada.
        </p>
        <p className="mt-3 rounded bg-amber-100 px-3 py-2 font-mono text-xs text-amber-900">
          {err?.message ?? String(err)}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Painel da Clínica
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Atendimento automático via WhatsApp
          </p>
        </div>
        <RefreshButton />
      </header>

      {content}

      <footer className="mt-12 text-center text-xs text-slate-400">
        Dados em tempo real do Supabase · atualize para ver novas conversas
      </footer>
    </main>
  );
}
