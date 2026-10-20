import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isCloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Renovação de sessão do Supabase.
 *
 * O token de acesso expira em cerca de uma hora. Sem este middleware o cookie
 * não é renovado, e a sessão morre silenciosamente no meio do uso — o usuário
 * parece "deslogado" sem ter saído. Aqui cada request passa pelo
 * `getUser()`, que renova o cookie quando necessário.
 *
 * Em modo local (sem as variáveis do Supabase) nada acontece: o app continua
 * funcionando só com IndexedDB.
 */
export async function middleware(request: NextRequest) {
  if (!isCloudConfigured) return NextResponse.next({ request });

  // Precisa ser reconstruído a cada `setAll` para levar os cookies novos tanto
  // na resposta quanto na requisição vista pelos Server Components.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Não remova: é esta chamada que renova o token e grava o cookie atualizado.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  /**
   * Fora do matcher: arquivos estáticos do Next, ícones, manifest e imagens.
   * Rodar o refresh neles só gastaria tempo e não há sessão a renovar.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
