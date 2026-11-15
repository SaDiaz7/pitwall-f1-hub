import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { RefreshCw } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { RARITY_LABELS, type Rarity } from "@/lib/album";
import { cn } from "@/lib/utils";

type WeightKey = "w_common" | "w_rare" | "w_epic" | "w_legendary" | "w_mythic";

type PackRule = {
  outcome: string;
  cards: number;
  w_common: number;
  w_rare: number;
  w_epic: number;
  w_legendary: number;
  w_mythic: number;
  guaranteed_rare: boolean;
};

type RecycleRule = { from_rarity: string; to_rarity: string; weight: number };

type Settings = { foil_chance: number; streak_bonus_days: number; recycle_cost: number };

type Economy = {
  settings: Settings | null;
  pack_rules: PackRule[];
  recycle_rules: RecycleRule[];
  owned: { rarity: string; total: number; distinct_cards: number; foil: number }[];
  catalog: { rarity: string; count: number }[];
  trades: { status: string; count: number }[];
  packs: { source: string; count: number }[];
  collectors: number;
};

type Status = { type: "ok" | "error"; text: string } | null;

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

const WEIGHTS: { key: WeightKey; rarity: Rarity }[] = [
  { key: "w_common", rarity: "common" },
  { key: "w_rare", rarity: "rare" },
  { key: "w_epic", rarity: "epic" },
  { key: "w_legendary", rarity: "legendary" },
  { key: "w_mythic", rarity: "mythic" },
];

function rarityLabel(rarity: string): string {
  return (RARITY_LABELS as Record<string, string | undefined>)[rarity] ?? rarity;
}

function rarityRank(rarity: string): number {
  const index = RARITY_ORDER.indexOf(rarity as Rarity);
  return index === -1 ? 99 : index;
}

function toNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
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

function PackRuleEditor({ rule, index, onSaved }: { rule: PackRule; index: number; onSaved: () => void }) {
  const [cards, setCards] = useState(String(rule.cards));
  const [weights, setWeights] = useState<Record<WeightKey, string>>({
    w_common: String(rule.w_common),
    w_rare: String(rule.w_rare),
    w_epic: String(rule.w_epic),
    w_legendary: String(rule.w_legendary),
    w_mythic: String(rule.w_mythic),
  });
  const [guaranteed, setGuaranteed] = useState(rule.guaranteed_rare);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const rows = WEIGHTS.map((item) => ({ ...item, value: toNumber(weights[item.key]) }));
  const sum = rows.reduce((acc, row) => acc + (Number.isFinite(row.value) && row.value > 0 ? row.value : 0), 0);

  const onSave = async () => {
    setStatus(null);

    const payload = {
      p_outcome: rule.outcome,
      p_cards: toNumber(cards),
      p_w_common: toNumber(weights.w_common),
      p_w_rare: toNumber(weights.w_rare),
      p_w_epic: toNumber(weights.w_epic),
      p_w_legendary: toNumber(weights.w_legendary),
      p_w_mythic: toNumber(weights.w_mythic),
      p_guaranteed_rare: guaranteed,
    };

    const invalid =
      !Number.isInteger(payload.p_cards) ||
      payload.p_cards < 1 ||
      payload.p_cards > 20 ||
      rows.some((row) => !Number.isFinite(row.value) || row.value < 0) ||
      sum <= 0;

    if (invalid) {
      setStatus({ type: "error", text: "Revisá los valores: cartas de 1 a 20 y probabilidades de 0 o más." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("admin_album_set_pack_rule", payload);
    setSaving(false);

    if (error) {
      console.error("Guardar regla de sobre:", error);
      setStatus({ type: "error", text: "No pudimos guardar. Revisá la consola para ver el detalle." });
      return;
    }

    setStatus({ type: "ok", text: "Guardado." });
    onSaved();
  };

  return (
    <div className="fade-up space-y-3 rounded-xl border bg-card p-4" style={stagger(index)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-sm font-bold">{rule.outcome}</p>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={guaranteed}
            onChange={(ev) => setGuaranteed(ev.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Asegura una Rara o mejor
        </label>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="w-28 text-muted-foreground">Cartas por sobre</span>
        <Input
          value={cards}
          inputMode="numeric"
          onChange={(ev) => setCards(ev.target.value)}
          className="h-8 w-20"
        />
      </div>

      <ul className="space-y-2">
        {rows.map((row) => {
          const share = sum > 0 && Number.isFinite(row.value) && row.value > 0 ? (row.value / sum) * 100 : 0;
          return (
            <li key={row.key}>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-28 text-muted-foreground">{rarityLabel(row.rarity)}</span>
                <Input
                  value={weights[row.key]}
                  inputMode="decimal"
                  onChange={(ev) => setWeights((prev) => ({ ...prev, [row.key]: ev.target.value }))}
                  className="h-8 w-20"
                />
                <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
                  {share.toFixed(1)}%
                </span>
              </div>
              <AnimatedBar percent={share} className="mt-1" />
            </li>
          );
        })}
      </ul>

      <StatusLine status={status} />

      <Button
        type="button"
        size="sm"
        disabled={saving}
        onClick={() => void onSave()}
        className="bg-gradient-primary font-semibold transition-transform active:scale-95"
      >
        {saving ? "Guardando…" : "Guardar regla"}
      </Button>
    </div>
  );
}

function SettingsEditor({ settings, onSaved }: { settings: Settings; onSaved: () => void }) {
  const [foilPct, setFoilPct] = useState(String(Math.round(settings.foil_chance * 10000) / 100));
  const [streak, setStreak] = useState(String(settings.streak_bonus_days));
  const [recycle, setRecycle] = useState(String(settings.recycle_cost));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const onSave = async () => {
    setStatus(null);

    const pct = toNumber(foilPct);
    const streakDays = toNumber(streak);
    const recycleCost = toNumber(recycle);

    const invalid =
      !Number.isFinite(pct) ||
      pct < 0 ||
      pct > 100 ||
      !Number.isInteger(streakDays) ||
      streakDays < 1 ||
      streakDays > 60 ||
      !Number.isInteger(recycleCost) ||
      recycleCost < 2 ||
      recycleCost > 50;

    if (invalid) {
      setStatus({
        type: "error",
        text: "Revisá los valores: foil de 0 a 100 %, racha de 1 a 60 días y reciclaje de 2 a 50 cartas.",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("admin_album_set_settings", {
      p_foil_chance: Number((pct / 100).toFixed(4)),
      p_streak_bonus_days: streakDays,
      p_recycle_cost: recycleCost,
    });
    setSaving(false);

    if (error) {
      console.error("Guardar ajustes del álbum:", error);
      setStatus({ type: "error", text: "No pudimos guardar. Revisá la consola para ver el detalle." });
      return;
    }

    setStatus({ type: "ok", text: "Guardado." });
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-44 text-muted-foreground">Probabilidad de foil (%)</span>
        <Input value={foilPct} inputMode="decimal" onChange={(ev) => setFoilPct(ev.target.value)} className="h-8 w-20" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-44 text-muted-foreground">Días de racha para bonus</span>
        <Input value={streak} inputMode="numeric" onChange={(ev) => setStreak(ev.target.value)} className="h-8 w-20" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-44 text-muted-foreground">Cartas para reciclar</span>
        <Input value={recycle} inputMode="numeric" onChange={(ev) => setRecycle(ev.target.value)} className="h-8 w-20" />
      </div>

      <StatusLine status={status} />

      <Button
        type="button"
        size="sm"
        disabled={saving}
        onClick={() => void onSave()}
        className="bg-gradient-primary font-semibold transition-transform active:scale-95"
      >
        {saving ? "Guardando…" : "Guardar ajustes"}
      </Button>
    </div>
  );
}

function RecycleRow({ rule, groupSum, onSaved }: { rule: RecycleRule; groupSum: number; onSaved: () => void }) {
  const [weight, setWeight] = useState(String(rule.weight));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const share = groupSum > 0 ? (rule.weight / groupSum) * 100 : 0;

  const onSave = async () => {
    setStatus(null);
    const value = toNumber(weight);
    if (!Number.isFinite(value) || value < 0) {
      setStatus({ type: "error", text: "El peso tiene que ser 0 o más." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("admin_album_set_recycle_weight", {
      p_from: rule.from_rarity,
      p_to: rule.to_rarity,
      p_weight: value,
    });
    setSaving(false);

    if (error) {
      console.error("Guardar peso de reciclaje:", error);
      setStatus({ type: "error", text: "No pudimos guardar. Revisá la consola." });
      return;
    }

    setStatus({ type: "ok", text: "Guardado." });
    onSaved();
  };

  return (
    <li className="space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="w-24 text-muted-foreground">→ {rarityLabel(rule.to_rarity)}</span>
        <Input value={weight} inputMode="decimal" onChange={(ev) => setWeight(ev.target.value)} className="h-8 w-20" />
        <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">{share.toFixed(1)}%</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => void onSave()}
          className="transition-transform active:scale-95"
        >
          {saving ? "…" : "Guardar"}
        </Button>
      </div>
      <AnimatedBar percent={share} />
      <StatusLine status={status} />
    </li>
  );
}

export function AdminAlbumEconomy() {
  const [economy, setEconomy] = useState<Economy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("admin_album_economy");
    if (rpcError) {
      console.error("Economía del álbum:", rpcError);
      setError("No pudimos cargar los datos. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setEconomy(data as unknown as Economy);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  const ownedBy = new Map((economy?.owned ?? []).map((item) => [item.rarity, item]));
  const catalogBy = new Map((economy?.catalog ?? []).map((item) => [item.rarity, item.count]));
  const rarities = Array.from(
    new Set<string>([
      ...RARITY_ORDER,
      ...(economy?.owned ?? []).map((item) => item.rarity),
      ...(economy?.catalog ?? []).map((item) => item.rarity),
    ]),
  ).sort((a, b) => rarityRank(a) - rarityRank(b));

  const totalCards = (economy?.owned ?? []).reduce((acc, item) => acc + item.total, 0);
  const totalPacks = (economy?.packs ?? []).reduce((acc, item) => acc + item.count, 0);
  const totalTrades = (economy?.trades ?? []).reduce((acc, item) => acc + item.count, 0);

  const recycleGroups = (economy?.recycle_rules ?? []).reduce<Record<string, RecycleRule[]>>((acc, rule) => {
    (acc[rule.from_rarity] ??= []).push(rule);
    return acc;
  }, {});

  const summary = [
    { label: "Coleccionistas", value: economy?.collectors ?? 0 },
    { label: "Cartas en circulación", value: totalCards },
    { label: "Sobres abiertos", value: totalPacks },
    { label: "Intercambios", value: totalTrades },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Economía del álbum</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cartas por rareza, intercambios y las reglas de sobres. Los cambios valen desde el próximo sobre que se abra.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={reload}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading && !economy && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      )}

      {economy && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {summary.map((item, index) => (
              <div key={item.label} className="fade-up rounded-xl border bg-card p-4" style={stagger(index)}>
                <p className="font-display text-3xl font-bold leading-none tabular-nums">{item.value}</p>
                <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(4)}>
              <h3 className="text-sm font-bold uppercase tracking-wider">Cartas por rareza</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                La barra muestra cuántas cartas distintas de esa rareza ya tiene alguien, sobre el total del catálogo.
              </p>
              <ul className="mt-3 space-y-3">
                {rarities.map((rarity, index) => {
                  const owned = ownedBy.get(rarity);
                  const catalogCount = catalogBy.get(rarity) ?? 0;
                  const distinct = owned?.distinct_cards ?? 0;
                  const percent = catalogCount > 0 ? Math.min(100, (distinct / catalogCount) * 100) : 0;
                  return (
                    <li key={rarity} className="fade-up" style={stagger(index)}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold">{rarityLabel(rarity)}</span>
                        <span className="text-xs text-muted-foreground">
                          {owned?.total ?? 0} en circulación · {distinct}/{catalogCount} distintas · {owned?.foil ?? 0} foil
                        </span>
                      </div>
                      <AnimatedBar percent={percent} className="mt-1 h-2" />
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="fade-up space-y-4 rounded-2xl border bg-card p-4" style={stagger(5)}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Sobres abiertos</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {economy.packs.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay sobres.</p>}
                  {economy.packs.map((item) => (
                    <span key={item.source} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      {item.source}: {item.count}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Intercambios por estado</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {economy.trades.length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no hay intercambios.</p>
                  )}
                  {economy.trades.map((item) => (
                    <span key={item.status} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      {item.status}: {item.count}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">Reglas de sobres</h3>
            <p className="text-xs text-muted-foreground">
              Los números son pesos relativos: el porcentaje de al lado se calcula sobre la suma, así que no hace falta
              que den 100.
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
              {economy.pack_rules.map((rule, index) => (
                <PackRuleEditor key={rule.outcome} rule={rule} index={index} onSaved={reload} />
              ))}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {economy.settings && (
              <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(6)}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Ajustes generales</h3>
                <SettingsEditor settings={economy.settings} onSaved={reload} />
              </section>
            )}

            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(7)}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Reciclaje</h3>
              {Object.keys(recycleGroups).length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay reglas de reciclaje cargadas.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(recycleGroups)
                    .sort(([a], [b]) => rarityRank(a) - rarityRank(b))
                    .map(([from, rules]) => {
                      const groupSum = rules.reduce((acc, rule) => acc + rule.weight, 0);
                      return (
                        <div key={from} className="space-y-2">
                          <p className="text-sm font-semibold">Reciclando {rarityLabel(from)}</p>
                          <ul className="space-y-2">
                            {rules.map((rule) => (
                              <RecycleRow
                                key={`${rule.from_rarity}:${rule.to_rarity}`}
                                rule={rule}
                                groupSum={groupSum}
                                onSaved={reload}
                              />
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}