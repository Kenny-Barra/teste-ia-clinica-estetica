// Helpers de data no fuso de São Paulo (UTC-3 fixo — o Brasil não tem mais
// horário de verão desde 2019, então tratar como offset fixo é seguro e
// dispensa libs de timezone).

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3

/** Retorna a "data SP" (YYYY-MM-DD) de um Date. */
export function spDateKey(d: Date): string {
  return new Date(d.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);
}

/** Início do dia SP (instante UTC) para uma data YYYY-MM-DD. */
export function spDayStartISO(dateKey: string): string {
  return `${dateKey}T00:00:00.000-03:00`;
}

/** Lista das últimas N "datas SP" (YYYY-MM-DD), da mais antiga p/ a mais nova. */
export function lastNDateKeys(n: number): string[] {
  const nowSp = new Date(Date.now() - SP_OFFSET_MS);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(nowSp.getTime() - i * 24 * 60 * 60 * 1000);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

/** "2026-06-23" -> "23/06" */
export function shortLabel(dateKey: string): string {
  const [, m, day] = dateKey.split("-");
  return `${day}/${m}`;
}

/** Formata um timestamp ISO como hora local SP, ex "23/06 14:32". */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "há 5 min", "há 2 h", "ontem"... a partir de um ISO. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} dias`;
  return formatDateTime(iso);
}
