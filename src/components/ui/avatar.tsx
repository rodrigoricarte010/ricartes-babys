import type { ReactNode } from "react";
import { cn, initials, kidColorHex } from "@/lib/utils";
import type { Child } from "@/lib/types";

/**
 * Avatar da criança. Usa a foto quando existe; senão, as iniciais sobre a cor
 * que a família escolheu (padrão: derivada do id, para ser estável).
 */
export function ChildAvatar({
  child,
  size = "md",
  className,
  ring = false,
}: {
  child: Pick<Child, "firstName" | "lastName" | "nickname" | "color" | "photoDataUrl" | "id">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}) {
  const dims = {
    xs: "size-7 text-[10px]",
    sm: "size-9 text-xs",
    md: "size-11 text-sm",
    lg: "size-16 text-lg",
    xl: "size-24 text-2xl",
  }[size];

  const name = [child.nickname || child.firstName, child.lastName].filter(Boolean).join(" ");
  const color = kidColorHex(child.color, child.id);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold text-white select-none",
        dims,
        ring && "ring-2 ring-bg-elevated ring-offset-2",
        className,
      )}
      style={{
        backgroundColor: color,
        backgroundImage: child.photoDataUrl
          ? `url(${child.photoDataUrl})`
          : `linear-gradient(140deg, ${color} 0%, ${color}bb 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-hidden={!!child.photoDataUrl}
      title={name}
    >
      {!child.photoDataUrl && initials(name)}
    </span>
  );
}

export function AvatarFallback({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-bg-muted text-fg-subtle",
        className,
      )}
    >
      {children}
    </span>
  );
}
