import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { DiarioPage } from "@/components/pages/diario";

export const metadata: Metadata = {
  title: "Diário",
  description: "Memórias, fotos e anotações dos dias que passam rápido demais.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <DiarioPage />
    </ChildRoute>
  );
}
