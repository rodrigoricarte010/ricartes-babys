"use client";

import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-line-strong bg-bg-elevated px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/12 disabled:opacity-50";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps & { children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-fg-muted">
          {label}
          {required && <span className="text-brand-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-fg-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      // `inputmode` decimal facilita o teclado certo no celular
      className={cn(base, "h-11", invalid && "border-red-400 focus:ring-red-500/15", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(base, "py-2.5 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          base,
          "h-11 appearance-none pr-9",
          invalid && "border-red-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ),
);
Select.displayName = "Select";

/** Rótulo + controle numérico com unidade, do jeito que se preenche no consultório. */
export const NumberField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; unit?: string; invalid?: boolean; hint?: string }
>(({ label, unit, className, invalid, hint, id, ...props }, ref) => {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-fg-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          inputMode="decimal"
          className={cn(
            base,
            "h-11 tabular",
            unit && "pr-14",
            invalid && "border-red-400 focus:ring-red-500/15",
          )}
          {...props}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-subtle">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
});
NumberField.displayName = "NumberField";
