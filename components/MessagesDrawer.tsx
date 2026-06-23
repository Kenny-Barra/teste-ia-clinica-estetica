"use client";

import { useEffect, useState } from "react";
import { getMessages } from "@/lib/data";
import { ConversationWithCount, Message } from "@/lib/types";
import { formatDateTime } from "@/lib/dates";
import StatusBadge from "@/components/StatusBadge";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
          isUser
            ? "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
            : "rounded-br-sm bg-brand text-white"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isUser ? "text-slate-400" : "text-pink-100"
          }`}
        >
          {isUser ? "Cliente" : "Agente"} · {formatDateTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function MessagesDrawer({
  conversation,
  onClose,
}: {
  conversation: ConversationWithCount | null;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversation) return;
    let active = true;
    setLoading(true);
    setError(null);
    getMessages(conversation.id)
      .then((data) => active && setMessages(data))
      .catch((e) => active && setError(e.message ?? "Erro ao carregar mensagens"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [conversation]);

  // Fecha com ESC
  useEffect(() => {
    if (!conversation) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [conversation, onClose]);

  const open = conversation !== null;
  const title = conversation?.name?.trim() || conversation?.phone || "";

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* painel lateral */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-slate-50 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {conversation && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-900">
                  {title}
                </h2>
                <p className="text-xs text-slate-500">{conversation.phone}</p>
                <div className="mt-2">
                  <StatusBadge status={conversation.status} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {loading && (
                <p className="text-center text-sm text-slate-400">
                  Carregando mensagens…
                </p>
              )}
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              {!loading && !error && messages.length === 0 && (
                <p className="text-center text-sm text-slate-400">
                  Nenhuma mensagem nesta conversa.
                </p>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
