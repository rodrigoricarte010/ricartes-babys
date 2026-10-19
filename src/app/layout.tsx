import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { FAMILY_NAME } from "@/lib/supabase/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `Ricartes Babys — acompanhamento da família ${FAMILY_NAME}`,
    template: "%s · Ricartes Babys",
  },
  description:
    "Curvas de crescimento da OMS, rotina diária, marcos do desenvolvimento e carteira de vacinação — tudo num só lugar, para cada criança da família.",
  applicationName: "Ricartes Babys",
  authors: [{ name: "Família Ricartes" }],
  keywords: [
    "acompanhamento do bebê",
    "curva de crescimento",
    "percentil OMS",
    "marcos do desenvolvimento",
    "carteira de vacinação",
    "amamentação",
    "sono do bebê",
  ],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ricartes Babys",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Ricartes Babys",
    description: "Acompanhamento de crescimento e desenvolvimento infantil.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#17111a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
