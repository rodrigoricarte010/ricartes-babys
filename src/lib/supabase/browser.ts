"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isCloudConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Cliente Supabase para o navegador. Retorna `null` se a nuvem não estiver ativa. */
export function getSupabaseBrowser() {
  if (!isCloudConfigured) return null;
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
