"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    // o estado de "pending" some quando o server component recarrega
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <button
      onClick={refresh}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      <span className={spinning ? "animate-spin" : ""}>↻</span>
      Atualizar
    </button>
  );
}
