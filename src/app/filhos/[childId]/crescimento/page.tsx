import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { CrescimentoPage } from "@/components/pages/crescimento";

export const metadata: Metadata = {
  title: "Crescimento",
  description: "Curvas de peso, estatura, perímetro cefálico e IMC pelos padrões da OMS.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <CrescimentoPage />
    </ChildRoute>
  );
}
