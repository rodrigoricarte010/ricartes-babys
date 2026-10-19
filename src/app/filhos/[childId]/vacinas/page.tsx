import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { VacinasPage } from "@/components/pages/vacinas";

export const metadata: Metadata = {
  title: "Carteira de vacinação",
  description: "Calendário de referência PNI/SBIm com doses aplicadas e prazos.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <VacinasPage />
    </ChildRoute>
  );
}
