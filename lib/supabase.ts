import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cria um client do Supabase usando a anon key (publica, NEXT_PUBLIC_*).
 *
 * As variaveis sao lidas em tempo de execucao / inlined no bundle do client.
 * A funcao so e chamada quando ja existe um request real (paginas sao
 * `force-dynamic`), entao o `next build` nao quebra mesmo sem as chaves.
 */
function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Variaveis do Supabase ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local ou nas Environment Variables da Vercel)."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Singleton no browser para nao recriar o client a cada render.
let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    // Server: um client novo por request (sem estado compartilhado).
    return createSupabaseClient();
  }
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }
  return browserClient;
}
