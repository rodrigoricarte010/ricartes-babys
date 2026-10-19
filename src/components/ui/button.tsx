"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-soft hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400",
        secondary:
          "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-200 dark:hover:bg-brand-900/60",
        outline:
          "border border-line-strong bg-bg-elevated text-fg hover:bg-bg-muted dark:border-line-strong",
        ghost: "text-fg-muted hover:bg-bg-muted hover:text-fg",
        sage: "bg-sage-500 text-white shadow-soft hover:bg-sage-600",
        danger: "bg-red-500 text-white shadow-soft hover:bg-red-600",
        subtle: "bg-bg-muted text-fg hover:bg-line/60",
      },
      size: {
        xs: "h-8 px-2.5 text-xs rounded-lg",
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-11 px-4 text-sm",
        lg: "h-13 px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
