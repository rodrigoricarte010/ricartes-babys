import type { MetadataRoute } from "next";

/**
 * Web App Manifest — é o que permite "Adicionar à tela de início" e fazer o
 * app abrir em tela cheia, sem barra do navegador, como um app nativo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ricartes Babys",
    short_name: "Ricartes",
    description:
      "Acompanhamento de crescimento, rotina, marcos e vacinas de cada criança da família.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#fdf8f6",
    theme_color: "#fdf8f6",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Registrar mamada",
        short_name: "Mamada",
        url: "/painel?log=feeding",
        description: "Inicia o cronômetro de amamentação",
      },
      {
        name: "Registrar sono",
        short_name: "Sono",
        url: "/painel?log=sleep",
      },
      {
        name: "Registrar fralda",
        short_name: "Fralda",
        url: "/painel?log=diaper",
      },
      {
        name: "Nova medida",
        short_name: "Medida",
        url: "/painel?log=measurement",
      },
    ],
  };
}
