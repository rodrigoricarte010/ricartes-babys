import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isCloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Sessão do Supabase + porta de entrada do app.
 *
 * Faz duas coisas, nesta ordem:
 *
 *   1. Renova o token de acesso. Ele expira em cerca de uma hora; sem isso o
 *      cookie não é atualizado e a sessão morre silenciosamente no meio do uso.
 *   2. Exige autenticação. Sem sessão, qualquer rota privada cai em /entrar;
 *      com sessão, /entrar manda direto para o painel.
 *
 * Em modo local (sem as variáveis do Supabase configuradas) o middleware não
 * exige nada: o app continua funcionando só com IndexedDB. Isso também evita
 * um loop de redirecionamento num deploy de desenvolvimento sem as chaves.
 */

/** Rotas que não exigem sessão. */
const PUBLIC_PATHS = ["/entrar", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Leva os cookies renovados para dentro do redirect.
 *
 * Sem isso o `getUser()` grava o token novo numa resposta que é descartada, e
 * o navegador segue com o cookie antigo — o que produz o clássico vaivém de
 * login: entra em /painel, é mandado de volta para /entrar, e assim por diante.
 */
function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
  const target = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  if (user && pathname === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    url.search = "";
    return redirectWithCookies(url, response);
  }

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
