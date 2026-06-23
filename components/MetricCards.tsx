import { DashboardMetrics } from "@/lib/types";

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card
        label="Total de conversas"
        value={metrics.totalConversations}
        hint="contatos atendidos no WhatsApp"
      />
      <Card
        label="Total de mensagens"
        value={metrics.totalMessages}
        hint="cliente + agente"
      />
      <Card
        label="Conversas de hoje"
        value={metrics.conversationsToday}
        hint="novos contatos hoje"
      />
    </div>
  );
}
