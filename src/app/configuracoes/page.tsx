import type { Metadata } from "next";
import { ConfiguracoesPage } from "@/components/pages/configuracoes";

export const metadata: Metadata = { title: "Configurações" };

export default function Page() {
  return <ConfiguracoesPage />;
}
