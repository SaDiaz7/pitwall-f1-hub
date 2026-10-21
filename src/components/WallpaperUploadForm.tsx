import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSeasonOptions, type SeasonOptions } from "@/lib/f1";
import {
  detectQuality,
  qualityLabel,
  readImageSize,
  uploadWallpaper,
  validateImageFile,
} from "@/lib/wallpapers";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, i) => CURRENT_YEAR - i);
const EMPTY_SEASON: SeasonOptions = { drivers: [], teams: [] };
const SELECT_CLASS = "h-11 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50";

type Status = { type: "ok" | "error"; text: string } | null;

export function WallpaperUploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [season, setSeason] = useState<SeasonOptions>(EMPTY_SEASON);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [credit, setCredit] = useState("");

  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);

  // Vista previa de la imagen elegida.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Cada vez que cambia el año, trae los pilotos y equipos de esa temporada.
  useEffect(() => {
    let cancelled = false;
    setSeasonLoading(true);
    setSeasonError(null);
    setDriverId("");
    setTeamId("");

    getSeasonOptions({ data: { year: Number(year) } })
      .then((result) => {
        if (!cancelled) setSeason(result);
      })
      .catch(() => {
        if (!cancelled) {
          setSeason(EMPTY_SEASON);
          setSeasonError("No pudimos cargar los pilotos y equipos de esa temporada.");
        }
      })
      .finally(() => {
        if (!cancelled) setSeasonLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const onFileChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const selected = ev.target.files?.[0] ?? null;
    setStatus(null);
    setSize(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const invalid = validateImageFile(selected);
    if (invalid) {
      setFile(null);
      setStatus({ type: "error", text: invalid });
      setInputKey((k) => k + 1);
      return;
    }

    try {
      setSize(await readImageSize(selected));
      setFile(selected);
    } catch {
      setFile(null);
      setStatus({ type: "error", text: "No pudimos leer la imagen." });
      setInputKey((k) => k + 1);
    }
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);

    if (!file || !size) {
      setStatus({ type: "error", text: "Elegí una imagen." });
      return;
    }

    const driver = season.drivers.find((d) => d.id === driverId) ?? null;
    const team = season.teams.find((t) => t.id === teamId) ?? null;
    if (!driver && !team) {
      setStatus({ type: "error", text: "Elegí al menos un piloto o un equipo." });
      return;
    }

    setSubmitting(true);
    const result = await uploadWallpaper(file, {
      year: Number(year),
      driver,
      team,
      credit,
      width: size.width,
      height: size.height,
    });
    setSubmitting(false);

    if (!result.ok) {
      setStatus({ type: "error", text: result.message });
      return;
    }

    // Limpia el formulario para poder subir otro enseguida (conserva el año).
    setFile(null);
    setSize(null);
    setDriverId("");
    setTeamId("");
    setCredit("");
    setInputKey((k) => k + 1);
    setStatus({ type: "ok", text: "Fondo subido." });
    onUploaded();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mb-6 space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="text-xl font-bold uppercase">Subir fondo</h2>

      <div className="space-y-1.5">
        <Label htmlFor="wallpaper-file">Imagen (JPG, PNG o WebP, hasta 15 MB)</Label>
        <Input
          key={inputKey}
          id="wallpaper-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
        />
      </div>

      {preview && size && (
        <div className="space-y-2">
          <img
            src={preview}
            alt="Vista previa"
            className="max-h-56 rounded-xl border object-contain"
          />
          <p className="text-sm text-muted-foreground">
            {size.width} × {size.height} px · Calidad detectada:{" "}
            <span className="font-semibold text-foreground">
              {qualityLabel(detectQuality(size.width, size.height))}
            </span>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="wallpaper-year">Año</Label>
          <select
            id="wallpaper-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={SELECT_CLASS}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wallpaper-driver">Piloto</Label>
          <select
            id="wallpaper-driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            disabled={seasonLoading}
            className={SELECT_CLASS}
          >
            <option value="">{seasonLoading ? "Cargando…" : "Sin piloto"}</option>
            {season.drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wallpaper-team">Equipo</Label>
          <select
            id="wallpaper-team"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            disabled={seasonLoading}
            className={SELECT_CLASS}
          >
            <option value="">{seasonLoading ? "Cargando…" : "Sin equipo"}</option>
            {season.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {seasonError && <p className="text-sm text-destructive">{seasonError}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="wallpaper-credit">Crédito o fuente (opcional)</Label>
        <Input
          id="wallpaper-credit"
          value={credit}
          maxLength={120}
          placeholder="ej. Foto: nombre del fotógrafo / sitio de origen"
          onChange={(e) => setCredit(e.target.value)}
        />
      </div>

      {status && (
        <p
          className={
            status.type === "ok"
              ? "rounded-md bg-success/15 p-2 text-sm text-success"
              : "rounded-md bg-destructive/15 p-2 text-sm text-destructive"
          }
        >
          {status.text}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="bg-gradient-primary font-semibold">
        {submitting ? "Subiendo…" : "Subir fondo"}
      </Button>
    </form>
  );
}
