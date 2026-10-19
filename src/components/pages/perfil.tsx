"use client";

import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChildForm } from "@/components/child-form";
import { useStore } from "@/lib/store";
import { fmtDate, formatAge } from "@/lib/date";
import { Stat } from "@/components/ui/badge";

export function PerfilPage({ childId }: { childId: string }) {
  const { children: kids, measurements, events, diary } = useStore();
  const router = useRouter();
  const child = kids.find((c) => c.id === childId) ?? null;

  if (!child) {
    return (
      <AppShell>
        <Card>
          <EmptyState title="Criança não encontrada" description="Ela pode ter sido removida neste aparelho." />
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`${child.firstName} ${child.middleName ?? ""}`.trim()}
        subtitle={`${formatAge(child.birthDate)} · nasceu em ${fmtDate(child.birthDate)}`}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Medições" value={measurements.length} />
        <Stat label="Registros" value={events.length} />
        <Stat label="Memórias" value={diary.length} />
      </div>

      <Card>
        <CardHeader title="Dados da criança" subtitle="Essas informações definem as curvas e os prazos" />
        <CardBody>
          <ChildForm child={child} onSaved={() => router.push("/painel")} />
        </CardBody>
      </Card>
    </AppShell>
  );
}
