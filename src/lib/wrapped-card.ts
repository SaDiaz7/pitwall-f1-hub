import { getInitials } from "@/hooks/useProfile";
import { flagUrl } from "@/lib/countries";
import type { WrappedData } from "@/lib/wrapped";

const W = 1080;
const H = 1350;
const BG_TOP = "#0b0b0d";
const BG_BOTTOM = "#1a0a0c";
const RED = "#e10600";
const MUTED = "#9ca3af";

interface Assets {
  avatar: HTMLImageElement | null;
  flag: HTMLImageElement | null;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Usa las mismas tipografías que la página.
function fontFamilies() {
  const body = getComputedStyle(document.body).fontFamily || "sans-serif";
  const heading = document.querySelector("h1");
  const display = heading ? getComputedStyle(heading).fontFamily || body : body;
  return { body, display };
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

// Achica la letra hasta que el texto entre en el ancho disponible.
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  prefix: string,
  family: string,
) {
  let current = size;
  while (current > 28) {
    ctx.font = `${prefix} ${current}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return;
    current -= 2;
  }
  ctx.font = `${prefix} ${current}px ${family}`;
}

async function draw(data: WrappedData, isFinal: boolean, accent: string, assets: Assets): Promise<Blob> {
  const { body, display } = fontFamilies();
  try {
    await document.fonts.ready;
  } catch {
    // Si las fuentes no se pueden esperar, se dibuja igual.
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  const p = data.predictions;
  const g = data.games;
  const a = data.album;
  const name = data.profile?.display_name || data.profile?.username || "Piloto";

  // Fondo con un resplandor del color de tu escudería favorita
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.8, 120, 0, W * 0.8, 120, 900);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Franja de carrera abajo
  ctx.fillStyle = RED;
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H - 36, W, 8);

  // Encabezado
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = RED;
  ctx.font = `700 40px ${display}`;
  ctx.fillText("PITWALL", W / 2, 110);

  const title = isFinal ? `MI TEMPORADA ${data.season}` : `MI ${data.season} HASTA AHORA`;
  ctx.fillStyle = "#ffffff";
  fitFont(ctx, title, W - 120, 84, "italic 700", display);
  ctx.fillText(title, W / 2, 205);

  // Foto de perfil (o iniciales)
  const cx = W / 2;
  const cy = 340;
  const r = 72;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (assets.avatar) {
    const scale = Math.max((r * 2) / assets.avatar.width, (r * 2) / assets.avatar.height);
    const dw = assets.avatar.width * scale;
    const dh = assets.avatar.height * scale;
    ctx.drawImage(assets.avatar, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = RED;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 64px ${display}`;
    ctx.fillText(getInitials(name), cx, cy + 22);
  }
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Nombre con bandera
  ctx.font = `700 46px ${body}`;
  const textWidth = ctx.measureText(name).width;
  const flagHeight = 34;
  const flagWidth = assets.flag ? flagHeight * (assets.flag.width / assets.flag.height) : 0;
  const flagGap = assets.flag ? 16 : 0;
  const startX = (W - (flagWidth + flagGap + textWidth)) / 2;
  if (assets.flag) ctx.drawImage(assets.flag, startX, 480 - 32, flagWidth, flagHeight);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, startX + flagWidth + flagGap, 480);
  ctx.textAlign = "center";

  // Números clave
  const pct = a.catalog > 0 ? Math.round((a.distinct / a.catalog) * 100) : 0;
  const tiles = [
    { value: String(p.points), label: "PUNTOS" },
    { value: p.rank !== null ? `#${p.rank}` : "—", label: "PUESTO GENERAL" },
    { value: String(g.streak_best), label: "RACHA MÁXIMA" },
    { value: String(g.circuit_solved), label: "CIRCUITOS" },
    { value: String(a.cards), label: "CARTAS" },
    { value: `${pct}%`, label: "ÁLBUM" },
  ];

  const tileW = 300;
  const tileH = 190;
  const gap = 30;
  const gridX = (W - (3 * tileW + 2 * gap)) / 2;

  tiles.forEach((tile, i) => {
    const x = gridX + (i % 3) * (tileW + gap);
    const y = 540 + Math.floor(i / 3) * (tileH + gap);

    roundedRect(ctx, x, y, tileW, tileH, 28);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    fitFont(ctx, tile.value, tileW - 40, 92, "700", display);
    ctx.fillText(tile.value, x + tileW / 2, y + 118);

    ctx.fillStyle = MUTED;
    ctx.font = `400 26px ${body}`;
    ctx.fillText(tile.label, x + tileW / 2, y + 160);
  });

  // Destacados
  const lines: string[] = [];
  if (p.best_race) lines.push(`🏆 Mejor carrera: ${p.best_race.race ?? `Ronda ${p.best_race.round}`} · ${p.best_race.points} pts`);
  if (a.rarest) lines.push(`🃏 Carta más rara: ${a.rarest.name}`);

  ctx.fillStyle = "#ffffff";
  lines.forEach((line, i) => {
    fitFont(ctx, line, W - 120, 36, "400", body);
    ctx.fillText(line, W / 2, 1040 + i * 56);
  });

  // Pie
  ctx.fillStyle = MUTED;
  ctx.font = `400 30px ${body}`;
  ctx.fillText(`Armá tu resumen en ${window.location.host}`, W / 2, 1270);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}

export async function renderWrappedCard(data: WrappedData, isFinal: boolean, accent: string): Promise<Blob> {
  const avatarUrl = data.profile?.avatar_url ?? null;
  const country = data.profile?.country ?? null;

  const [avatar, flag] = await Promise.all([
    avatarUrl ? loadImage(avatarUrl) : Promise.resolve(null),
    country ? loadImage(flagUrl(country, 80)) : Promise.resolve(null),
  ]);

  try {
    return await draw(data, isFinal, accent, { avatar, flag });
  } catch (error) {
    // Si el navegador bloquea las imágenes externas, se genera igual sin foto ni bandera.
    console.error("Imagen de Mi temporada (se reintenta sin fotos):", error);
    return draw(data, isFinal, accent, { avatar: null, flag: null });
  }
}