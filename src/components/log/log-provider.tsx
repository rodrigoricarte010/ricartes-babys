"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Calendar,
  Droplets,
  Milk,
  Moon,
  Pause,
  Pill,
  Play,
  Plus,
  Ruler,
  StickyNote,
  Thermometer,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PhotoPicker } from "@/components/ui/photo-picker";
import type { AppEvent, FeedingMethod, Measurement } from "@/lib/types";
import { stopwatchLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { LogKind } from "./types";
import { LOG_META } from "./types";
import { FeedingForm, SleepForm, DiaperForm, MedicineForm, SymptomForm } from "./routine-forms";
import { MeasurementForm } from "./measurement-form";
import { AppointmentForm } from "./appointment-form";

/**
 * Registro central de eventos.
 *
 * Um único lugar decide qual diálogo abrir — assim qualquer botão do app
 * (linha do tempo, atalhos, PWA, cronômetro) chama `log.open(kind)` e pronto.
 */

interface OpenOptions {
  /** AppEvent para rotina; Measurement para o formulário de medida. */
  editing?: AppEvent | Measurement | null;
  method?: FeedingMethod;
  durationMin?: number | null;
}

interface TimerState {
  startedAt: number;
  side: "left" | "right";
  pausedAt: number | null;
  pausedMs: number;
}

interface LogApi {
  open: (kind: LogKind, opts?: OpenOptions) => void;
  close: () => void;

  timerSeconds: number;
  timerSide: "left" | "right";
  timerPaused: boolean;
  timerActive: boolean;
  startTimer: (side?: "left" | "right") => void;
  toggleTimerSide: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  finishTimer: () => void;
}

const LogContext = createContext<LogApi | null>(null);

const TIMER_KEY = "rb:feed-timer";

function readTimer(): TimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerState;
    if (typeof parsed.startedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeTimer(state: TimerState | null) {
  if (typeof window === "undefined") return;
  if (state) window.localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  else window.localStorage.removeItem(TIMER_KEY);
}

function elapsedSeconds(state: TimerState, now: number): number {
  const pausedTotal = state.pausedMs + (state.pausedAt ? now - state.pausedAt : 0);
  return Math.max(0, Math.floor((now - state.startedAt - pausedTotal) / 1000));
}

const ICONS: Record<string, LucideIcon> = {
  milk: Milk,
  moon: Moon,
  droplets: Droplets,
  ruler: Ruler,
  pill: Pill,
  thermometer: Thermometer,
  calendar: Calendar,
  "sticky-note": StickyNote,
};

export function LogProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { readOnly } = useStore();

  const [openKind, setOpenKind] = useState<LogKind | null>(null);
  const [editing, setEditing] = useState<AppEvent | Measurement | null>(null);
  const [presetMethod, setPresetMethod] = useState<FeedingMethod | undefined>();
  const [presetDuration, setPresetDuration] = useState<number | null>(null);

  const [timer, setTimer] = useState<TimerState | null>(() => readTimer());
  const [now, setNow] = useState(() => Date.now());

  // Relógio do cronômetro.
  useEffect(() => {
    if (!timer || timer.pausedAt != null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer, timer?.pausedAt]);

  useEffect(() => {
    writeTimer(timer);
  }, [timer]);

  const open = useCallback((kind: LogKind, opts?: OpenOptions) => {
    if (readOnly) {
      toast.info("Modo visita ativo — desative em Configurações para registrar.");
      return;
    }
    setEditing(opts?.editing ?? null);
    setPresetMethod(opts?.method);
    setPresetDuration(opts?.durationMin ?? null);
    setOpenKind(kind);
  }, [readOnly, toast]);

  const close = useCallback(() => {
    setOpenKind(null);
    setEditing(null);
    setPresetMethod(undefined);
    setPresetDuration(null);
  }, []);

  // ── Cronômetro de amamentação ─────────────────────────────────
  const startTimer = useCallback(
    (side: "left" | "right" = "left") => {
      setTimer({ startedAt: Date.now(), side, pausedAt: null, pausedMs: 0 });
      setNow(Date.now());
      toast.info(side === "left" ? "Cronometrando: peito esquerdo." : "Cronometrando: peito direito.");
    },
    [toast],
  );

  const toggleTimerSide = useCallback(() => {
    setTimer((t) => (t ? { ...t, side: t.side === "left" ? "right" : "left" } : t));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((t) => (t && t.pausedAt == null ? { ...t, pausedAt: Date.now() } : t));
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((t) =>
      t && t.pausedAt != null
        ? { ...t, pausedMs: t.pausedMs + (Date.now() - t.pausedAt), pausedAt: null }
        : t,
    );
  }, []);

  const cancelTimer = useCallback(() => {
    setTimer(null);
    toast.info("Cronômetro descartado.");
  }, [toast]);

  const finishTimer = useCallback(() => {
    setTimer((t) => {
      if (!t) return null;
      const seconds = elapsedSeconds(t, Date.now());
      const minutes = Math.max(1, Math.round(seconds / 60));
      setOpenKind("feeding");
      setEditing(null);
      setPresetMethod("breast");
      setPresetDuration(minutes);
      return null;
    });
  }, []);

  const timerSeconds = timer ? elapsedSeconds(timer, now) : 0;

  // O formulário de medida recebe Measurement; os demais, AppEvent.
  const editingMeasurement =
    openKind === "measurement" ? (editing as Measurement | null) : null;
  const editingEvent =
    openKind != null && openKind !== "measurement" ? (editing as AppEvent | null) : null;

  const api = useMemo<LogApi>(
    () => ({
      open,
      close,
      timerSeconds,
      timerSide: timer?.side ?? "left",
      timerPaused: timer?.pausedAt != null,
      timerActive: timer != null,
      startTimer,
      toggleTimerSide,
      pauseTimer,
      resumeTimer,
      cancelTimer,
      finishTimer,
    }),
    [open, close, timerSeconds, timer, startTimer, toggleTimerSide, pauseTimer, resumeTimer, cancelTimer, finishTimer],
  );

  // Atalho de URL: /painel?log=feeding abre direto (usado pelos shortcuts do PWA).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("log") as LogKind | null;
    if (kind && LOG_META[kind]) {
      open(kind);
      params.delete("log");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  }, [open]);

  return (
    <LogContext.Provider value={api}>
      {children}

      {/* Barra do cronômetro — fica por cima de tudo, como um timer nativo. */}
      {timer && <TimerBar />}

      {/* Diálogos de registro */}
      <FeedingForm
        open={openKind === "feeding"}
        onClose={close}
        editing={editingEvent}
        presetMethod={presetMethod}
        presetDurationMin={presetDuration}
      />
      <SleepForm open={openKind === "sleep"} onClose={close} editing={editingEvent} />
      <DiaperForm open={openKind === "diaper"} onClose={close} editing={editingEvent} />
      <MedicineForm open={openKind === "medicine"} onClose={close} editing={editingEvent} />
      <SymptomForm open={openKind === "symptom"} onClose={close} editing={editingEvent} />
      <MeasurementForm open={openKind === "measurement"} onClose={close} editing={editingMeasurement} />
      <AppointmentForm open={openKind === "appointment"} onClose={close} editing={editingEvent} />
      <NoteForm open={openKind === "note"} onClose={close} editing={editingEvent} />
    </LogContext.Provider>
  );
}

/** Registro livre: texto + humor. As fotos ficam no diário. */
function NoteForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: AppEvent | null }) {
  const { activeChild, createEvent, upsertEvent } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhotos(editing?.photos ?? []);
    setText(editing?.note ?? "");
    setWhen(editing ? toLocalInput(new Date(editing.startedAt)) : toLocalInput(new Date()));
  }, [open, editing]);

  async function submit() {
    if (!activeChild || !text.trim()) return;
    try {
      const draft = {
        childId: activeChild.id,
        kind: "note" as const,
        startedAt: new Date(when).toISOString(),
        endedAt: null,
        durationMin: null,
        payload: {},
        note: text.trim(),
        photos,
      };
      if (editing) await upsertEvent({ ...editing, ...draft });
      else await createEvent(draft);
      toast.success("Nota salva.");
      onClose();
    } catch {
      toast.error("Não consegui salvar a nota.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar nota" : "Nova nota"}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!text.trim()} className="flex-[2]">
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Escreva o que quiser lembrar desse dia…"
          className="w-full rounded-xl border border-line-strong bg-bg-elevated px-3.5 py-2.5 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="h-11 w-full rounded-xl border border-line-strong bg-bg-elevated px-3.5 text-sm text-fg focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/12"
        />
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </div>
    </Dialog>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TimerBar() {
  const { timerSeconds, timerSide, timerPaused, pauseTimer, resumeTimer, toggleTimerSide, cancelTimer, finishTimer } = useLog();
  const label = timerSide === "left" ? "Peito esquerdo" : "Peito direito";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex justify-center px-4 sm:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-brand-200 bg-brand-500/95 px-3 py-2.5 text-white shadow-lift glass dark:border-brand-800">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15">
          <Milk className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight">{label}</p>
          <p className="tabular text-xl font-extrabold leading-tight">{stopwatchLabel(timerSeconds)}</p>
        </div>
        <button
          type="button"
          onClick={toggleTimerSide}
          className="rounded-xl bg-white/15 px-2.5 py-2 text-[11px] font-bold transition-colors hover:bg-white/25"
        >
          Trocar
        </button>
        <button
          type="button"
          onClick={timerPaused ? resumeTimer : pauseTimer}
          aria-label={timerPaused ? "Retomar" : "Pausar"}
          className="grid size-9 place-items-center rounded-xl bg-white/15 transition-colors hover:bg-white/25"
        >
          {timerPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          type="button"
          onClick={finishTimer}
          className="rounded-xl bg-white px-3 py-2 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={cancelTimer}
          aria-label="Descartar cronômetro"
          className="grid size-9 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function useLog(): LogApi {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog precisa estar dentro de <LogProvider>.");
  return ctx;
}

// ── Grade de ações rápidas ──────────────────────────────────────

const QUICK_ORDER: LogKind[] = ["feeding", "sleep", "diaper", "measurement", "medicine", "symptom", "appointment", "note"];

export function QuickLogDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const log = useLog();

  return (
    <Dialog open={open} onClose={onClose} title="O que vamos registrar?" size="md">
      <div className="grid grid-cols-2 gap-2.5 pb-5 sm:grid-cols-4">
        {QUICK_ORDER.map((kind) => {
          const meta = LOG_META[kind];
          const Icon = ICONS[meta.icon];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => {
                onClose();
                log.open(kind);
              }}
              className="group flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-bg-elevated p-3.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <span className={cn("grid size-10 place-items-center rounded-xl", meta.color)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-fg">{meta.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-fg-subtle">{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

/** Botão flutuante de registro rápido — aparece no rodapé mobile. */
export function QuickLogButton({ onClick, label = "Registrar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift transition-all hover:bg-brand-600 active:scale-95"
    >
      <Plus className="size-6" strokeWidth={2.6} />
    </button>
  );
}

