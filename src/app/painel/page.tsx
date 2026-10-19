import type { Metadata } from "next";
import { Dashboard } from "@/components/pages/dashboard";

export const metadata: Metadata = {
  title: "Painel",
  description: "Resumo de hoje: crescimento, mamadas, sono, fraldas e próximos passos.",
};

export default function PainelPage() {
  return <Dashboard />;
}
