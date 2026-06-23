import { getSupabase } from "@/lib/supabase";
import {
  Conversation,
  ConversationWithCount,
  DailyCount,
  DashboardMetrics,
  Message,
} from "@/lib/types";
import {
  lastNDateKeys,
  shortLabel,
  spDateKey,
  spDayStartISO,
} from "@/lib/dates";

const CHART_DAYS = 14;

/** Cards do topo: total de conversas, total de mensagens, conversas de hoje. */
export async function getMetrics(): Promise<DashboardMetrics> {
  const supabase = getSupabase();
  const todayKey = lastNDateKeys(1)[0];

  const [conv, msg, today] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", spDayStartISO(todayKey)),
  ]);

  if (conv.error) throw conv.error;
  if (msg.error) throw msg.error;
  if (today.error) throw today.error;

  return {
    totalConversations: conv.count ?? 0,
    totalMessages: msg.count ?? 0,
    conversationsToday: today.count ?? 0,
  };
}

/** Conversas criadas por dia nos últimos 14 dias (para o gráfico de barras). */
export async function getDailyConversations(): Promise<DailyCount[]> {
  const supabase = getSupabase();
  const days = lastNDateKeys(CHART_DAYS);
  const cutoff = spDayStartISO(days[0]);

  const { data, error } = await supabase
    .from("conversations")
    .select("created_at")
    .gte("created_at", cutoff);

  if (error) throw error;

  const counts = new Map<string, number>(days.map((d) => [d, 0]));
  for (const row of data ?? []) {
    const key = spDateKey(new Date(row.created_at as string));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return days.map((date) => ({
    date,
    label: shortLabel(date),
    count: counts.get(date) ?? 0,
  }));
}

/** Lista de conversas + qtd de mensagens, ordenada por última atividade. */
export async function getConversations(): Promise<ConversationWithCount[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, phone, name, status, intent, created_at, last_message_at, messages(count)"
    )
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    phone: row.phone,
    name: row.name,
    status: row.status,
    intent: row.intent,
    created_at: row.created_at,
    last_message_at: row.last_message_at,
    message_count: row.messages?.[0]?.count ?? 0,
  }));
}

/** Mensagens de uma conversa, em ordem cronológica (usado no drawer). */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, message_type, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export type { Conversation };
