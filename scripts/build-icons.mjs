/**
 * Gera os ícones do PWA a partir de assets/icon-source.png (1254×1254).
 *
 *   public/icons/icon-192.png          – ícone "any" pequeno
 *   public/icons/icon-512.png          – ícone "any" grande
 *   public/icons/maskable-512.png      – com respiro de 20% para launcher maskable
 *   public/icons/apple-touch-icon.png  – iOS (180×180)
 *   public/favicon.png                 – fallback 64×64
 *
 * Rode com: npm run icons
 */
import { Jimp } from "jimp";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = resolve(root, "assets/icon-source.png");
const outDir = resolve(root, "public/icons");

/** Cor da marca para o fundo do maskable (rosa Ricartes). */
const BRAND = 0xf04478ff;

async function write(image, path) {
  mkdirSync(dirname(path), { recursive: true });
  await image.write(path);
  console.log("  ✓", path.replace(root + "/", ""));
}

async function main() {
  const base = await Jimp.read(source);

  await write(base.clone().resize({ w: 512, h: 512 }), resolve(outDir, "icon-512.png"));
  await write(base.clone().resize({ w: 192, h: 192 }), resolve(outDir, "icon-192.png"));

  // Maskable: o conteúdo útil precisa ficar dentro de 80% do canvas.
  const inner = base.clone().resize({ w: 410, h: 410 });
  const maskable = new Jimp({ width: 512, height: 512, color: BRAND });
  maskable.composite(inner, 51, 51);
  await write(maskable, resolve(outDir, "maskable-512.png"));

  await write(base.clone().resize({ w: 180, h: 180 }), resolve(outDir, "apple-touch-icon.png"));
  await write(base.clone().resize({ w: 64, h: 64 }), resolve(root, "public/favicon.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
