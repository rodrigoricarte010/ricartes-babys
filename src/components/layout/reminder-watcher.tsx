"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { dayKey, fmtDate } from "@/lib/date";
import { buildVaccinePlan } from "@/lib/vaccine-progress";
import {
  loadFired,
  loadReminders,
  markFired,
  notificationsAllowed,
  notify,
} from "@/lib/reminders";

/**
 * Relojinho dos lembretes: roda em segundo plano enquanto o app está aberto,
 * checando a cada minuto se algo deve ser notificado neste aparelho.
 */
export function ReminderWatcher() {
  const { ready, activeChild, events } = useStore();

  useEffect(() => {
    if (!ready) return;

    function check() {
      if (!notificationsAllowed() || !activeChild) return;
      const settings = loadReminders();
      const now = new Date();
      const day = dayKey(now);
      const fired = new Set(loadFired(day));
      const name = activeChild.nickname || activeChild.firstName;

      // Lembrete diário de pesar/medir
      if (settings.weighTime && !fired.has("weigh")) {
        const [h, m] = settings.weighTime.split(":").map(Number);
        if (now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0)) {
          markFired(day, "weigh");
          notify("Hora da medida 📏", `Que tal pesar e medir ${name} hoje? Leva um minutinho.`);
        }
      }

      // Vacina atrasada ou vencendo em até 7 dias (1x por dia)
      if (settings.vaccineAlert && !fired.has("vaccine")) {
        const plan = buildVaccinePlan(activeChild, events, false);
        const soon = plan.find((row) => {
          if (row.status === "atrasada") return true;
          if (row.status !== "agendada") return false;
          const days = (row.dueDate.getTime() - now.getTime()) / 86_400_000;
          return days <= 7;
        });
        if (soon) {
          markFired(day, "vaccine");
          notify(
            `💉 ${soon.vaccineName} · ${soon.dose.dose}`,
            soon.status === "atrasada"
              ? `Essa dose estava marcada para ${fmtDate(soon.dueDate)}. Vale agendar na UBS.`
              : `Vence em ${fmtDate(soon.dueDate)} — já dá para deixar agendada.`,
          );
        }
      }
    }

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [ready, activeChild, events]);

  return null;
}
