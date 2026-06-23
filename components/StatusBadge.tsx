const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  em_andamento: {
    label: "Em andamento",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  aguardando_humano: {
    label: "Aguardando humano",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  encerrada: {
    label: "Encerrada",
    className: "bg-slate-200 text-slate-700 ring-slate-300",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}
