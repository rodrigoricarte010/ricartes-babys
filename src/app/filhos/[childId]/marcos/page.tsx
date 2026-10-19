import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { MarcosPage } from "@/components/pages/marcos";

export const metadata: Metadata = {
  title: "Marcos do desenvolvimento",
  description: "Conquistas motoras, de linguagem, sociais e cognitivas, mês a mês.",
};

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <MarcosPage />
    </ChildRoute>
  );
}
