"use client";

/**
 * Registro do Service Worker.
 *
 * Estratégia deliberadamente conservadora: o SW só pré-guarda o shell da
 * aplicação (rotas e estáticos), nunca dados. Assim o app abre instantâneo e
 * funciona offline para consultar o histórico, enquanto qualquer gravação
 * passa pelo adaptador de dados — que já trata o modo offline.
 */

let registered = false;

export function registerServiceWorker(): void {
  if (registered) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // Em http inseguro (fora de localhost) o navegador nem tenta; evita ruído.
  const secure = window.isSecureContext || window.location.hostname === "localhost";
  if (!secure) return;

  registered = true;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Falhar aqui não pode quebrar o app: apenas sem cache offline.
      registered = false;
    });
  });
}

/** Verifica se há atualização do shell e recarrega uma única vez. */
export async function checkForUpdate(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  await registration.update();
  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  return false;
}
