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
import type { AppEvent, Child, DiaryEntry, Measurement, StorageMode } from "@/lib/types";
import {
  currentMode,
  ensureSeeded,
  getDataSource,
  newId,
  nowStamp,
} from "@/lib/db";
import { buildDemoChild, buildDemoDiary, buildDemoEvents, buildDemoMeasurements, DEMO_CHILD_ID } from "@/lib/db/seed";
import { sortBy } from "@/lib/utils";

/**
 * Estado global da família.
 *
 * Tudo é otimista: a interface responde na hora e a gravação acontece em
 * seguida. Num app que se usa com um bebê no colo, esperar 400 ms por um
 * registro de mamada é motivo para desistir de registrar.
 */

const ACTIVE_CHILD_KEY = "rb:active-child";
const READ_ONLY_KEY = "rb:read-only";

interface StoreValue {
  /** Modo visita: bloqueia todas as mutações NESTE aparelho. */
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;

  ready: boolean;
  mode: StorageMode;
  online: boolean;
  error: string | null;

  children: Child[];
  activeChild: Child | null;
  measurements: Measurement[];
  events: AppEvent[];
  diary: DiaryEntry[];

  setActiveChildId: (id: string | null) => void;
  reload: () => Promise<void>;
  restoreDemo: () => Promise<void>;

  upsertChild: (child: Child) => Promise<void>;
  createChild: (child: Omit<Child, "id" | "createdAt" | "updatedAt">) => Promise<Child>;
  removeChild: (id: string) => Promise<void>;

  upsertMeasurement: (m: Measurement) => Promise<void>;
  createMeasurement: (m: Omit<Measurement, "id" | "createdAt" | "updatedAt">) => Promise<Measurement>;
  removeMeasurement: (id: string) => Promise<void>;

  upsertEvent: (e: AppEvent) => Promise<void>;
  createEvent: (e: Omit<AppEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<AppEvent>;
  removeEvent: (id: string) => Promise<void>;

  upsertDiary: (d: DiaryEntry) => Promise<void>;
  createDiary: (d: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<DiaryEntry>;
  removeDiary: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<StorageMode>("local");
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);

  const loadToken = useRef(0);

  const activeChild = useMemo(
    () => allChildren.find((c) => c.id === activeChildId) ?? allChildren[0] ?? null,
    [allChildren, activeChildId],
  );

  const loadChildData = useCallback(async (childId: string | null) => {
    const ds = getDataSource();
    if (!childId) {
      setMeasurements([]);
      setEvents([]);
      setDiary([]);
      return;
    }
    try {
      const [m, e, d] = await Promise.all([
        ds.listMeasurements(childId),
        ds.listEvents(childId),
        ds.listDiary(childId),
      ]);
      setMeasurements(sortBy(m, (x) => x.takenAt));
      setEvents(sortBy(e, (x) => x.startedAt));
      setDiary(sortBy(d, (x) => x.date).reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os dados.");
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const token = ++loadToken.current;
    setError(null);
    try {
      await ensureSeeded();
      const ds = getDataSource();
      const kids = await ds.listChildren();
      if (token !== loadToken.current) return;
      setMode(currentMode());
      setAllChildren(kids);

      const saved =
        typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_CHILD_KEY) : null;
      const nextActive =
        (saved && kids.some((k) => k.id === saved) ? saved : null) ?? kids[0]?.id ?? null;
      setActiveChildIdState(nextActive);
      await loadChildData(nextActive);
      if (token !== loadToken.current) return;
      setReady(true);
    } catch (err) {
      if (token !== loadToken.current) return;
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o armazenamento.");
      setReady(true);
    }
  }, [loadChildData]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Recarrega os dados da criança ativa quando ela muda.
  useEffect(() => {
    if (!ready) return;
    void loadChildData(activeChild?.id ?? null);
  }, [ready, activeChild?.id, loadChildData]);

  const setActiveChildId = useCallback((id: string | null) => {
    setActiveChildIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(ACTIVE_CHILD_KEY, id);
      else window.localStorage.removeItem(ACTIVE_CHILD_KEY);
    }
  }, []);

  /** Recoloca a Rosie Grace de exemplo (útil depois de apagar tudo). */
  const restoreDemo = useCallback(async () => {
    const ds = getDataSource();
    const now = new Date();
    const child = buildDemoChild();
    await ds.saveChild(child);
    for (const m of buildDemoMeasurements(now)) await ds.saveMeasurement(m);
    for (const e of buildDemoEvents(now)) await ds.saveEvent(e);
    for (const d of buildDemoDiary(now)) await ds.saveDiary(d);
    await bootstrap();
    setActiveChildId(DEMO_CHILD_ID);
  }, [bootstrap, setActiveChildId]);

  const withError = useCallback(async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado ao salvar.");
      throw err;
    }
  }, []);

  // ── Modo visita (somente leitura neste aparelho) ─────────────
  const [readOnly, setReadOnlyState] = useState(false);
  const readOnlyRef = useRef(false);

  useEffect(() => {
    setReadOnlyState(window.localStorage.getItem(READ_ONLY_KEY) === "1");
  }, []);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  const setReadOnly = useCallback((v: boolean) => {
    setReadOnlyState(v);
    if (v) window.localStorage.setItem(READ_ONLY_KEY, "1");
    else window.localStorage.removeItem(READ_ONLY_KEY);
  }, []);

  /** Barreira de segurança: nenhuma mutação passa com o modo visita ativo. */
  const assertWritable = useCallback(() => {
    if (readOnlyRef.current) {
      throw new Error("Modo visita ativo — desative em Configurações para editar.");
    }
  }, []);

  // ── Mutações ────────────────────────────────────────────────

  const upsertChild = useCallback(
    async (child: Child) => {
      assertWritable();
      const next = { ...child, updatedAt: nowStamp() };
      setAllChildren((prev) => {
        const idx = prev.findIndex((c) => c.id === next.id);
        if (idx === -1) return [...prev, next];
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      });
      setActiveChildIdState((prev) => prev ?? next.id);
      await withError(async () => {
        await getDataSource().saveChild(next);
      });
    },
    [withError, setActiveChildIdState, assertWritable],
  );

  const createChild = useCallback(
    async (child: Omit<Child, "id" | "createdAt" | "updatedAt">) => {
      const stamp = nowStamp();
      const full: Child = { ...child, id: newId(), createdAt: stamp, updatedAt: stamp };
      await upsertChild(full);
      setActiveChildId(full.id);
      return full;
    },
    [upsertChild, setActiveChildId],
  );

  const removeChild = useCallback(
    async (id: string) => {
      assertWritable();
      setAllChildren((prev) => prev.filter((c) => c.id !== id));
      await withError(async () => {
        await getDataSource().deleteChild(id);
      });
      if (activeChildId === id) setActiveChildId(null);
    },
    [withError, activeChildId, setActiveChildId, assertWritable],
  );

  const upsertMeasurement = useCallback(
    async (measurement: Measurement) => {
      assertWritable();
      const next = { ...measurement, updatedAt: nowStamp() };
      setMeasurements((prev) => {
        const idx = prev.findIndex((m) => m.id === next.id);
        if (idx === -1) return sortBy([...prev, next], (m) => m.takenAt);
        const copy = [...prev];
        copy[idx] = next;
        return sortBy(copy, (m) => m.takenAt);
      });
      await withError(async () => {
        await getDataSource().saveMeasurement(next);
      });
    },
    [withError, assertWritable],
  );

  const createMeasurement = useCallback(
    async (m: Omit<Measurement, "id" | "createdAt" | "updatedAt">) => {
      const stamp = nowStamp();
      const full: Measurement = { ...m, id: newId(), createdAt: stamp, updatedAt: stamp };
      await upsertMeasurement(full);
      return full;
    },
    [upsertMeasurement],
  );

  const removeMeasurement = useCallback(
    async (id: string) => {
      assertWritable();
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      await withError(async () => {
        await getDataSource().deleteMeasurement(id);
      });
    },
    [withError, assertWritable],
  );

  const upsertEvent = useCallback(
    async (event: AppEvent) => {
      assertWritable();
      const next = { ...event, updatedAt: nowStamp() };
      setEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === next.id);
        if (idx === -1) return sortBy([...prev, next], (e) => e.startedAt);
        const copy = [...prev];
        copy[idx] = next;
        return sortBy(copy, (e) => e.startedAt);
      });
      await withError(async () => {
        await getDataSource().saveEvent(next);
      });
    },
    [withError, assertWritable],
  );

  const createEvent = useCallback(
    async (e: Omit<AppEvent, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
      const stamp = nowStamp();
      const full: AppEvent = {
        ...e,
        id: newId(),
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: null,
      };
      await upsertEvent(full);
      return full;
    },
    [upsertEvent],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      assertWritable();
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await withError(async () => {
        await getDataSource().deleteEvent(id);
      });
    },
    [withError, assertWritable],
  );

  const upsertDiary = useCallback(
    async (entry: DiaryEntry) => {
      assertWritable();
      const next = { ...entry, updatedAt: nowStamp() };
      setDiary((prev) => {
        const idx = prev.findIndex((d) => d.id === next.id);
        if (idx === -1) return sortBy([next, ...prev], (d) => d.date).reverse();
        const copy = [...prev];
        copy[idx] = next;
        return sortBy(copy, (d) => d.date).reverse();
      });
      await withError(async () => {
        await getDataSource().saveDiary(next);
      });
    },
    [withError, assertWritable],
  );

  const createDiary = useCallback(
    async (d: Omit<DiaryEntry, "id" | "createdAt" | "updatedAt" | "deletedAt">) => {
      const stamp = nowStamp();
      const full: DiaryEntry = {
        ...d,
        id: newId(),
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: null,
      };
      await upsertDiary(full);
      return full;
    },
    [upsertDiary],
  );

  const removeDiary = useCallback(
    async (id: string) => {
      assertWritable();
      setDiary((prev) => prev.filter((d) => d.id !== id));
      await withError(async () => {
        await getDataSource().deleteDiary(id);
      });
    },
    [withError, assertWritable],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      mode,
      online,
      error,
      children: allChildren,
      activeChild,
      measurements,
      events,
      diary,
      setActiveChildId,
      reload: bootstrap,
      restoreDemo,
      upsertChild,
      createChild,
      removeChild,
      upsertMeasurement,
      createMeasurement,
      removeMeasurement,
      upsertEvent,
      createEvent,
      removeEvent,
      upsertDiary,
      createDiary,
      removeDiary,
      readOnly,
      setReadOnly,
    }),
    [
      ready,
      mode,
      online,
      error,
      allChildren,
      activeChild,
      measurements,
      events,
      diary,
      setActiveChildId,
      bootstrap,
      restoreDemo,
      upsertChild,
      createChild,
      removeChild,
      upsertMeasurement,
      createMeasurement,
      removeMeasurement,
      upsertEvent,
      createEvent,
      removeEvent,
      upsertDiary,
      createDiary,
      removeDiary,
      readOnly,
      setReadOnly,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>.");
  return ctx;
}

/** Atalho: dados da criança ativa, com fallback seguro. */
export function useActiveChild() {
  const { activeChild, measurements, events, diary, ready } = useStore();
  return { child: activeChild, measurements, events, diary, ready };
}
