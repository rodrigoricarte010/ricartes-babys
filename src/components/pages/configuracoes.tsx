"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Baby,
  BellRing,
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
import {
  DEFAULT_REMINDERS,
  loadReminders,
  notificationsSupported,
  saveReminders,
  type ReminderSettings,
} from "@/lib/reminders";

export function ConfiguracoesPage() {
  const { children: kids, mode, online, reload, restoreDemo, ready, readOnly, setReadOnly } = useStore();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reminders, setRemindersState] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!notificationsSupported()) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    setRemindersState(loadReminders());
  }, []);

  function updateReminders(next: ReminderSettings) {
    setRemindersState(next);
    saveReminders(next);
  }

  async function requestPermission() {
    if (!notificationsSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Notificações ativadas neste aparelho. 🔔");
    else if (result === "denied") toast.error("O navegador bloqueou as notificações.");
  }

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

        {/* Visita e lembretes */}
        <Card>
          <CardHeader
            title="Visita e lembretes"
            subtitle="Somente leitura para visitas e avisos neste aparelho"
            icon={<BellRing className="size-4.5" />}
          />
          <CardBody className="space-y-3 pt-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg-muted/40 px-3.5 py-3">
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => {
                  setReadOnly(e.target.checked);
                  toast.info(e.target.checked ? "Modo visita ativado — ninguém altera nada aqui." : "Modo visita desativado.");
                }}
                className="mt-0.5 size-4.5 shrink-0 accent-[var(--color-brand-500)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-fg">Modo visita (somente leitura)</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-fg-subtle">
                  Trava registros e edições neste aparelho — a avó e a babá podem acompanhar tudo
                  sem alterar nada. Seus dados continuam intactos; é só desmarcar para voltar a registrar.
                </span>
              </span>
            </label>

            <div className="rounded-xl border border-line bg-bg-muted/40 px-3.5 py-3">
              <p className="text-sm font-bold text-fg">Lembretes com notificação 🔔</p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">
                Disparam enquanto o app estiver aberto (o PWA instalado conta como aberto) e valem
                só neste aparelho — nada vai para a internet.
              </p>

              {permission === "unsupported" ? (
                <p className="mt-2 text-xs text-fg-subtle">Este navegador não oferece notificações.</p>
              ) : permission !== "granted" ? (
                <Button
                  size="sm"
                  variant={permission === "denied" ? "ghost" : "outline"}
                  className="mt-3"
                  disabled={permission === "denied"}
                  onClick={() => void requestPermission()}
                >
                  {permission === "denied"
                    ? "Notificações bloqueadas no navegador"
                    : "Ativar notificações"}
                </Button>
              ) : (
                <div className="mt-3 space-y-2.5">
                  <label className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={reminders.weighTime != null}
                      onChange={(e) =>
                        updateReminders({ ...reminders, weighTime: e.target.checked ? (reminders.weighTime ?? "09:00") : null })
                      }
                      className="size-4.5 shrink-0 accent-[var(--color-brand-500)]"
                    />
                    <span className="text-sm font-semibold text-fg">Lembrar de pesar/medir todo dia às</span>
                    {reminders.weighTime != null && (
                      <input
                        type="time"
                        value={reminders.weighTime}
                        onChange={(e) => updateReminders({ ...reminders, weighTime: e.target.value })}
                        className="rounded-lg border border-line-strong bg-bg-elevated px-2 py-1 text-xs tabular text-fg focus:border-brand-400 focus:outline-none"
                        aria-label="Horário do lembrete de medida"
                      />
                    )}
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={reminders.vaccineAlert}
                      onChange={(e) => updateReminders({ ...reminders, vaccineAlert: e.target.checked })}
                      className="size-4.5 shrink-0 accent-[var(--color-brand-500)]"
                    />
                    <span className="text-sm font-semibold text-fg">
                      Avisar de vacinas atrasadas ou vencendo em 7 dias
                    </span>
                  </label>
                </div>
              )}
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
