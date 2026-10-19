/* eslint-disable no-restricted-globals */
/**
 * Service Worker do Ricartes Babys.
 *
 * Três regras simples, escolhidas para nunca atrapalhar:
 *  1. Navegação: rede primeiro, cache como plano B (offline mostra a última
 *     versão visitada em vez de tela de erro).
 *  2. Estáticos imutáveis do Next (/ _next/static): cache primeiro.
 *  3. Dados e API: sem cache algum. Registro de saúde não pode ficar obsoleto.
 */
const VERSION = "ricartes-babys-v1";
const SHELL = `${VERSION}:shell`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(["/painel", "/manifest.webmanifest"]))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Estáticos do build: imutáveis e versionados, podem viver no cache.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(SHELL).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Nunca cacheia chamadas de dados.
  if (url.pathname.startsWith("/api/")) return;

  // Navegação: rede primeiro, cache se estiver offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put("/painel", copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/painel"))),
    );
  }
});
