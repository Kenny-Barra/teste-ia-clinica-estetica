export type ConversationStatus =
  | "em_andamento"
  | "encerrada"
  | "aguardando_humano";

export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: ConversationStatus | string;
  intent: string | null;
  created_at: string;
  last_message_at: string;
}

export interface ConversationWithCount extends Conversation {
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | string;
  content: string;
  message_type: "text" | "image" | "audio" | string;
  created_at: string;
}

export interface DashboardMetrics {
  totalConversations: number;
  totalMessages: number;
  conversationsToday: number;
}

export interface DailyCount {
  /** rótulo curto p/ eixo X, ex: "23/06" */
  label: string;
  /** data ISO (YYYY-MM-DD) no fuso de São Paulo */
  date: string;
  count: number;
}
