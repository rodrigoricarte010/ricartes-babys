/**
 * Configuração do Supabase.
 *
 * Se as variáveis não existirem, o app funciona normalmente em modo local.
 * Nada aqui lança erro: a ausência de nuvem é um estado suportado.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;

/** Verdadeiro somente com URL válida e chave anon presentes. */
export const isCloudConfigured =
  url.length > 0 && anonKey.length > 0 && /^https?:\/\//.test(url);

export const FAMILY_NAME = process.env.NEXT_PUBLIC_FAMILY_NAME?.trim() || "Ricartes";

/** Mensagem curta para a interface quando a nuvem não está ativa. */
export const CLOUD_HINT = isCloudConfigured
  ? null
  : "Modo local: os dados ficam apenas neste aparelho. Configure o Supabase em Configurações para sincronizar entre celulares.";
