/**
 * Utilitários de foto.
 *
 * As fotos são guardadas como data URL (JPEG re-comprimido) para funcionar
 * tanto no modo local (IndexedDB) quanto no modo nuvem (coluna text[]), sem
 * precisar de um bucket de arquivos. Por isso reduzimos o tamanho antes de
 * salvar: 640 px de lado maior com qualidade 0.82 rende uma imagem nítida no
 * celular pesando ~60–120 KB.
 */

/** Reduz e converte a foto para data URL JPEG. */
export async function readImageAsDataUrl(file: File, maxSize = 320): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Este arquivo não parece uma imagem."));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Tamanho padrão para fotos de registros (maior que o avatar de criança). */
export const RECORD_PHOTO_SIZE = 640;
