"use client";

import Link from "next/link";
import { HeartPulse, Phone, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useStore } from "@/lib/store";

/**
 * Cartão de emergência: pediatra, plano de saúde e contatos de confiança —
 * tudo com link tel: para ligar direto do celular, inclusive offline
 * (os dados ficam no aparelho no modo local).
 */
export function EmergencyCard() {
  const { activeChild } = useStore();
  if (!activeChild) return null;
  const child = activeChild;
  const contacts = child.emergencyContacts ?? [];
  const hasData = Boolean(child.pediatricianName || child.pediatricianPhone || child.healthPlan || contacts.length > 0);

  return (
    <Card>
      <CardHeader
        title="Cartão de emergência"
        subtitle="Quem chamar quando precisar"
        icon={<HeartPulse className="size-4.5" />}
        action={
          <Link
            href={`/filhos/${child.id}`}
            className="text-xs font-bold text-brand-600 underline decoration-brand-300 underline-offset-2 dark:text-brand-400"
          >
            {hasData ? "Editar" : "Preencher"}
          </Link>
        }
      />
      <CardBody>
        {!hasData ? (
          <p className="text-[13px] leading-relaxed text-fg-muted">
            Cadastre o pediatra, o plano de saúde (ou a UBS de referência) e até 3 contatos
            de confiança. De madrugada, ninguém quer procurar número de telefone — eles ficam
            aqui, disponíveis até sem internet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {(child.pediatricianName || child.pediatricianPhone) && (
              <div className="flex items-center gap-3 rounded-xl bg-bg-muted/50 px-3 py-2.5">
                <Stethoscope className="size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-fg-subtle">Pediatra</p>
                  <p className="truncate text-sm font-bold text-fg">{child.pediatricianName || "—"}</p>
                </div>
                {child.pediatricianPhone && <PhoneLink phone={child.pediatricianPhone} />}
              </div>
            )}

            {child.healthPlan && (
              <div className="flex items-center gap-3 rounded-xl bg-bg-muted/50 px-3 py-2.5">
                <ShieldCheck className="size-4 shrink-0 text-sage-600 dark:text-sage-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-fg-subtle">Plano de saúde / referência</p>
                  <p className="truncate text-sm font-bold text-fg">{child.healthPlan}</p>
                </div>
              </div>
            )}

            {contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-bg-muted/50 px-3 py-2.5">
                <Users className="size-4 shrink-0 text-brand-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-fg-subtle">{c.relation || "Contato de emergência"}</p>
                  <p className="truncate text-sm font-bold text-fg">{c.name || "—"}</p>
                </div>
                {c.phone && <PhoneLink phone={c.phone} />}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone.replace(/[^\d+]/g, "")}`}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sage-100 px-2.5 py-1.5 text-xs font-bold text-sage-800 transition-colors hover:bg-sage-200 dark:bg-sage-950/60 dark:text-sage-200"
      aria-label={`Ligar para ${phone}`}
    >
      <Phone className="size-3.5" aria-hidden />
      Ligar
    </a>
  );
}
