"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Baby,
  CalendarHeart,
  ChevronDown,
  Cloud,
  CloudOff,
  FileText,
  HardDrive,
  Home,
  Leaf,
  Monitor,
  Moon,
  MoreHorizontal,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useTheme, type Theme } from "@/components/providers";
import { ChildAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { QuickLogButton, QuickLogDialog, useLog } from "@/components/log/log-provider";
import { formatAge, shortAge } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: (childId: string) => string;
  label: string;
  icon: LucideIcon;
  /** Mostra na barra inferior do celular. */
  mobile?: boolean;
}

export const CHILD_NAV: NavItem[] = [
  { href: () => "/painel", label: "Painel", icon: Home, mobile: true },
  { href: (id) => `/filhos/${id}/rotina`, label: "Rotina", icon: Activity, mobile: true },
  { href: (id) => `/filhos/${id}/crescimento`, label: "Crescimento", icon: Leaf, mobile: true },
  { href: (id) => `/filhos/${id}/marcos`, label: "Marcos", icon: Sparkles },
  { href: (id) => `/filhos/${id}/vacinas`, label: "Vacinas", icon: Syringe },
  { href: (id) => `/filhos/${id}/diario`, label: "Diário", icon: CalendarHeart },
  { href: (id) => `/filhos/${id}/relatorio`, label: "Relatório", icon: FileText },
];

export const APP_NAV = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { children: kids, activeChild, mode, online, ready } = useStore();
  const pathname = usePathname();
  const log = useLog();
  const [quickOpen, setQuickOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const childId = activeChild?.id ?? "";

  const isActive = (href: string) =>
    href === "/painel" ? pathname === "/painel" || pathname === "/" : pathname.startsWith(href);

  const mobileItems = CHILD_NAV.filter((i) => i.mobile);
  const desktopItems = [...CHILD_NAV, ...APP_NAV];

  return (
    <div className="min-h-dvh">
      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg-elevated lg:flex">
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-fg">Ricartes Babys</p>
            <p className="truncate text-[11px] font-medium text-fg-subtle">Família Ricartes</p>
          </div>
        </div>

        <div className="px-3">
          <ChildSwitcherButton onClick={() => setSwitcherOpen(true)} />
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {desktopItems.map((item) => {
            const href = "href" in item && typeof item.href === "string" ? item.href : (item as NavItem).href(childId);
            const active = isActive(href);
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={childId ? href : "/filhos/nova"}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
                    : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                )}
              >
                <Icon className={cn("size-4.5", active ? "text-brand-500" : "text-fg-subtle")} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-4 py-3.5">
          <SyncBadge mode={mode} online={online} />
        </div>
      </aside>

      {/* ── Cabeçalho (mobile) ────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 glass lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-bg-muted"
          >
            {activeChild ? (
              <>
                <ChildAvatar child={activeChild} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold tracking-tight text-fg">
                    {activeChild.nickname || activeChild.firstName}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-fg-subtle">
                    {formatAge(activeChild.birthDate)}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-fg">Ricartes Babys</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          </button>
          <ThemeToggle compact />
          <SyncBadge mode={mode} online={online} compact />
        </div>
      </header>

      {/* ── Conteúdo ──────────────────────────────────────── */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-5 sm:px-6 lg:pb-16 lg:pt-8">
          {children}
        </div>
      </main>

      {/* ── Barra inferior (mobile) ───────────────────────── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-elevated/95 glass lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-5 items-end gap-1 px-3 pt-1.5">
          {mobileItems.slice(0, 2).map((item) => (
            <MobileTab key={item.href(childId)} item={item} href={childId ? item.href(childId) : "/filhos/nova"} active={isActive(item.href(childId))} />
          ))}

          <div className="flex justify-center pb-1">
            <QuickLogButton onClick={() => setQuickOpen(true)} />
          </div>

          {mobileItems.slice(2, 3).map((item) => (
            <MobileTab key={item.href(childId)} item={item} href={childId ? item.href(childId) : "/filhos/nova"} active={isActive(item.href(childId))} />
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold text-fg-muted transition-colors hover:text-fg"
          >
            <MoreHorizontal className="size-5" aria-hidden />
            Mais
          </button>
        </div>
      </nav>

      {/* ── Diálogos de navegação ─────────────────────────── */}
      <QuickLogDialog open={quickOpen} onClose={() => setQuickOpen(false)} />
      <ChildSwitcherDialog open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais seções">
        <div className="grid grid-cols-2 gap-2.5 pb-5">
          {[...CHILD_NAV.filter((i) => !i.mobile), ...APP_NAV].map((item) => {
            const href = typeof item.href === "string" ? item.href : item.href(childId);
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={childId ? href : "/filhos/nova"}
                onClick={() => setMoreOpen(false)}
                // `min-w-0` porque o Link é item de grid: sem isso ele não
                // encolhe abaixo do rótulo e "Configurações" transborda o
                // cartão, deixando o ícone menor que a palavra.
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-bg-elevated p-3.5 shadow-soft transition-colors hover:border-brand-300"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg-muted text-fg-muted">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-fg">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Dialog>

      {ready && kids.length === 0 && (
        <p className="sr-only">Nenhuma criança cadastrada ainda.</p>
      )}
      {log.timerActive && <span className="sr-only">Cronômetro de amamentação em andamento</span>}
    </div>
  );
}

function MobileTab({ item, href, active }: { item: NavItem; href: string; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors",
        active ? "text-brand-600 dark:text-brand-300" : "text-fg-muted hover:text-fg",
      )}
    >
      <Icon className={cn("size-5", active && "drop-shadow-sm")} aria-hidden />
      {item.label}
    </Link>
  );
}

function BrandMark() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft">
      <Baby className="size-5" aria-hidden />
    </span>
  );
}

function ChildSwitcherButton({ onClick }: { onClick: () => void }) {
  const { activeChild, children: kids } = useStore();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-bg-muted/60 p-2.5 text-left transition-colors hover:border-brand-300"
    >
      {activeChild ? (
        <>
          <ChildAvatar child={activeChild} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold tracking-tight text-fg">
              {activeChild.firstName} {activeChild.middleName ?? ""}
            </span>
            <span className="block text-[11px] font-medium text-fg-subtle">
              {shortAge(activeChild.birthDate)} · {formatAge(activeChild.birthDate)}
            </span>
          </span>
        </>
      ) : (
        <span className="flex-1 text-sm font-semibold text-fg-muted">Adicionar criança…</span>
      )}
      <ChevronDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      {kids.length > 1 && <Badge tone="brand">{kids.length}</Badge>}
    </button>
  );
}

function ChildSwitcherDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { children: kids, activeChild, setActiveChildId } = useStore();

  return (
    <Dialog open={open} onClose={onClose} title="Suas crianças" description="Toque para trocar de criança.">
      <div className="space-y-2 pb-5">
        {kids.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => {
              setActiveChildId(child.id);
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
              activeChild?.id === child.id
                ? "border-brand-400 bg-brand-50/70 dark:bg-brand-950/40"
                : "border-line bg-bg-elevated hover:border-brand-300",
            )}
          >
            <ChildAvatar child={child} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-fg">
                {child.firstName} {child.middleName ?? ""} {child.lastName ?? ""}
              </span>
              <span className="block text-xs text-fg-subtle">
                {child.sex === "female" ? "Menina" : "Menino"} · {formatAge(child.birthDate)}
              </span>
            </span>
            {activeChild?.id === child.id && <Badge tone="brand">atual</Badge>}
          </button>
        ))}

        <Link
          href="/filhos/nova"
          onClick={onClose}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          <span className="grid size-11 place-items-center rounded-full bg-bg-muted text-fg-muted">
            <Plus className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-bold text-fg">Adicionar criança</span>
        </Link>
      </div>
    </Dialog>
  );
}

export function SyncBadge({
  mode,
  online,
  compact = false,
}: {
  mode: "local" | "cloud";
  online: boolean;
  compact?: boolean;
}) {
  const icon = mode === "cloud" ? (online ? Cloud : CloudOff) : HardDrive;
  const label =
    mode === "cloud" ? (online ? "Sincronizado na nuvem" : "Nuvem offline — salvando local") : "Somente neste aparelho";
  const Icon = icon;
  const tone = mode === "cloud" && online ? "sage" : "neutral";

  if (compact) {
    return (
      <span title={label} className="grid size-9 place-items-center rounded-xl text-fg-subtle">
        <Icon className="size-4.5" aria-label={label} />
      </span>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          tone === "sage" ? "bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300" : "bg-bg-muted text-fg-subtle",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-fg">{mode === "cloud" ? "Nuvem" : "Local"}</span>
        <span className="block text-[11px] leading-snug text-fg-subtle">{label}</span>
      </span>
    </div>
  );
}

const THEME_CYCLE: Record<Theme, Theme> = {
  sistema: "claro",
  claro: "escuro",
  escuro: "sistema",
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const Icon: LucideIcon = theme === "escuro" ? Moon : theme === "claro" ? Sun : Monitor;
  const label = `Tema: ${theme}`;
  return (
    <button
      type="button"
      onClick={() => setTheme(THEME_CYCLE[theme])}
      title={label}
      aria-label={label}
      className={cn(
        "grid place-items-center rounded-xl text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg",
        compact ? "size-9" : "size-10",
      )}
    >
      <Icon className="size-4.5" aria-hidden />
    </button>
  );
}

/** Título de página consistente, com migalhas opcionais. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Memo de navegação ativa para testes/SSR. */
export function useActiveNav() {
  const pathname = usePathname();
  return useMemo(() => pathname, [pathname]);
}
