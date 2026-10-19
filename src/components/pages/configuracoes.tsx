"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Baby,
  Cloud,
  Database,
  Download,
  HardDrive,
  LogOut,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { AppShell, PageHeader, ThemeToggle } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { useTheme, type Theme } from "@/components/providers";
import { ChildAvatar } from "@/components/ui/avatar";
import { clearLocalData, downloadSnapshot, getDataSource, parseSnapshot } from "@/lib/db";
import { isCloudConfigured, CLOUD_HINT } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { formatAge } from "@/lib/date";

export function ConfiguracoesPage() {
  const { children: kids, mode, online, reload, restoreDemo, ready } = useStore();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setBusy(true);
    try {
      const snapshot = await getDataSource().getSnapshot();
      downloadSnapshot(snapshot);
      toast.success("Backup exportado em JSON.");
    } catch {
      toast.error("Não consegui exportar o backup.");
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const snapshot = parseSnapshot(text);
      await getDataSource().replaceSnapshot(snapshot);
      await reload();
      toast.success(`Backup importado: ${snapshot.children.length} criança(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Arquivo de backup inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function wipe() {
    setBusy(true);
    try {
      await clearLocalData();
      await reload();
      setConfirmWipe(false);
      toast.success("Dados locais apagados.");
    } catch {
      toast.error("Não consegui apagar.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    await reload();
    toast.info("Você saiu da conta.");
  }

  return (
    <AppShell>
      <PageHeader title="Configurações" subtitle="Família, armazenamento, aparência e dados" />

      <div className="space-y-5">
        {/* Crianças */}
        <Card>
          <CardHeader
            title="Crianças"
            subtitle={`${kids.length} no acompanhamento`}
            icon={<Baby className="size-4.5" />}
            action={
              <Link href="/filhos/nova">
                <Button size="sm" variant="outline">
                  <Plus className="size-3.5" aria-hidden />
                  Adicionar
                </Button>
              </Link>
            }
          />
          <CardBody className="pt-2">
            {kids.length === 0 ? (
              <p className="py-3 text-sm text-fg-subtle">Nenhuma criança cadastrada.</p>
            ) : (
              <ul className="divide-y divide-line">
                {kids.map((child) => (
                  <li key={child.id} className="flex items-center gap-3 py-2.5">
                    <ChildAvatar child={child} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-fg">
                        {child.firstName} {child.middleName ?? ""} {child.lastName ?? ""}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        {child.sex === "female" ? "Menina" : "Menino"} · {formatAge(child.birthDate)}
                      </p>
                    </div>
                    <Link href={`/filhos/${child.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="size-3.5" aria-hidden />
                        Editar
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Armazenamento */}
        <Card>
          <CardHeader
            title="Armazenamento e sincronização"
            subtitle={mode === "cloud" ? "Conectado ao Supabase" : "Somente neste aparelho"}
            icon={mode === "cloud" ? <Cloud className="size-4.5" /> : <HardDrive className="size-4.5" />}
            action={
              <Badge tone={mode === "cloud" && online ? "sage" : "neutral"}>
                {mode === "cloud" ? (online ? "online" : "offline") : "local"}
              </Badge>
            }
          />
          <CardBody className="space-y-4 pt-2">
            {mode === "local" ? (
              <div className="rounded-xl border border-line bg-bg-muted/50 p-3.5 text-[13px] leading-relaxed text-fg-muted">
                <p className="font-bold text-fg">Para ativar a nuvem (sincronizar entre aparelhos):</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Crie um projeto grátis em <strong>supabase.com</strong>.</li>
                  <li>Rode o conteúdo de <code className="rounded bg-bg-elevated px-1">supabase/schema.sql</code> no SQL Editor.</li>
                  <li>Copie a URL e a chave <em>anon</em> para <code className="rounded bg-bg-elevated px-1">.env.local</code>.</li>
                  <li>Reinicie o app e entre em <Link href="/entrar" className="font-bold text-brand-600 underline dark:text-brand-300">/entrar</Link>.</li>
                </ol>
                <p className="mt-2 text-xs text-fg-subtle">
                  Seus dados atuais continuam seguros aqui no aparelho e podem ser migrados com o
                  backup abaixo.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="size-3.5" aria-hidden />
                  Sair da conta
                </Button>
                <p className="text-xs text-fg-subtle">Os registros são compartilhados com a família conectada.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportBackup} loading={busy}>
                <Download className="size-3.5" aria-hidden />
                Exportar backup (JSON)
              </Button>
              <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} loading={busy}>
                <Upload className="size-3.5" aria-hidden />
                Importar backup
              </Button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => importBackup(e.target.files?.[0])}
              />
            </div>
            {CLOUD_HINT && <p className="text-[11px] text-fg-subtle">{CLOUD_HINT}</p>}
          </CardBody>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader title="Aparência" subtitle="Tema claro, escuro ou seguindo o sistema" icon={<Monitor className="size-4.5" />} />
          <CardBody className="pt-2">
            <Segmented
              ariaLabel="Tema"
              value={theme}
              onChange={(v) => setTheme(v as Theme)}
              options={[
                { value: "sistema", label: (<span className="flex items-center gap-1.5"><Monitor className="size-3.5" /> Sistema</span>) },
                { value: "claro", label: (<span className="flex items-center gap-1.5"><Sun className="size-3.5" /> Claro</span>) },
                { value: "escuro", label: (<span className="flex items-center gap-1.5"><Moon className="size-3.5" /> Escuro</span>) },
              ]}
            />
            <div className="mt-3 flex items-center gap-2">
              <ThemeToggle />
              <span className="text-xs text-fg-subtle">Alterna rapidamente pelo ícone.</span>
            </div>
          </CardBody>
        </Card>

        {/* Dados */}
        <Card>
          <CardHeader title="Dados" subtitle="Recuperar exemplo ou começar do zero" icon={<Database className="size-4.5" />} />
          <CardBody className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={reload}>
                <RefreshCw className="size-3.5" aria-hidden />
                Recarregar dados
              </Button>
              {mode === "local" && (
                <Button variant="outline" size="sm" onClick={restoreDemo}>
                  <Baby className="size-3.5" aria-hidden />
                  Restaurar família de exemplo
                </Button>
              )}
            </div>

            {mode === "local" && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 dark:border-red-900 dark:bg-red-950/20">
                {confirmWipe ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                      Apagar TODOS os dados deste aparelho? Não dá para desfazer.
                    </span>
                    <Button variant="danger" size="sm" onClick={wipe} loading={busy}>
                      Apagar tudo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmWipe(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setConfirmWipe(true)}>
                    <Trash2 className="size-3.5" aria-hidden />
                    Apagar dados locais…
                  </Button>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader title="Sobre e referências" />
          <CardBody className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
            <p>
              <strong className="text-fg">Ricartes Babys</strong> é um acompanhamento de crescimento e
              desenvolvimento feito sob medida para a família — começando pela Rosie Grace e pronto
              para os irmãos que vierem.
            </p>
            <p>
              Percentis e z-scores são calculados localmente com as tabelas LMS oficiais da{" "}
              <strong className="text-fg">OMS (Child Growth Standards, 0–5 anos)</strong>. Marcos seguem
              CDC “Learn the Signs. Act Early.”, janelas motoras da OMS e a Caderneta da Criança. O
              calendário vacinal referencia PNI e SBIm.
            </p>
            <p className="text-xs text-fg-subtle">
              Nada aqui substitui avaliação profissional. Em dúvida, converse com o pediatra — e leve o
              relatório impresso, ele resume tudo.
            </p>
            {!isCloudConfigured && (
              <p className="text-xs text-fg-subtle">
                Instalável como app: no celular, use “Adicionar à tela de início” no menu do navegador.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
