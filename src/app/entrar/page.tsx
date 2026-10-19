import type { Metadata } from "next";
import { EntrarPage } from "@/components/pages/entrar";

export const metadata: Metadata = { title: "Entrar" };

export default function Page() {
  return <EntrarPage />;
}
