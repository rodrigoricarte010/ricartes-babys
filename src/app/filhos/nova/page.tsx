import type { Metadata } from "next";
import { NovaCriancaPage } from "@/components/pages/nova-crianca";

export const metadata: Metadata = { title: "Adicionar criança" };

export default function Page() {
  return <NovaCriancaPage />;
}
