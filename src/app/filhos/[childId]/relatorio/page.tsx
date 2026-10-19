import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { RelatorioPage } from "@/components/pages/relatorio";

export const metadata: Metadata = {
  title: "Relatório para consulta",
  description: "Resumo imprimível de crescimento, vacinas, rotina e marcos para o pediatra.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <RelatorioPage />
    </ChildRoute>
  );
}
