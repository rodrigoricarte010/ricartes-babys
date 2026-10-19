"use client";

import Link from "next/link";
import { Ruler } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { targetHeight } from "@/lib/health";
import type { Child } from "@/lib/types";

/**
 * Alvo genético de estatura pela fórmula de Tanner (média parental corrigida
 * pelo sexo, faixa de ±8,5 cm). É uma estimativa de conversa de consultório —
 * as curvas da OMS e o pediatra acompanham o crescimento real.
 */
export function TargetHeightCard({ child }: { child: Child }) {
  const t = targetHeight(child.sex, child.fatherHeightCm, child.motherHeightCm);

  if (!t) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <Ruler className="size-5" aria-hidden />
          </span>
          <p className="text-[13px] leading-relaxed text-fg-muted">
            <span className="font-bold text-fg">Previsão de altura adulta: </span>
            informe a altura do pai e da mãe no perfil para calcular o alvo genético
            (fórmula de Tanner).{" "}
            <Link href={`/filhos/${child.id}`} className="font-semibold text-brand-600 underline decoration-brand-300 underline-offset-2 dark:text-brand-400">
              Informar alturas
            </Link>
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
          <Ruler className="size-5.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-fg-muted">Previsão de altura adulta (Tanner)</p>
          <p className="mt-0.5 text-xl font-extrabold tabular text-fg">
            {t.min}–{t.max} cm
            <span className="ml-2 text-sm font-semibold text-fg-subtle">alvo ≈ {t.mid} cm</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-subtle">
            Estimativa genética pela altura dos pais (faixa de ±8,5 cm). Serve de referência
            de consultório — o crescimento real é o que a curva da OMS mostra.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
