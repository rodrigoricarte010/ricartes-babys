import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isCloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Retorna `null` quando o modo local está ativo — o chamador decide o que fazer.
 */
export async function getSupabaseServer() {
  if (!isCloudConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado a partir de um Server Component — pode ser ignorado se o
          // middleware estiver renovando a sessão.
        }
      },
    },
  });
}
