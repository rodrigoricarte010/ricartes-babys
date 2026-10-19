"use client";

import { useMemo, useState } from "react";
import { Dices, Lightbulb } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { activitiesFor } from "@/lib/catalog/activities";
import { CATEGORY_LABEL } from "@/lib/catalog/milestones";
import { ageInDays } from "@/lib/date";

/**
 * "Estimule hoje": três ideias de brincadeira para a idade exata, rotacionáveis.
 * Brincar é como bebê aprende — e a pergunta mais comum de pai/mãe de primeira
 * viagem é justamente "o que eu faço com ela agora?".
 */
export function ActivitiesCard() {
  const { activeChild: child } = useStore();
  const [offset, setOffset] = useState(0);

  const ageMonths = child ? ageInDays(child.birthDate, new Date()) / 30.4375 : 0;
  const band = useMemo(() => activitiesFor(ageMonths), [ageMonths]);

  const picks = useMemo(() => {
    const list = band.activities;
    if (list.length <= 3) return list;
    const start = offset % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]);
  }, [band, offset]);

  if (!child) return null;

  return (
    <Card>
      <CardHeader
        title="Estimule hoje"
        subtitle={`Ideias para a fase ${band.label}`}
        icon={<Lightbulb className="size-4.5" />}
        action={
          <Button variant="ghost" size="sm" onClick={() => setOffset((o) => o + 3)} aria-label="Mostrar outras ideias">
            <Dices className="size-4" aria-hidden />
            Outras
          </Button>
        }
      />
      <CardBody className="space-y-3 pt-2">
        {picks.map((act) => (
          <div key={act.id} className="rounded-xl border border-line bg-bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-fg">{act.title}</p>
              <Badge tone="neutral">{CATEGORY_LABEL[act.category]}</Badge>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{act.how}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-fg-subtle">~{act.minutes} min · repetição curta vale mais que sessão longa</p>
          </div>
        ))}
        <p className="text-[11px] leading-relaxed text-fg-subtle">
          Siga o interesse dela, não a lista: se uma brincadeira não engaja hoje, guarde para a semana
          que vem. Presença atento vale mais que atividade certa.
        </p>
      </CardBody>
    </Card>
  );
}
