import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Camera, ImagePlus, Move, Pencil } from "lucide-react";
import { AvatarLightbox } from "@/components/AvatarLightbox";
import { CountryFlag } from "@/components/CountryFlag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BIO_MAX, getInitials, useProfile } from "@/hooks/useProfile";
import { COUNTRY_OPTIONS, countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Status = { type: "ok" | "error"; text: string } | null;

// Encuadre del header: punto de enfoque (0 a 100 %) y zoom (1 a 3).
type Framing = { x: number; y: number; zoom: number };

const DEFAULT_FRAMING: Framing = { x: 50, y: 50, zoom: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface HeaderProfile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  header_url: string | null;
  header_pos_x?: number | null | undefined;
  header_pos_y?: number | null | undefined;
  header_zoom?: number | null | undefined;
  country: string | null;
}

// La imagen del header con su encuadre. Con zoom, se agranda la capa y se mueve para que el punto de
// enfoque quede fijo; así la cuenta de arrastrar es exacta.
function HeaderImage({
  src,
  framing,
  onNatural,
}: {
  src: string;
  framing: Framing;
  onNatural?: ((size: { w: number; h: number }) => void) | undefined;
}) {
  const imageRef = useRef<HTMLImageElement>(null);

  // Si la imagen ya estaba cargada (por ejemplo, desde el caché), onLoad no se dispara.
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth > 0) {
      onNatural?.({ w: image.naturalWidth, h: image.naturalHeight });
    }
  }, [src, onNatural]);

  return (
    <div
      className="absolute"
      style={{
        width: `${framing.zoom * 100}%`,
        height: `${framing.zoom * 100}%`,
        left: `${-(framing.zoom - 1) * framing.x}%`,
        top: `${-(framing.zoom - 1) * framing.y}%`,
      }}
    >
      <img
        ref={imageRef}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        draggable={false}
        onLoad={(ev) => onNatural?.({ w: ev.currentTarget.naturalWidth, h: ev.currentTarget.naturalHeight })}
        className="h-full w-full select-none object-cover"
        style={{ objectPosition: `${framing.x}% ${framing.y}%` }}
      />
    </div>
  );
}

export function ProfileHeader({
  profile,
  isSelf,
  alwaysEditing = false,
  onSaved,
  actions,
}: {
  profile: HeaderProfile;
  isSelf: boolean;
  alwaysEditing?: boolean | undefined;
  onSaved?: (() => void) | undefined;
  actions?: ReactNode;
}) {
  const { save, uploadAvatar, uploadHeader, removeHeader } = useProfile();

  const [editMode, setEditMode] = useState(false);
  const editing = isSelf && (alwaysEditing || editMode);

  const [username, setUsername] = useState(profile.username ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"avatar" | "header" | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);

  // Acomodar el header
  const [adjusting, setAdjusting] = useState(false);
  const [framing, setFraming] = useState<Framing>(DEFAULT_FRAMING);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);

  const savedFraming: Framing = {
    x: Number(profile.header_pos_x ?? DEFAULT_FRAMING.x),
    y: Number(profile.header_pos_y ?? DEFAULT_FRAMING.y),
    zoom: Number(profile.header_zoom ?? DEFAULT_FRAMING.zoom),
  };
  const view = adjusting ? framing : savedFraming;

  const onNatural = useCallback(
    (size: { w: number; h: number }) =>
      setNatural((previous) => (previous && previous.w === size.w && previous.h === size.h ? previous : size)),
    [],
  );

  // Si se sale del modo edición, se cierra también el encuadre.
  useEffect(() => {
    if (!editing) setAdjusting(false);
  }, [editing]);

  // Cuando llegan los datos guardados, se cargan en los campos.
  useEffect(() => {
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setCountry(profile.country ?? "");
  }, [profile.username, profile.display_name, profile.bio, profile.country]);

  const name = profile.display_name || profile.username || "Sin nombre";

  const onSave = async () => {
    setStatus(null);

    const cleanUsername = username.trim();
    if (cleanUsername && !USERNAME_RE.test(cleanUsername)) {
      setUsernameError("Usá de 3 a 20 caracteres: minúsculas, números o guion bajo.");
      return;
    }
    setUsernameError(null);

    setSaving(true);
    const result = await save({
      username: cleanUsername || null,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      country: country || null,
    });
    setSaving(false);

    if (!result.ok) {
      setStatus({ type: "error", text: result.message });
      return;
    }

    setStatus({ type: "ok", text: "Cambios guardados." });
    if (!alwaysEditing) setEditMode(false);
    onSaved?.();
  };

  const onCancel = () => {
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setCountry(profile.country ?? "");
    setUsernameError(null);
    setStatus(null);
    setEditMode(false);
  };

  const onFile = (kind: "avatar" | "header") => async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setBusy(kind);
    const result = kind === "avatar" ? await uploadAvatar(file) : await uploadHeader(file);
    setBusy(null);

    const input = kind === "avatar" ? avatarInput.current : headerInput.current;
    if (input) input.value = "";

    if (!result.ok) {
      setStatus({ type: "error", text: result.message });
      return;
    }

    if (kind === "header") {
      // Con una imagen nueva se abre directamente el encuadre.
      setFraming(DEFAULT_FRAMING);
      setAdjusting(true);
      setStatus({ type: "ok", text: "Header actualizado. Acomodalo como quieras y guardá el encuadre." });
    } else {
      setStatus({ type: "ok", text: "Avatar actualizado." });
    }
    onSaved?.();
  };

  const onHeaderRemove = async () => {
    setStatus(null);
    setBusy("header");
    const result = await removeHeader();
    setBusy(null);

    if (!result.ok) {
      setStatus({ type: "error", text: result.message });
      return;
    }
    setAdjusting(false);
    setStatus({ type: "ok", text: "Header quitado." });
    onSaved?.();
  };

  // ---- Acomodar el header ----
  const startAdjusting = () => {
    setFraming(savedFraming);
    setAdjusting(true);
    setStatus(null);
  };

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!adjusting) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    dragRef.current = { startX: ev.clientX, startY: ev.clientY, x: framing.x, y: framing.y };
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const box = bannerRef.current;
    if (!drag || !box || !natural) return;

    const rect = box.getBoundingClientRect();
    // Tamaño con el que se ve la imagen (cubriendo el recuadro y con el zoom aplicado).
    const scale = Math.max(rect.width / natural.w, rect.height / natural.h) * framing.zoom;
    const overflowX = rect.width - natural.w * scale; // negativo: lo que sobra de la imagen
    const overflowY = rect.height - natural.h * scale;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;

    setFraming((previous) => ({
      ...previous,
      x: overflowX < -0.5 ? clamp(drag.x + (dx / overflowX) * 100, 0, 100) : previous.x,
      y: overflowY < -0.5 ? clamp(drag.y + (dy / overflowY) * 100, 0, 100) : previous.y,
    }));
  };

  const onPointerEnd = () => {
    dragRef.current = null;
  };

  const onSaveFraming = async () => {
    setStatus(null);
    setSaving(true);
    const result = await save({
      header_pos_x: Math.round(framing.x),
      header_pos_y: Math.round(framing.y),
      header_zoom: Math.round(framing.zoom * 100) / 100,
    });
    setSaving(false);

    if (!result.ok) {
      setStatus({ type: "error", text: result.message });
      return;
    }
    setAdjusting(false);
    setStatus({ type: "ok", text: "Encuadre guardado." });
    onSaved?.();
  };

  const avatar = (
    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
      {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
      <AvatarFallback className="bg-gradient-primary font-display text-2xl text-primary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <header className="mb-6">
      {adjusting && (
        <div className="fade-up mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
          <p className="text-muted-foreground">Arrastrá la imagen para acomodarla.</p>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={framing.zoom}
              onChange={(ev) => setFraming((previous) => ({ ...previous, zoom: Number(ev.target.value) }))}
              className="w-40 accent-[var(--primary)]"
            />
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFraming(DEFAULT_FRAMING)}
              className="transition-transform active:scale-95"
            >
              Restablecer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAdjusting(false)}
              className="transition-transform active:scale-95"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void onSaveFraming()}
              className="bg-gradient-primary font-semibold transition-transform active:scale-95"
            >
              {saving ? "Guardando…" : "Guardar encuadre"}
            </Button>
          </div>
        </div>
      )}

      <div
        ref={bannerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={cn(
          "relative h-32 overflow-hidden rounded-2xl border bg-hero sm:h-44 lg:h-52",
          adjusting && "cursor-grab touch-none ring-2 ring-primary/60 active:cursor-grabbing",
        )}
      >
        {profile.header_url && <HeaderImage src={profile.header_url} framing={view} onNatural={onNatural} />}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 racing-stripe opacity-60" />

        {adjusting && (
          <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/70 px-2 py-1 text-xs font-semibold backdrop-blur">
            Arrastrá para acomodar
          </p>
        )}

        {editing && !adjusting && (
          <div className="fade-up absolute right-3 top-3 flex flex-wrap justify-end gap-2">
            <input
              ref={headerInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFile("header")}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => headerInput.current?.click()}
              className="transition-transform active:scale-95"
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              {busy === "header" ? "Procesando…" : profile.header_url ? "Cambiar header" : "Subir header"}
            </Button>
            {profile.header_url && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={startAdjusting}
                  className="transition-transform active:scale-95"
                >
                  <Move className="mr-1.5 h-4 w-4" /> Acomodar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => void onHeaderRemove()}
                  className="transition-transform active:scale-95"
                >
                  Quitar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 px-2 sm:px-5">
        <div className="relative -mt-10 rounded-full ring-4 ring-background sm:-mt-12">
          {editing ? (
            <>
              {avatar}
              <input
                ref={avatarInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFile("avatar")}
              />
              <button
                type="button"
                aria-label="Cambiar avatar"
                disabled={busy !== null}
                onClick={() => avatarInput.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow transition-transform active:scale-90 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
              </button>
            </>
          ) : (
            <AvatarLightbox src={profile.avatar_url} name={name}>
              {avatar}
            </AvatarLightbox>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-2">
          {editing ? (
            <div className="fade-up max-w-md space-y-2">
              <Input
                value={displayName}
                maxLength={40}
                placeholder="Nombre visible"
                aria-label="Nombre visible"
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <div>
                <Input
                  value={username}
                  maxLength={20}
                  placeholder="usuario (ej. tifosi_44)"
                  aria-label="Nombre de usuario"
                  aria-invalid={!!usernameError}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                />
                {usernameError && <p className="mt-1 text-sm text-destructive">{usernameError}</p>}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={country}
                  aria-label="Nacionalidad"
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {country && <CountryFlag code={country} className="h-6 shrink-0" />}
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold uppercase leading-tight">{name}</h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {profile.username && <span>@{profile.username}</span>}
                {profile.country && (
                  <span className="inline-flex items-center gap-1.5">
                    <CountryFlag code={profile.country} className="h-3.5" />
                    {countryName(profile.country)}
                  </span>
                )}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {isSelf ? (
            editing ? (
              <>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void onSave()}
                  className="bg-gradient-primary font-semibold transition-transform active:scale-95"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
                {!alwaysEditing && (
                  <Button type="button" variant="outline" onClick={onCancel} className="transition-transform active:scale-95">
                    Cancelar
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode(true)}
                className="transition-transform active:scale-95"
              >
                <Pencil className="mr-2 h-4 w-4" /> Editar perfil
              </Button>
            )
          ) : (
            actions
          )}
        </div>
      </div>

      {editing ? (
        <div className="fade-up mt-3 max-w-2xl px-2 sm:px-5">
          <Textarea
            rows={3}
            value={bio}
            maxLength={BIO_MAX}
            aria-label="Biografía"
            placeholder="Contá algo sobre vos: tu equipo, tu piloto, cómo arrancaste con la F1…"
            onChange={(e) => setBio(e.target.value)}
          />
          <p className="text-right text-xs tabular-nums text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </p>
        </div>
      ) : (
        profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line px-2 text-sm sm:px-5">{profile.bio}</p>
      )}

      {status && (
        <p
          className={cn(
            "mx-2 mt-3 rounded-md p-2 text-sm sm:mx-5",
            status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {status.text}
        </p>
      )}
    </header>
  );
}