import { useState } from "react";
import { Car, MapPin, User } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { getInitials } from "@/hooks/useProfile";
import {
  KIND_LABELS,
  RARITY_LABELS,
  cardImageUrl,
  statNum,
  statStr,
  type CardFace,
  type CardKind,
  type Rarity,
} from "@/lib/album";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/circuits";
import type { DriverPhoto } from "@/lib/f1";
import { getTeamColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

const RATIO = "5 / 7";

const FRAME: Record<Rarity, { from: string; to: string; label: string; glow: string }> = {
  common: { from: "#a1a1aa", to: "#52525b", label: "#d4d4d8", glow: "rgba(0,0,0,0)" },
  rare: { from: "#7dd3fc", to: "#0369a1", label: "#bae6fd", glow: "rgba(56,189,248,0.35)" },
  epic: { from: "#e9d5ff", to: "#7e22ce", label: "#e9d5ff", glow: "rgba(192,132,252,0.4)" },
  legendary: { from: "#fef3c7", to: "#b45309", label: "#fde68a", glow: "rgba(251,191,36,0.5)" },
  mythic: { from: "#67e8f9", to: "#c026d3", label: "#f5d0fe", glow: "rgba(217,70,239,0.55)" },
};

// Los tamaños se miden en "cqw" (porcentaje del ancho de la carta), así escala sola.
const box = { containerType: "inline-size", aspectRatio: RATIO } as const;

function CarSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full" aria-hidden="true">
      <path d="M12 8h26v6h-9v24h-8V14h-9z" fill={color} />
      <path d="M22 40l8-14 32-3 22-8 22 1 20 9 44 7 18 6v4H22z" fill={color} />
      <path d="M86 15l16-1 8 8H80z" fill="rgba(0,0,0,0.35)" />
      <circle cx="96" cy="14" r="5" fill="#f4f4f5" />
      <path d="M176 38h22v6h-26z" fill={color} />
      <circle cx="50" cy="42" r="13" fill="#111113" />
      <circle cx="50" cy="42" r="6" fill="#52525b" />
      <circle cx="150" cy="42" r="11" fill="#111113" />
      <circle cx="150" cy="42" r="5" fill="#52525b" />
    </svg>
  );
}

export function statStrip(card: CardFace): { label: string; value: string }[] {
  if (card.kind === "circuit") {
    const length = statNum(card.stats, "length_m");
    const altitude = statNum(card.stats, "altitude_m");
    const opened = statNum(card.stats, "opened");
    return [
      {
        label: "Largo",
        value:
          length === null
            ? "—"
            : `${(length / 1000).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`,
      },
      { label: "Altitud", value: altitude === null ? "—" : `${altitude} m` },
      { label: "Desde", value: opened === null ? "—" : String(opened) },
    ];
  }

  const points = statNum(card.stats, "points");
  const wins = statNum(card.stats, "wins");
  const position = statNum(card.stats, "position");
  return [
    { label: "Pts", value: points === null ? "—" : String(points) },
    { label: "Vict.", value: wins === null ? "—" : String(wins) },
    { label: "Pos.", value: position === null ? "—" : `P${position}` },
  ];
}

export function StickerCard({
  card,
  foil = false,
  quantity,
  className,
}: {
  card: CardFace;
  foil?: boolean;
  /** Ya no se usa: la imagen sale de /public/cards (ver cardImageUrl). Se deja para no romper los lugares que todavía la pasan. */
  photo?: DriverPhoto | null | undefined;
  quantity?: number | undefined;
  className?: string | undefined;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = cardImageUrl(card);

  const [photoFailed, setPhotoFailed] = useState(false);

  const frame = FRAME[card.rarity];
  const teamId = statStr(card.stats, "team_id") ?? "";
  const teamName = statStr(card.stats, "team_name") ?? undefined;
  const accent = card.kind === "circuit" ? "#e10600" : getTeamColor(teamId, teamName);
  const number = statNum(card.stats, "number");
  const path = statStr(card.stats, "path");
  const countryCode = statStr(card.stats, "country_code");

  return (
    <div className={cn("relative w-full select-none", className)} style={box}>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          foil && "card-foil",
          card.rarity === "legendary" && "card-legendary",
          card.rarity === "mythic" && "card-mythic",
        )}
        style={{
          borderRadius: "7cqw",
          padding: "2.6cqw",
          backgroundImage: `linear-gradient(145deg, ${frame.from}, ${frame.to})`,
          boxShadow: `0 6px 18px -6px ${frame.glow}`,
        }}
      >
        <div className="relative flex h-full flex-col overflow-hidden bg-[#0b0b0d]" style={{ borderRadius: "5cqw" }}>
          {/* Tipo y rareza */}
          <div className="flex items-center justify-between" style={{ padding: "3cqw 4cqw 2cqw" }}>
            <span className="font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "3.6cqw" }}>
              {KIND_LABELS[card.kind]}
            </span>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: "3.6cqw", color: frame.label }}>
              {RARITY_LABELS[card.rarity]}
              {foil && " ✨"}
            </span>
          </div>

          {/* Ilustración */}
          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{
              margin: "0 3cqw",
              borderRadius: "3.5cqw",
              backgroundImage: `linear-gradient(165deg, color-mix(in oklab, ${accent} 70%, #000) 0%, #0b0b0d 92%)`,
            }}
          >
            {card.kind === "driver" && (
              <>
                {number !== null && (
                  <span
                    aria-hidden="true"
                    className="absolute font-display font-bold leading-none opacity-20"
                    style={{ right: "-3cqw", top: "1cqw", fontSize: "56cqw" }}
                  >
                    {number}
                  </span>
                )}
                {imageUrl && !imageFailed ? (
                  <img
                    src={imageUrl}
                    alt=""
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                    className="absolute inset-0 h-full w-full object-contain object-bottom"
                    style={{ filter: "drop-shadow(0 1.5cqw 2.5cqw rgba(0,0,0,0.55))" }}
                  />
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-display font-bold opacity-70"
                    style={{ fontSize: "30cqw" }}
                  >
                    {getInitials(card.name)}
                  </span>
                )}
                {number !== null && (
                  <span
                    className="absolute font-display font-bold leading-none text-white"
                    style={{
                      left: "3cqw",
                      bottom: "3cqw",
                      padding: "1cqw 2.5cqw",
                      borderRadius: "1.5cqw",
                      fontSize: "7.5cqw",
                      backgroundColor: accent,
                    }}
                  >
                    {number}
                  </span>
                )}
              </>
            )}

            {card.kind === "team" && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ padding: "6cqw" }}>
                <span
                  aria-hidden="true"
                  className="absolute font-display font-bold leading-none opacity-15"
                  style={{ fontSize: "46cqw" }}
                >
                  {getInitials(card.name)}
                </span>
                <div className="relative w-full" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}>
                  <CarSilhouette color={accent} />
                </div>
              </div>
            )}

            {card.kind === "circuit" && (
              <>
                {path ? (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ padding: "7cqw" }}>
                    <svg
                      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                      className="h-full w-full"
                      style={{ filter: "drop-shadow(0 0 5px rgba(225,6,0,0.75))" }}
                      aria-hidden="true"
                    >
                      <path
                        d={path}
                        fill="none"
                        stroke="#e10600"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                ) : (
                  <MapPin className="absolute inset-0 m-auto opacity-30" style={{ width: "30cqw", height: "30cqw" }} />
                )}
                {countryCode && (
                  <span className="absolute" style={{ right: "3cqw", top: "3cqw" }}>
                    <CountryFlag code={countryCode} className="h-[5.5cqw]" />
                  </span>
                )}
              </>
            )}

            {quantity !== undefined && quantity > 1 && (
              <span
                className="absolute rounded-full bg-primary font-bold text-primary-foreground"
                style={{ left: "3cqw", top: "3cqw", padding: "0.8cqw 2.6cqw", fontSize: "4.4cqw" }}
              >
                ×{quantity}
              </span>
            )}
          </div>

          {/* Nombre */}
          <div style={{ padding: "2.5cqw 4cqw 0" }}>
            <p className="truncate font-display font-bold uppercase leading-none" style={{ fontSize: "9cqw" }}>
              {card.name}
            </p>
            <p className="truncate text-muted-foreground" style={{ fontSize: "4cqw", marginTop: "1cqw" }}>
              {card.subtitle ?? "\u00a0"}
            </p>
          </div>

          {/* Datos */}
          <div className="mt-[2cqw] grid grid-cols-3 border-t border-white/10" style={{ padding: "2cqw 0 2.5cqw" }}>
            {statStrip(card).map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-display font-bold leading-none tabular-nums" style={{ fontSize: "6cqw" }}>
                  {item.value}
                </p>
                <p className="uppercase tracking-wider text-muted-foreground" style={{ fontSize: "3cqw", marginTop: "0.8cqw" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dorso de la carta (también sirve como el sobre cerrado).
export function CardBack({ className }: { className?: string | undefined }) {
  return (
    <div className={cn("relative w-full select-none", className)} style={box}>
      <div
        className="absolute inset-0 overflow-hidden bg-gradient-primary"
        style={{ borderRadius: "7cqw", padding: "2.6cqw" }}
      >
        <div
          className="relative flex h-full items-center justify-center overflow-hidden bg-[#140607]"
          style={{ borderRadius: "5cqw" }}
        >
          <div aria-hidden="true" className="racing-stripe absolute inset-0 opacity-20" />
          <span className="relative font-display font-bold italic text-primary" style={{ fontSize: "15cqw" }}>
            PIT<span className="text-white">WALL</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Lugar vacío del álbum para una carta que todavía no tenés.
export function EmptySlot({ number, kind, rarity }: { number: number; kind: CardKind; rarity: Rarity }) {
  const Icon = kind === "driver" ? User : kind === "team" ? Car : MapPin;

  return (
    <div className="relative w-full select-none" style={box}>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed bg-card/30"
        style={{ borderRadius: "7cqw", borderColor: `${FRAME[rarity].from}55` }}
      >
        <Icon className="opacity-30" style={{ width: "22cqw", height: "22cqw" }} aria-hidden="true" />
        <span className="font-display font-bold text-muted-foreground/60" style={{ fontSize: "11cqw" }}>
          #{String(number).padStart(2, "0")}
        </span>
        <span className="uppercase tracking-wider text-muted-foreground/50" style={{ fontSize: "3.6cqw" }}>
          {KIND_LABELS[kind]}
        </span>
      </div>
    </div>
  );
}