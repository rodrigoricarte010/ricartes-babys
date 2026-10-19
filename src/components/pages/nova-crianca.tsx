"use client";

import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChildForm } from "@/components/child-form";

export function NovaCriancaPage() {
  const router = useRouter();

  return (
    <AppShell>
      <PageHeader
        title="Adicionar criança"
        subtitle="Cada criança tem suas próprias curvas, marcos e carteira de vacinação"
      />
      <Card>
        <CardHeader title="Quem chega agora?" subtitle="Quanto mais completo, melhor o acompanhamento" />
        <CardBody>
          <ChildForm onSaved={(child) => router.push(`/filhos/${child.id}`)} onCancel={() => router.back()} />
        </CardBody>
      </Card>
    </AppShell>
  );
}
