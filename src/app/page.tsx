import { redirect } from "next/navigation";

/** A raiz sempre leva ao painel — é onde a família vive. */
export default function RootPage() {
  redirect("/painel");
}
