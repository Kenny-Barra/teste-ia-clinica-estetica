"use client";

import { useState } from "react";
import { ConversationWithCount } from "@/lib/types";
import { timeAgo } from "@/lib/dates";
import StatusBadge from "@/components/StatusBadge";
import MessagesDrawer from "@/components/MessagesDrawer";

export default function ConversationsList({
  conversations,
}: {
  conversations: ConversationWithCount[];
}) {
  const [selected, setSelected] = useState<ConversationWithCount | null>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-medium text-slate-500">
          Conversas ({conversations.length})
        </h2>
      </div>

      {conversations.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-400">
          Nenhuma conversa ainda. Assim que um cliente mandar mensagem no
          WhatsApp, ela aparece aqui.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c)}
                className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
                  {(c.name?.trim()?.[0] ?? c.phone.slice(-2, -1)).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">
                      {c.name?.trim() || c.phone}
                    </p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {c.phone} · {c.message_count}{" "}
                    {c.message_count === 1 ? "mensagem" : "mensagens"}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {timeAgo(c.last_message_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <MessagesDrawer
        conversation={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
