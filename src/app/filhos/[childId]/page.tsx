import type { Metadata } from "next";
import { ChildRoute } from "@/components/child-route";
import { PerfilPage } from "@/components/pages/perfil";

export const metadata: Metadata = { title: "Dados da criança" };

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return (
    <ChildRoute childId={childId}>
      <PerfilPage childId={childId} />
    </ChildRoute>
  );
}
