import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { StickerCard } from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { KIND_LABELS, KIND_ORDER, RARITY_LABELS, type CardFace, type CardKind, type Rarity } from "@/lib/album";
import { cn } from "@/lib/utils";

type EditableKind = Exclude<CardKind, "circuit">;

type FieldKey =
  | "team_id"
  | "team_name"
  | "team_code"
  | "driver_name"
  | "driver_code"
  | "number"
  | "points"
  | "wins"
  | "position"
  | "since"
  | "titles"
  | "country_code"
  | "wiki_url"
  | "image";

type CardRow = {
  id: string;
  kind: string;
  ref_id: string;
  season: number;
  name: string;
  subtitle: string | null;
  rarity: string;
  stats: Record<string, unknown> | null;
  active: boolean;
};

type Status = { type: "ok" | "error"; text: string } | null;

type FormState = {
  mode: "new" | "edit";
  id: string; // solo se usa al editar
  kind: EditableKind;
  season: string;
  ref_id: string;
  name: string;
  subtitle: string;
  subtitleTouched: boolean;
  rarity: Rarity;
  active: boolean;
  fields: Record<FieldKey, string>;
  baseStats: Record<string, unknown>;
};

const EDITABLE_KINDS: EditableKind[] = ["driver", "team", "livery", "helmet", "manager", "engineer"];
const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

// Qué datos tiene cada tipo de carta.
const KIND_FIELDS: Record<EditableKind, FieldKey[]> = {
  driver: ["team_id", "team_name", "number", "points", "wins", "position", "image", "wiki_url"],
  team: ["team_id", "team_name", "points", "wins", "position"],
  livery: ["team_id", "team_name", "team_code", "image"],
  helmet: ["driver_name", "driver_code", "team_id", "team_name", "team_code", "image"],
  manager: ["team_id", "team_name", "team_code", "country_code", "since", "titles", "image"],
  engineer: ["team_id", "team_name", "team_code", "country_code", "since", "titles", "image"],
};

const NUMERIC_FIELDS: FieldKey[] = ["number", "points", "wins", "position", "since", "titles"];
const WIDE_FIELDS: FieldKey[] = ["team_name", "driver_name", "wiki_url", "image"];

const ALL_FIELDS: FieldKey[] = [
  "team_id",
  "team_name",
  "team_code",
  "driver_name",
  "driver_code",
  "number",
  "points",
  "wins",
  "position",
  "since",
  "titles",
  "country_code",
  "wiki_url",
  "image",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  team_id: "ID de la escudería",
  team_name: "Nombre de la escudería",
  team_code: "Sigla (3 letras)",
  driver_name: "Nombre del piloto",
  driver_code: "Sigla del piloto (3 letras)",
  number: "Número",
  points: "Puntos",
  wins: "Victorias",
  position: "Posición",
  since: "Desde (año)",
  titles: "Títulos",
  country_code: "País (código)",
  wiki_url: "Link de Wikipedia",
  image: "Archivo de la imagen",
};

const FIELD_HINTS: Partial<Record<FieldKey, string>> = {
  team_id: "Define el color de la carta. Elegí uno de la lista o escribí otro (ej. maserati).",
  image:
    "Opcional. Si lo dejás vacío usa la regla automática (cascos: helmets/<identificador>.png). Para un piloto de otra temporada ponele un nombre propio, ej. stroll2017.png",
  country_code: "Mismo formato que las cartas de circuito.",
};

// Datos de las escuderías conocidas para autocompletar.
const TEAM_PRESETS: Record<string, { name: string; code: string }> = {
  mercedes: { name: "Mercedes", code: "MER" },
  ferrari: { name: "Ferrari", code: "FER" },
  mclaren: { name: "McLaren", code: "MCL" },
  red_bull: { name: "Red Bull", code: "RBR" },
  aston_martin: { name: "Aston Martin", code: "AMR" },
  alpine: { name: "Alpine F1 Team", code: "ALP" },
  williams: { name: "Williams", code: "WIL" },
  rb: { name: "RB F1 Team", code: "RB" },
  haas: { name: "Haas F1 Team", code: "HAA" },
  sauber: { name: "Sauber", code: "SAU" },
  audi: { name: "Audi", code: "AUD" },
  cadillac: { name: "Cadillac F1 Team", code: "CAD" },
  lotus: { name: "Lotus", code: "LOT" },
  toro_rosso: { name: "Toro Rosso", code: "TR" },
  renault: { name: "Renault", code: "REN" },
  maserati: { name: "Maserati", code: "MAS" },
  alphatauri: { name: "AlphaTauri", code: "AT" },
};

const TEAM_LIST_ID = "admin-card-team-ids";
const IMAGE_RE = /^[A-Za-z0-9][A-Za-z0-9_./-]*\.(png|webp|jpg|jpeg)$/;
const REF_RE = /^[a-z0-9_]{1,60}$/;

const SELECT_CLASS =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60";

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

function kindLabel(kind: string): string {
  return (KIND_LABELS as Record<string, string | undefined>)[kind] ?? kind;
}

function rarityLabel(rarity: string): string {
  return (RARITY_LABELS as Record<string, string | undefined>)[rarity] ?? rarity;
}

function emptyFields(): Record<FieldKey, string> {
  return {
    team_id: "",
    team_name: "",
    team_code: "",
    driver_name: "",
    driver_code: "",
    number: "",
    points: "",
    wins: "",
    position: "",
    since: "",
    titles: "",
    country_code: "",
    wiki_url: "",
    image: "",
  };
}

function newForm(kind: EditableKind, season: string): FormState {
  return {
    mode: "new",
    id: "",
    kind,
    season,
    ref_id: "",
    name: "",
    subtitle: "",
    subtitleTouched: false,
    rarity: "common",
    active: false,
    fields: emptyFields(),
    baseStats: {},
  };
}

function formFromRow(row: CardRow): FormState | null {
  const kind = EDITABLE_KINDS.find((value) => value === row.kind);
  if (!kind) return null;

  const stats = row.stats ?? {};
  const fields = emptyFields();
  for (const key of ALL_FIELDS) {
    const value = stats[key];
    if (typeof value === "string" || typeof value === "number") fields[key] = String(value);
  }

  return {
    mode: "edit",
    id: row.id,
    kind,
    season: String(row.season),
    ref_id: row.ref_id,
    name: row.name,
    subtitle: row.subtitle ?? "",
    subtitleTouched: true,
    rarity: row.rarity as Rarity,
    active: row.active,
    fields,
    baseStats: stats,
  };
}

function autoSubtitle(kind: EditableKind, season: string, fields: Record<FieldKey, string>): string {
  const team = fields.team_name.trim();
  const driver = fields.driver_name.trim();
  switch (kind) {
    case "driver":
      return team ? `${team} · ${season}` : season;
    case "team":
      return `Escudería ${season}`;
    case "livery":
      return `Livery especial ${season}`;
    case "helmet":
      return driver ? `${driver} · ${season}` : `Casco ${season}`;
    case "manager":
      return team ? `${team} · Jefe de equipo` : "Jefe de equipo";
    case "engineer":
      return team ? `${team} · Ingeniero` : "Ingeniero";
  }
}

// Arma los datos de la carta: parte de los que ya tenía (para no perder los que el formulario no maneja).
function buildStats(form: FormState): { stats: Record<string, unknown>; error: string | null } {
  const stats: Record<string, unknown> = { ...form.baseStats };

  for (const key of KIND_FIELDS[form.kind]) {
    delete stats[key];
    const raw = form.fields[key].trim();
    if (raw === "") continue;

    if (NUMERIC_FIELDS.includes(key)) {
      const value = Number(raw.replace(",", "."));
      if (!Number.isFinite(value) || value < 0) {
        return { stats, error: `"${FIELD_LABELS[key]}" tiene que ser un número.` };
      }
      stats[key] = value;
    } else {
      stats[key] = raw;
    }
  }

  return { stats, error: null };
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={cn(
        "rounded-md p-2 text-xs",
        status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {status.text}
    </p>
  );
}

function Field({
  label,
  hint,
  wide = false,
  children,
}: {
  label: string;
  hint?: string | undefined;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", wide && "col-span-2")}>
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AdminCards() {
  const [rows, setRows] = useState<CardRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => newForm("driver", String(new Date().getFullYear())));
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | CardKind>("all");
  const formRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("admin_album_list_cards");
    if (rpcError) {
      console.error("Listar cartas:", rpcError);
      setError("No pudimos cargar las cartas. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setRows(data as unknown as CardRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Formulario ----
  const setField = (key: FieldKey, value: string) =>
    setForm((prev) => {
      const fields = { ...prev.fields, [key]: value };
      if (key === "team_id") {
        const preset = TEAM_PRESETS[value.trim().toLowerCase()];
        if (preset) {
          if (fields.team_name.trim() === "") fields.team_name = preset.name;
          if (fields.team_code.trim() === "") fields.team_code = preset.code;
        }
      }
      return { ...prev, fields };
    });

  const subtitleValue = form.subtitleTouched
    ? form.subtitle
    : autoSubtitle(form.kind, form.season.trim(), form.fields);
  const cardId =
    form.mode === "edit" ? form.id : `${form.kind}:${form.season.trim()}:${form.ref_id.trim().toLowerCase()}`;

  const preview: CardFace = {
    card_id: cardId,
    kind: form.kind,
    name: form.name.trim() || "Nombre",
    subtitle: subtitleValue.trim() || null,
    rarity: form.rarity,
    stats: buildStats(form).stats,
  };

  const currentYear = new Date().getFullYear();
  const syncWarning = (form.kind === "driver" || form.kind === "team") && Number(form.season) === currentYear;

  const startEdit = (row: CardRow) => {
    const next = formFromRow(row);
    if (!next) {
      setStatus({
        type: "error",
        text: "Los circuitos salen del juego diario: desde acá solo podés activarlos o desactivarlos.",
      });
      return;
    }
    setForm(next);
    setStatus(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const onSave = async () => {
    setStatus(null);

    const season = Number(form.season.trim());
    const ref = form.ref_id.trim().toLowerCase();
    const name = form.name.trim();

    if (!Number.isInteger(season) || season < 1950 || season > 2100) {
      setStatus({ type: "error", text: "La temporada tiene que ser un año entre 1950 y 2100." });
      return;
    }
    if (!REF_RE.test(ref)) {
      setStatus({ type: "error", text: "El identificador solo admite minúsculas, números y guion bajo (ej. max_verstappen)." });
      return;
    }
    if (name === "") {
      setStatus({ type: "error", text: "Falta el nombre de la carta." });
      return;
    }

    const built = buildStats(form);
    if (built.error) {
      setStatus({ type: "error", text: built.error });
      return;
    }
    const image = built.stats["image"];
    if (typeof image === "string" && (!IMAGE_RE.test(image) || image.includes(".."))) {
      setStatus({ type: "error", text: "El archivo de imagen tiene que terminar en .png, .webp o .jpg (sin espacios)." });
      return;
    }

    const subtitle = subtitleValue.trim();
    const payload = {
      ...(form.mode === "edit" ? { id: form.id } : {}),
      kind: form.kind,
      ref_id: ref,
      season,
      name,
      subtitle: subtitle === "" ? null : subtitle,
      rarity: form.rarity,
      stats: built.stats,
      active: form.active,
    };

    setSaving(true);
    const { error: rpcError } = await supabase.rpc("admin_album_save_card", {
      p_card: payload as unknown as Json,
      p_create: form.mode === "new",
    });
    setSaving(false);

    if (rpcError) {
      console.error("Guardar carta:", rpcError);
      setStatus({ type: "error", text: `No pudimos guardar: ${rpcError.message}` });
      return;
    }

    if (form.mode === "new") {
      setStatus({ type: "ok", text: `Carta creada (${name}). Podés cargar otra.` });
      setForm(newForm(form.kind, form.season));
    } else {
      setStatus({ type: "ok", text: "Cambios guardados." });
      setForm((prev) => ({ ...prev, baseStats: built.stats }));
    }
    await load();
  };

  const toggleActive = async (row: CardRow) => {
    setBusyId(row.id);
    const { error: rpcError } = await supabase.rpc("admin_album_set_card_active", {
      p_id: row.id,
      p_active: !row.active,
    });
    setBusyId(null);

    if (rpcError) {
      console.error("Activar carta:", rpcError);
      setStatus({ type: "error", text: `No pudimos cambiar el estado: ${rpcError.message}` });
      return;
    }

    setRows((prev) => (prev ? prev.map((item) => (item.id === row.id ? { ...item, active: !row.active } : item)) : prev));
    setForm((prev) => (prev.mode === "edit" && prev.id === row.id ? { ...prev, active: !row.active } : prev));
  };

  // ---- Lista ----
  const term = search.trim().toLowerCase();
  const filtered = (rows ?? []).filter((row) => {
    if (kindFilter !== "all" && row.kind !== kindFilter) return false;
    if (term === "") return true;
    return `${row.name} ${row.id} ${row.subtitle ?? ""}`.toLowerCase().includes(term);
  });
  const shown = filtered.slice(0, 120);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Cartas del álbum</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Creá o editá cartas a mano. Las imágenes se suben al proyecto en <code>public/cards</code> con un push. Una
            carta nueva queda inactiva hasta que la actives: recién ahí aparece en los álbumes y en los sobres.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      <datalist id={TEAM_LIST_ID}>
        {Object.keys(TEAM_PRESETS).map((id) => (
          <option key={id} value={id} />
        ))}
      </datalist>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Formulario */}
        <section ref={formRef} className="fade-up space-y-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {form.mode === "edit" ? "Editar carta" : "Carta nueva"}
            </h3>
            {form.mode === "edit" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setForm(newForm(form.kind, form.season));
                  setStatus(null);
                }}
                className="transition-transform active:scale-95"
              >
                Cargar una nueva
              </Button>
            )}
          </div>

          <div className="mx-auto w-full max-w-[10.5rem]">
            <StickerCard card={preview} />
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Vista previa. ID: <span className="font-mono">{cardId}</span>
          </p>

          {syncWarning && (
            <p className="rounded-md bg-secondary p-2 text-xs text-muted-foreground">
              Esta carta también la actualiza el botón "Sincronizar cartas": si lo usás después de editarla a mano, pisa
              estos cambios.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select
                value={form.kind}
                disabled={form.mode === "edit"}
                onChange={(ev) => {
                  const value = EDITABLE_KINDS.find((kind) => kind === ev.target.value);
                  if (value) setForm((prev) => ({ ...prev, kind: value }));
                }}
                className={SELECT_CLASS}
              >
                {EDITABLE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kindLabel(kind)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Temporada">
              <Input
                value={form.season}
                inputMode="numeric"
                onChange={(ev) => setForm((prev) => ({ ...prev, season: ev.target.value }))}
              />
            </Field>

            <Field
              label="Identificador"
              wide
              hint="Minúsculas y guion bajo, sin espacios. Para un piloto es el id de Jolpica (ej. max_verstappen)."
            >
              <Input
                value={form.ref_id}
                onChange={(ev) => setForm((prev) => ({ ...prev, ref_id: ev.target.value.toLowerCase() }))}
              />
            </Field>

            <Field label="Nombre" wide>
              <Input value={form.name} onChange={(ev) => setForm((prev) => ({ ...prev, name: ev.target.value }))} />
            </Field>

            <Field label="Subtítulo" wide>
              <Input
                value={subtitleValue}
                onChange={(ev) => setForm((prev) => ({ ...prev, subtitle: ev.target.value, subtitleTouched: true }))}
              />
              {form.subtitleTouched && form.mode === "new" && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, subtitleTouched: false }))}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Volver al subtítulo automático
                </button>
              )}
            </Field>

            <Field label="Rareza">
              <select
                value={form.rarity}
                onChange={(ev) => {
                  const value = RARITIES.find((rarity) => rarity === ev.target.value);
                  if (value) setForm((prev) => ({ ...prev, rarity: value }));
                }}
                className={SELECT_CLASS}
              >
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarityLabel(rarity)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Estado">
              <label className="flex h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(ev) => setForm((prev) => ({ ...prev, active: ev.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Activa
              </label>
            </Field>

            {KIND_FIELDS[form.kind].map((key) => (
              <Field key={key} label={FIELD_LABELS[key]} hint={FIELD_HINTS[key]} wide={WIDE_FIELDS.includes(key)}>
                <Input
                  value={form.fields[key]}
                  inputMode={NUMERIC_FIELDS.includes(key) ? "decimal" : undefined}
                  list={key === "team_id" ? TEAM_LIST_ID : undefined}
                  onChange={(ev) => setField(key, ev.target.value)}
                />
              </Field>
            ))}
          </div>

          <StatusLine status={status} />

          <Button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="w-full bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            {saving ? "Guardando…" : form.mode === "edit" ? "Guardar cambios" : "Crear carta"}
          </Button>
        </section>

        {/* Lista */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Buscar por nombre o id…"
              className="h-9 max-w-xs"
            />
            <span className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "carta" : "cartas"}
              {filtered.length > shown.length && ` · mostrando ${shown.length}, afiná la búsqueda`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", ...KIND_ORDER] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKindFilter(value)}
                aria-pressed={kindFilter === value}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                  kindFilter === value
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all" ? "Todas" : kindLabel(value)}
              </button>
            ))}
          </div>

          {loading && !rows ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="skeleton h-24" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">No hay cartas con ese filtro.</p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {shown.map((row, index) => (
                <li
                  key={row.id}
                  className={cn("fade-up space-y-2 rounded-xl border bg-card p-3", !row.active && "opacity-70")}
                  style={stagger(Math.min(index, 10))}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {kindLabel(row.kind)} · {row.season} · {rarityLabel(row.rarity)}
                    </p>
                  </div>
                  {!row.active && (
                    <span className="inline-block rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      Inactiva
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(row)}
                      className="transition-transform active:scale-95"
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id}
                      onClick={() => void toggleActive(row)}
                      className="transition-transform active:scale-95"
                    >
                      {row.active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}