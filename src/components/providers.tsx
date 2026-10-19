"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";
import { LogProvider } from "@/components/log/log-provider";
import { registerServiceWorker } from "@/lib/pwa";

/**
 * Tema claro/escuro.
 *
 * Respeita a preferência do sistema por padrão e guarda a escolha manual em
 * localStorage. A classe `.dark` vai no <html> — daí o `@custom-variant dark`
 * no CSS, que é como o Tailwind v4 faz dark mode por classe.
 */
export type Theme = "sistema" | "claro" | "escuro";
const THEME_KEY = "rb:theme";

interface ThemeApi {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeApi>({ theme: "sistema", setTheme: () => {} });

export function useTheme(): ThemeApi {
  return useContext(ThemeContext);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "escuro" ||
    (theme === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("sistema");
  const [hydrated, setHydrated] = useState(false);

  // Lê o tema salvo na primeira execução do cliente e aplica na hora.
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = saved ?? "sistema";
    setThemeState(initial);
    applyTheme(initial);
    setHydrated(true);
  }, []);

  // Segue o sistema enquanto a preferência for automática.
  useEffect(() => {
    if (!hydrated || theme !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("sistema");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hydrated, theme]);

  useEffect(() => {
    if (hydrated) registerServiceWorker();
  }, [hydrated]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ToastProvider>
        <StoreProvider>
          <LogProvider>{children}</LogProvider>
        </StoreProvider>
      </ToastProvider>
    </ThemeContext.Provider>
  );
}
