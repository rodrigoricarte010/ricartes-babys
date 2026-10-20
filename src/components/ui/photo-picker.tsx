"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { readImageAsDataUrl, RECORD_PHOTO_SIZE } from "@/lib/photo";
import { useToast } from "@/components/ui/toast";

export interface PhotoPickerProps {
  photos: string[];
  onChange: (next: string[]) => void;
  /** Máximo de fotos por registro. */
  max?: number;
  label?: string;
  className?: string;
}

/**
 * Seletor de fotos reutilizável — usado nos formulários de registro (sintoma,
 * medicamento, nota, consulta…) e no diário. Comprime a imagem antes de
 * guardar para caber no IndexedDB / na coluna text[] do Supabase.
 */
export function PhotoPicker({ photos, onChange, max = 6, label = "Fotos", className }: PhotoPickerProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max - photos.length;
    if (room <= 0) {
      toast.info(`Dá para anexar até ${max} fotos por registro.`);
      return;
    }
    setBusy(true);
    try {
      const next = [...photos];
      for (const file of Array.from(files).slice(0, room)) {
        next.push(await readImageAsDataUrl(file, RECORD_PHOTO_SIZE));
      }
      onChange(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não consegui usar essa imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-semibold text-fg-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${i + 1}`} className="size-20 rounded-xl object-cover ring-1 ring-line" />
            <button
              type="button"
              aria-label={`Remover foto ${i + 1}`}
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              // O `after` expande a área de toque para ~40px sem aumentar o
              // círculo visível — 24px é pequeno demais para o dedo.
              className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-fg text-bg shadow-soft after:absolute after:-inset-2 after:content-['']"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Adicionar foto"
            className={cn(
              "grid size-20 place-items-center rounded-xl border border-dashed border-line-strong text-fg-subtle transition-colors hover:border-brand-400 hover:text-brand-500",
              busy && "opacity-60",
            )}
          >
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
