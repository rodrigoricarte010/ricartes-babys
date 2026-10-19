"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Diálogo nativo (`<dialog>` + showModal), que no celular vira bottom sheet.
 *
 * Usar o elemento nativo não é preguiça: ele devolve de graça foco preso,
 * fechamento com ESC, `inert` no resto da página e comportamento correto com
 * leitores de tela — tudo que uma implementação manual costuma errar.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      // `showModal` lança se o elemento sair do DOM no mesmo tick.
      try {
        el.showModal();
      } catch {
        /* ignore */
      }
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(e) => {
        // Clicar no backdrop (fora do conteúdo) fecha.
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "mx-0 mb-0 mt-auto max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border-0 bg-bg-elevated p-0 text-fg shadow-lift",
        "open:animate-slide-up backdrop:bg-brand-950/45 backdrop:backdrop-blur-[3px]",
        "sm:mx-auto sm:my-auto sm:rounded-3xl",
        size === "sm" && "sm:max-w-sm",
        size === "md" && "sm:max-w-lg",
        size === "lg" && "sm:max-w-2xl",
        className,
      )}
    >
      <div className="flex max-h-[92dvh] flex-col">
        {/* Alça do bottom sheet */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>

        {(title || description) && (
          <header className="flex items-start gap-3 px-5 pb-3 pt-3 sm:pt-5">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
              )}
              {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
            >
              <X className="size-5" />
            </button>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">{children}</div>

        {footer && (
          <footer className="safe-bottom border-t border-line px-5 pb-4 pt-3 sm:pb-5">{footer}</footer>
        )}
      </div>
    </dialog>
  );
}
