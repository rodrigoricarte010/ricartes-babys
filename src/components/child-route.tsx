"use client";

import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/**
 * Garante que a criança da URL seja a criança ativa.
 *
 * Sem isso, abrir /filhos/abc/crescimento por link direto mostraria os dados
 * da última criança usada — confuso e, num app de saúde, perigoso.
 */
export function ChildRoute({ childId, children }: { childId: string; children: ReactNode }) {
  const { activeChild, setActiveChildId, ready } = useStore();

  useEffect(() => {
    if (ready && activeChild?.id !== childId) setActiveChildId(childId);
  }, [ready, activeChild?.id, childId, setActiveChildId]);

  return <>{children}</>;
}
