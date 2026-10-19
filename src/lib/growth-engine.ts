"use client";

import { useEffect, useState } from "react";

/**
 * Carregamento preguiçoso das tabelas da OMS.
 *
 * O pacote `who-growth-standards` traz as tabelas LMS oficiais completas:
 * ~520 KB de JavaScript (~110 KB comprimidos). É muito para vir junto com o
 * primeiro carregamento do app, então fica num chunk separado que só é
 * buscado quando alguma tela realmente precisa de percentil.
 */
export type GrowthEngine = typeof import("./growth");

let cached: GrowthEngine | null = null;
let inflight: Promise<GrowthEngine> | null = null;

export function loadGrowthEngine(): Promise<GrowthEngine> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = import("./growth").then((mod) => {
      cached = mod;
      return mod;
    });
  }
  return inflight;
}

/** Hook: `engine` é `null` enquanto o chunk das tabelas ainda não chegou. */
export function useGrowthEngine(): { engine: GrowthEngine | null; error: string | null } {
  const [engine, setEngine] = useState<GrowthEngine | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) {
      setEngine(cached);
      return;
    }
    let alive = true;
    loadGrowthEngine()
      .then((mod) => {
        if (alive) setEngine(mod);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Falha ao carregar as tabelas da OMS.");
      });
    return () => {
      alive = false;
    };
  }, []);

  return { engine, error };
}
