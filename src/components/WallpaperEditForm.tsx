import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSeasonOptions, type SeasonOptions } from "@/lib/f1";
import { updateWallpaper, type Wallpaper } from "@/lib/wallpapers";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);
const EMPTY_SEASON: SeasonOptions = { drivers: [], teams: [] };
const SELECT_CLASS = "h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50";

export function WallpaperEditForm({
  wallpaper,
  onSaved,
  onCancel,
}: {
  wallpaper: Wallpaper;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [year, setYear] = useState(String(wallpaper.year));
  const [season, setSeason] = useState<SeasonOptions>(EMPTY_SEASON);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [driverId, setDriverId] = useState(wallpaper.driver_id ?? "");
  const [teamId, setTeamId] = useState(wallpaper.team_id ?? "");
  const [credit, setCredit] = useState(wallpaper.credit ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentDriver = wallpaper.driver_id
    ? { id: wallpaper.driver_id, name: wallpaper.driver_name ?? wallpaper.driver_id }
    : null;
  const currentTeam = wallpaper.team_id
    ? { id: wallpaper.team_id, name: wallpaper.team_name ?? wallpaper.team_id }
    : null;

  // Trae los pilotos y equipos del año elegido.
  useEffect(() => {
    let cancelled = false;
    setSeasonLoading(true);

    getSeasonOptions({ data: { year: Number(year) } })
      .then((result) => {
        if (!cancelled) setSeason(result);
      })
      .catch(() => {
        if (!cancelled) setSeason(EMPTY_SEASON);
      })
      .finally(() => {
        if (!cancelled) setSeasonLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const missingDriver =
    currentDriver !== null && driverId === currentDriver.id && !season.drivers.some((d) => d.id === currentDriver.id);
  const missingTeam =
    currentTeam !== null && teamId === currentTeam.id && !season.teams.some((t) => t.id === currentTeam.id);

  const onYearChange = (value: string) => {
    setYear(value);
    // Los pilotos y equipos cambian según el año: hay que volver a elegirlos.
    setDriverId("");
    setTeamId("");
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);

    const driver =
      season.drivers.find((d) => d.id === driverId) ?? (currentDriver?.id === driverId ? currentDriver : null);
    const team = season.teams.find((t) => t.id === teamId) ?? (currentTeam?.id === teamId ? currentTeam : null);

    if (!driver && !team) {
      setError("Elegí al menos un piloto o un equipo.");
      return;
    }

    setSaving(true);
    const result = await updateWallpaper(wallpaper.id, { year: Number(year), driver, team, credit });
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="fade-up space-y-4 rounded-xl border bg-background/40 p-4">
      <h3 className="font-display text-lg font-bold uppercase">Editar fondo</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-year">Año</Label>
          <select id="edit-year" value={year} onChange={(e) => onYearChange(e.target.value)} className={SELECT_CLASS}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-driver">Piloto</Label>
          <select
            id="edit-driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            disabled={seasonLoading}
            className={SELECT_CLASS}
          >
            <option value="">{seasonLoading ? "Cargando…" : "Sin piloto"}</option>
            {missingDriver && currentDriver && <option value={currentDriver.id}>{currentDriver.name} (actual)</option>}
            {season.drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-team">Equipo</Label>
          <select
            id="edit-team"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            disabled={seasonLoading}
            className={SELECT_CLASS}
          >
            <option value="">{seasonLoading ? "Cargando…" : "Sin equipo"}</option>
            {missingTeam && currentTeam && <option value={currentTeam.id}>{currentTeam.name} (actual)</option>}
            {season.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-credit">Crédito o fuente (opcional)</Label>
        <Input
          id="edit-credit"
          value={credit}
          maxLength={120}
          placeholder="ej. Foto: nombre del fotógrafo / sitio de origen"
          onChange={(e) => setCredit(e.target.value)}
        />
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} className="bg-gradient-primary font-semibold transition-transform active:scale-95">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel} className="transition-transform active:scale-95">
          Cancelar
        </Button>
      </div>
    </form>
  );
}