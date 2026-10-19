import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppEvent, Child, DiaryEntry, FamilySnapshot, Measurement, Sex, EmergencyContact } from "@/lib/types";
import { SNAPSHOT_VERSION } from "@/lib/types";
import type { DataSource } from "./types";
import { StorageError } from "./types";

/**
 * Adaptador Supabase (modo nuvem).
 *
 * Segurança: toda a proteção fica no banco, via Row Level Security
 * (supabase/schema.sql). Este código roda no navegador e nunca confia no
 * cliente — se um usuário não pertence à família, o Postgres recusa a linha.
 */

// ── Mapeamento linha ⇄ domínio ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

const str = (v: unknown): string | null => (v == null ? null : String(v));

function toChild(r: Row): Child {
  return {
    id: r.id,
    firstName: r.first_name ?? "",
    middleName: str(r.middle_name),
    lastName: str(r.last_name),
    nickname: str(r.nickname),
    sex: (r.sex as Sex) ?? "female",
    birthDate: typeof r.birth_date === "string" ? r.birth_date.slice(0, 10) : String(r.birth_date),
    birthTime: str(r.birth_time)?.slice(0, 5) ?? null,
    birthWeightKg: num(r.birth_weight_kg),
    birthLengthCm: num(r.birth_length_cm),
    birthHeadCm: num(r.birth_head_cm),
    gestationalWeeks: num(r.gestational_weeks),
    bloodType: str(r.blood_type),
    color: str(r.color),
    photoDataUrl: str(r.photo_data_url),
    notes: str(r.notes),
    fatherHeightCm: num(r.father_height_cm),
    motherHeightCm: num(r.mother_height_cm),
    pediatricianName: str(r.pediatrician_name),
    pediatricianPhone: str(r.pediatrician_phone),
    healthPlan: str(r.health_plan),
    emergencyContacts: Array.isArray(r.emergency_contacts)
      ? (r.emergency_contacts as EmergencyContact[])
      : [],
    archived: Boolean(r.archived),
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

function fromChild(c: Child, householdId: string): Row {
  return {
    id: c.id,
    household_id: householdId,
    first_name: c.firstName,
    middle_name: c.middleName,
    last_name: c.lastName,
    nickname: c.nickname,
    sex: c.sex,
    birth_date: c.birthDate,
    birth_time: c.birthTime,
    birth_weight_kg: c.birthWeightKg,
    birth_length_cm: c.birthLengthCm,
    birth_head_cm: c.birthHeadCm,
    gestational_weeks: c.gestationalWeeks,
    blood_type: c.bloodType,
    color: c.color,
    photo_data_url: c.photoDataUrl,
    notes: c.notes,
    father_height_cm: c.fatherHeightCm ?? null,
    mother_height_cm: c.motherHeightCm ?? null,
    pediatrician_name: c.pediatricianName ?? null,
    pediatrician_phone: c.pediatricianPhone ?? null,
    health_plan: c.healthPlan ?? null,
    emergency_contacts: c.emergencyContacts ?? [],
    archived: c.archived,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function toMeasurement(r: Row): Measurement {
  return {
    id: r.id,
    childId: r.child_id,
    takenAt: r.taken_at,
    weightKg: num(r.weight_kg),
    lengthCm: num(r.length_cm),
    headCm: num(r.head_cm),
    source: (r.source as Measurement["source"]) ?? "casa",
    note: str(r.note),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function fromMeasurement(m: Measurement): Row {
  return {
    id: m.id,
    child_id: m.childId,
    taken_at: m.takenAt,
    weight_kg: m.weightKg,
    length_cm: m.lengthCm,
    head_cm: m.headCm,
    source: m.source,
    note: m.note,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

function toEvent(r: Row): AppEvent {
  return {
    id: r.id,
    childId: r.child_id,
    kind: r.kind as AppEvent["kind"],
    startedAt: r.started_at,
    endedAt: str(r.ended_at),
    durationMin: num(r.duration_min),
    payload: (r.payload as Record<string, unknown>) ?? {},
    note: str(r.note),
    photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: str(r.deleted_at),
  };
}

function fromEvent(e: AppEvent): Row {
  return {
    id: e.id,
    child_id: e.childId,
    kind: e.kind,
    started_at: e.startedAt,
    ended_at: e.endedAt,
    duration_min: e.durationMin,
    payload: e.payload,
    note: e.note,
    photos: e.photos,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt,
  };
}

function toDiary(r: Row): DiaryEntry {
  return {
    id: r.id,
    childId: r.child_id,
    date: String(r.date).slice(0, 10),
    title: str(r.title),
    text: r.text ?? "",
    mood: (r.mood as DiaryEntry["mood"]) ?? null,
    photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: str(r.deleted_at),
  };
}

function fromDiary(d: DiaryEntry): Row {
  return {
    id: d.id,
    child_id: d.childId,
    date: d.date,
    title: d.title,
    text: d.text,
    mood: d.mood,
    photos: d.photos,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    deleted_at: d.deletedAt,
  };
}

function fail(op: string, err: { message?: string } | null): never {
  throw new StorageError(
    `Falha ao ${op} na nuvem: ${err?.message ?? "erro desconhecido"}`,
    err,
  );
}

// ── Adaptador ───────────────────────────────────────────────────

export function createSupabaseDataSource(supabase: SupabaseClient): DataSource {
  let householdPromise: Promise<string> | null = null;

  /** Descobre a família do usuário, criando-a no primeiro acesso. */
  async function resolveHousehold(): Promise<string> {
    if (!householdPromise) {
      householdPromise = (async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) fail("identificar o usuário", userError);

        const { data: existing } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (existing?.household_id) return existing.household_id as string;

        const { data: created, error } = await supabase
          .from("households")
          .insert({ name: "Família Ricartes" })
          .select("id")
          .single();
        if (error) fail("criar a família", error);

        const { error: memberError } = await supabase
          .from("household_members")
          .insert({ household_id: created.id, user_id: user.id, role: "admin" });
        if (memberError) fail("registrar você na família", memberError);

        return created.id as string;
      })();
    }
    return householdPromise;
  }

  return {
    kind: "supabase",

    async listChildren() {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) fail("listar crianças", error);
      return (data ?? []).map(toChild).filter((c) => !c.archived);
    },

    async listMeasurements(childId) {
      const { data, error } = await supabase
        .from("measurements")
        .select("*")
        .eq("child_id", childId)
        .order("taken_at", { ascending: true });
      if (error) fail("listar medições", error);
      return (data ?? []).map(toMeasurement);
    },

    async listEvents(childId) {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("child_id", childId)
        .is("deleted_at", null)
        .order("started_at", { ascending: true });
      if (error) fail("listar registros", error);
      return (data ?? []).map(toEvent);
    },

    async listDiary(childId) {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("child_id", childId)
        .is("deleted_at", null)
        .order("date", { ascending: false });
      if (error) fail("listar o diário", error);
      return (data ?? []).map(toDiary);
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
      const householdId = await resolveHousehold();
      const { error } = await supabase
        .from("children")
        .upsert(fromChild(child, householdId), { onConflict: "id" });
      if (error) fail("salvar os dados da criança", error);
      return child;
    },

    async deleteChild(id) {
      const { error } = await supabase.from("children").delete().eq("id", id);
      if (error) fail("remover a criança", error);
    },

    async saveMeasurement(measurement) {
      const { error } = await supabase
        .from("measurements")
        .upsert(fromMeasurement(measurement), { onConflict: "id" });
      if (error) fail("salvar a medição", error);
      return measurement;
    },

    async deleteMeasurement(id) {
      const { error } = await supabase.from("measurements").delete().eq("id", id);
      if (error) fail("remover a medição", error);
    },

    async saveEvent(event) {
      const { error } = await supabase.from("events").upsert(fromEvent(event), { onConflict: "id" });
      if (error) fail("salvar o registro", error);
      return event;
    },

    async deleteEvent(id) {
      const { error } = await supabase
        .from("events")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) fail("remover o registro", error);
    },

    async saveDiary(entry) {
      const { error } = await supabase
        .from("diary_entries")
        .upsert(fromDiary(entry), { onConflict: "id" });
      if (error) fail("salvar a anotação", error);
      return entry;
    },

    async deleteDiary(id) {
      const { error } = await supabase
        .from("diary_entries")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) fail("remover a anotação", error);
    },

    async replaceSnapshot(snapshot) {
      const householdId = await resolveHousehold();
      const { error: clearError } = await supabase
        .from("children")
        .delete()
        .in("id", snapshot.children.map((c) => c.id));
      if (clearError && clearError.code !== "PGRST116") fail("limpar dados anteriores", clearError);

      const { error: childError } = await supabase
        .from("children")
        .upsert(snapshot.children.map((c) => fromChild(c, householdId)), { onConflict: "id" });
      if (childError) fail("importar crianças", childError);

      if (snapshot.measurements.length) {
        const { error } = await supabase
          .from("measurements")
          .upsert(snapshot.measurements.map(fromMeasurement), { onConflict: "id" });
        if (error) fail("importar medições", error);
      }
      if (snapshot.events.length) {
        const { error } = await supabase
          .from("events")
          .upsert(snapshot.events.map(fromEvent), { onConflict: "id" });
        if (error) fail("importar registros", error);
      }
      if (snapshot.diary.length) {
        const { error } = await supabase
          .from("diary_entries")
          .upsert(snapshot.diary.map(fromDiary), { onConflict: "id" });
        if (error) fail("importar o diário", error);
      }
    },
  };
}
