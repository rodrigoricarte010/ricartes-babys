import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { RotinaPage } from "@/components/pages/rotina";

export const metadata: Metadata = {
  title: "Rotina",
  description: "Linha do tempo de mamadas, sono, fraldas, remédios e sintomas.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <RotinaPage />
    </ChildRoute>
  );
}
