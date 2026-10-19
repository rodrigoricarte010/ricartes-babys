import { get, set, del, createStore } from "idb-keyval";
import type {
  AppEvent,
  Child,
  DiaryEntry,
  FamilySnapshot,
  Measurement,
} from "@/lib/types";
import { SNAPSHOT_VERSION } from "@/lib/types";
import type { DataSource } from "./types";
import { StorageError } from "./types";

/**
 * Adaptador local (IndexedDB).
 *
 * Sem conta, sem servidor, sem custo — os dados nunca saem do aparelho.
 * É o modo padrão do app enquanto o Supabase não estiver configurado, e
 * continua servindo de cache quando ele estiver.
 */

const store =
  typeof indexedDB !== "undefined"
    ? createStore("ricartes-babys", "dados")
    : (undefined as never);

const K = {
  children: "children",
  measurements: (id: string) => `measurements:${id}`,
  events: (id: string) => `events:${id}`,
  diary: (id: string) => `diary:${id}`,
  meta: "meta",
};

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await get<T>(key, store);
    return value ?? fallback;
  } catch (err) {
    throw new StorageError(`Não foi possível ler "${key}" do armazenamento local.`, err);
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value, store);
  } catch (err) {
    throw new StorageError(`Não foi possível gravar "${key}" no armazenamento local.`, err);
  }
}

/** Insere ou substitui por id, mantendo a ordem do mais antigo para o mais novo. */
function upsert<T extends { id: string; createdAt: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const next = [...list];
  next[idx] = item;
  return next;
}

function live<T extends { deletedAt: string | null }>(list: T[]): T[] {
  return list.filter((x) => !x.deletedAt);
}

export interface LocalMeta {
  seeded: boolean;
  version: number;
  installedAt: string;
  /** Define quando a família de demonstração foi removida a pedido do usuário. */
  demoRemoved?: boolean;
}

export async function getLocalMeta(): Promise<LocalMeta | null> {
  return read<LocalMeta | null>(K.meta, null);
}

export async function setLocalMeta(meta: LocalMeta): Promise<void> {
  await write(K.meta, meta);
}

export const localDataSource: DataSource = {
  kind: "local",

  async listChildren() {
    // Crianças não têm delete lógico: remover apaga a linha e os filhos dela.
    return read<Child[]>(K.children, []);
  },

  async listMeasurements(childId) {
    const all = await read<Measurement[]>(K.measurements(childId), []);
    return all.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  },

  async listEvents(childId) {
    const all = await read<AppEvent[]>(K.events(childId), []);
    return live(all).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  },

  async listDiary(childId) {
    const all = await read<DiaryEntry[]>(K.diary(childId), []);
    return live(all).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getSnapshot(): Promise<FamilySnapshot> {
    const children = await this.listChildren();
    const measurements: Measurement[] = [];
    const events: AppEvent[] = [];
    const diary: DiaryEntry[] = [];
    for (const child of children) {
      measurements.push(...(await this.listMeasurements(child.id)));
      events.push(...(await this.listEvents(child.id)));
      diary.push(...(await this.listDiary(child.id)));
    }
    return {
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      familyName: "Ricartes",
      children,
      measurements,
      events,
      diary,
    };
  },

  async saveChild(child) {
    const list = await read<Child[]>(K.children, []);
    await write(K.children, upsert(list, child));
    return child;
  },

  async deleteChild(id) {
    const list = await read<Child[]>(K.children, []);
    await write(K.children, list.filter((c) => c.id !== id));
    await del(K.measurements(id), store);
    await del(K.events(id), store);
    await del(K.diary(id), store);
  },

  async saveMeasurement(measurement) {
    const list = await read<Measurement[]>(K.measurements(measurement.childId), []);
    await write(K.measurements(measurement.childId), upsert(list, measurement));
    return measurement;
  },

  async deleteMeasurement(id) {
    const children = await read<Child[]>(K.children, []);
    for (const child of children) {
      const key = K.measurements(child.id);
      const list = await read<Measurement[]>(key, []);
      if (list.some((m) => m.id === id)) {
        await write(key, list.filter((m) => m.id !== id));
        return;
      }
    }
  },

  async saveEvent(event) {
    const list = await read<AppEvent[]>(K.events(event.childId), []);
    await write(K.events(event.childId), upsert(list, event));
    return event;
  },

  async deleteEvent(id) {
    // Delete lógico: preserva o registro para uma futura sincronização.
    const children = await read<Child[]>(K.children, []);
    for (const child of children) {
      const key = K.events(child.id);
      const list = await read<AppEvent[]>(key, []);
      const found = list.find((e) => e.id === id);
      if (found) {
        await write(key, upsert(list, { ...found, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
        return;
      }
    }
  },

  async saveDiary(entry) {
    const list = await read<DiaryEntry[]>(K.diary(entry.childId), []);
    await write(K.diary(entry.childId), upsert(list, entry));
    return entry;
  },

  async deleteDiary(id) {
    const children = await read<Child[]>(K.children, []);
    for (const child of children) {
      const key = K.diary(child.id);
      const list = await read<DiaryEntry[]>(key, []);
      const found = list.find((d) => d.id === id);
      if (found) {
        await write(key, upsert(list, { ...found, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
        return;
      }
    }
  },

  async replaceSnapshot(snapshot) {
    await write(K.children, snapshot.children);
    const children = await read<Child[]>(K.children, []);
    for (const child of children) {
      await write(K.measurements(child.id), []);
      await write(K.events(child.id), []);
      await write(K.diary(child.id), []);
    }
    for (const m of snapshot.measurements) {
      const list = await read<Measurement[]>(K.measurements(m.childId), []);
      await write(K.measurements(m.childId), upsert(list, m));
    }
    for (const e of snapshot.events) {
      const list = await read<AppEvent[]>(K.events(e.childId), []);
      await write(K.events(e.childId), upsert(list, e));
    }
    for (const d of snapshot.diary) {
      const list = await read<DiaryEntry[]>(K.diary(d.childId), []);
      await write(K.diary(d.childId), upsert(list, d));
    }
  },
};

/** Apaga tudo — usado em "começar do zero" nas configurações. */
export async function clearLocalData(): Promise<void> {
  // Lê primeiro: depois de apagar a lista não sabemos mais quais chaves existiam.
  const children = await read<Child[]>(K.children, []);
  for (const child of children) {
    await del(K.measurements(child.id), store);
    await del(K.events(child.id), store);
    await del(K.diary(child.id), store);
  }
  await del(K.children, store);
  await del(K.meta, store);
}
