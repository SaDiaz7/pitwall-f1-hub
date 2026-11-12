import { getInitials } from "@/hooks/useProfile";
import { KIND_LABELS, RARITY_LABELS, statNum, statStr, type CardFace, type Rarity } from "@/lib/album";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/circuits";
import { flagUrl } from "@/lib/countries";
import { getTeamColor } from "@/lib/team-colors";
import { statStrip } from "@/components/StickerCard";

const W = 1080;
const H = 1350;
const BG_TOP = "#0b0b0d";
const BG_BOTTOM = "#1a0a0c";
const RED = "#e10600";
const MUTED = "#9ca3af";

// [claro, oscuro, color del texto de rareza]
const FRAME: Record<Rarity, [string, string, string]> = {
  common: ["#a1a1aa", "#52525b", "#d4d4d8"],
  rare: ["#7dd3fc", "#0369a1", "#bae6fd"],
  epic: ["#e9d5ff", "#7e22ce", "#e9d5ff"],
  legendary: ["#fef3c7", "#b45309", "#fde68a"],
};

interface Assets {
  photo: HTMLImageElement | null;
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

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, family: string) {
  let current = size;
  while (current > 8) {
    ctx.font = `700 ${current}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return;
    current -= 1;
  }
}

function drawCar(ctx: CanvasRenderingContext2D, color: string) {
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = color;
  ctx.fill(new Path2D("M12 8h26v6h-9v24h-8V14h-9z"));
  ctx.fill(new Path2D("M22 40l8-14 32-3 22-8 22 1 20 9 44 7 18 6v4H22z"));
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill(new Path2D("M86 15l16-1 8 8H80z"));
  ctx.fillStyle = "#f4f4f5";
  ctx.beginPath();
  ctx.arc(96, 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fill(new Path2D("M176 38h22v6h-26z"));
  for (const [cx, r] of [
    [50, 13],
    [150, 11],
  ] as const) {
    ctx.fillStyle = "#111113";
    ctx.beginPath();
    ctx.arc(cx, 42, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#52525b";
    ctx.beginPath();
    ctx.arc(cx, 42, r / 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Dibuja una carta con el mismo diseño que StickerCard. Todas las medidas salen del ancho (u = 1% del ancho).
function drawCard(
  ctx: CanvasRenderingContext2D,
  card: CardFace,
  foil: boolean,
  assets: Assets,
  x: number,
  y: number,
  w: number,
  fonts: { body: string; display: string },
) {
  const u = w / 100;
  const h = (w * 7) / 5;
  const [from, to, labelColor] = FRAME[card.rarity];
  const teamId = statStr(card.stats, "team_id") ?? "";
  const teamName = statStr(card.stats, "team_name") ?? undefined;
  const accent = card.kind === "circuit" ? RED : getTeamColor(teamId, teamName);

  // Marco
  const frame = ctx.createLinearGradient(x, y, x + w, y + h);
  frame.addColorStop(0, from);
  frame.addColorStop(1, to);
  ctx.save();
  ctx.shadowColor = card.rarity === "legendary" ? "rgba(251,191,36,0.55)" : "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 5 * u;
  roundedRect(ctx, x, y, w, h, 7 * u);
  ctx.fillStyle = frame;
  ctx.fill();
  ctx.restore();

  // Interior
  const ix = x + 2.6 * u;
  const iy = y + 2.6 * u;
  const iw = w - 5.2 * u;
  const ih = h - 5.2 * u;
  roundedRect(ctx, ix, iy, iw, ih, 5 * u);
  ctx.fillStyle = "#0b0b0d";
  ctx.fill();

  // Tipo y rareza
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${3.6 * u}px ${fonts.body}`;
  ctx.textAlign = "left";
  ctx.fillStyle = MUTED;
  ctx.fillText(KIND_LABELS[card.kind].toUpperCase(), ix + 4 * u, iy + 6.4 * u);
  ctx.textAlign = "right";
  ctx.fillStyle = labelColor;
  ctx.fillText(`${RARITY_LABELS[card.rarity].toUpperCase()}${foil ? " ✨" : ""}`, ix + iw - 4 * u, iy + 6.4 * u);

  // Ilustración
  const ax = ix + 3 * u;
  const ay = iy + 10 * u;
  const aw = iw - 6 * u;
  const ah = ih - 43 * u;

  ctx.save();
  roundedRect(ctx, ax, ay, aw, ah, 3.5 * u);
  ctx.clip();
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(ax, ay, aw, ah);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = accent;
  ctx.fillRect(ax, ay, aw, ah);
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(ax, ay, ax + aw * 0.4, ay + ah);
  shade.addColorStop(0, "rgba(11,11,13,0)");
  shade.addColorStop(1, "rgba(11,11,13,0.92)");
  ctx.fillStyle = shade;
  ctx.fillRect(ax, ay, aw, ah);

  if (card.kind === "driver") {
    const number = statNum(card.stats, "number");
    if (number !== null) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "right";
      ctx.font = `700 ${56 * u}px ${fonts.display}`;
      ctx.fillText(String(number), ax + aw + 3 * u, ay + 50 * u);
      ctx.globalAlpha = 1;
    }

    if (assets.photo) {
      // La imagen recortada se apoya abajo, como en la carta.
      const scale = Math.min(aw / assets.photo.width, ah / assets.photo.height);
      const dw = assets.photo.width * scale;
      const dh = assets.photo.height * scale;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 2.5 * u;
      ctx.shadowOffsetY = 1.5 * u;
      ctx.drawImage(assets.photo, ax + (aw - dw) / 2, ay + ah - dh, dw, dh);
      ctx.restore();
    } else {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = `700 ${30 * u}px ${fonts.display}`;
      ctx.fillText(getInitials(card.name), ax + aw / 2, ay + ah / 2 + 10 * u);
      ctx.globalAlpha = 1;
    }

    if (number !== null) {
      ctx.font = `700 ${7.5 * u}px ${fonts.display}`;
      const tagW = ctx.measureText(String(number)).width + 5 * u;
      const tagH = 9.5 * u;
      const tagX = ax + 3 * u;
      const tagY = ay + ah - 3 * u - tagH;
      roundedRect(ctx, tagX, tagY, tagW, tagH, 1.5 * u);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(String(number), tagX + 2.5 * u, tagY + 7.6 * u);
    }
  }

  if (card.kind === "team") {
    const scale = (aw - 12 * u) / 200;
    ctx.save();
    ctx.translate(ax + 6 * u, ay + ah / 2 - 30 * scale);
    ctx.scale(scale, scale);
    drawCar(ctx, accent);
    ctx.restore();
  }

  if (card.kind === "circuit") {
    const path = statStr(card.stats, "path");
    if (path) {
      const pad = 7 * u;
      const scale = Math.min((aw - pad * 2) / MAP_WIDTH, (ah - pad * 2) / MAP_HEIGHT);
      ctx.save();
      ctx.translate(ax + (aw - MAP_WIDTH * scale) / 2, ay + (ah - MAP_HEIGHT * scale) / 2);
      ctx.scale(scale, scale);
      ctx.lineWidth = (1.4 * u) / scale;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = RED;
      ctx.shadowColor = "rgba(225,6,0,0.75)";
      ctx.shadowBlur = 4 * u;
      ctx.stroke(new Path2D(path));
      ctx.restore();
    }
    if (assets.flag) {
      const fh = 6 * u;
      const fw = fh * (assets.flag.width / assets.flag.height);
      ctx.drawImage(assets.flag, ax + aw - 3 * u - fw, ay + 3 * u, fw, fh);
    }
  }
  ctx.restore(); // fin del recorte de la ilustración

  // Nombre y subtítulo
  const nameTop = ay + ah + 2.5 * u;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  fitFont(ctx, card.name.toUpperCase(), iw - 8 * u, 9 * u, fonts.display);
  ctx.fillText(card.name.toUpperCase(), ix + iw / 2, nameTop + 8 * u);
  ctx.fillStyle = MUTED;
  ctx.font = `400 ${4 * u}px ${fonts.body}`;
  ctx.fillText(card.subtitle ?? "", ix + iw / 2, nameTop + 14 * u);

  // Datos al pie
  const stripTop = nameTop + 17.5 * u;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(ix, stripTop, iw, Math.max(1, 0.3 * u));
  statStrip(card).forEach((item, index) => {
    const cx = ix + (iw / 3) * (index + 0.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${6 * u}px ${fonts.display}`;
    ctx.fillText(item.value, cx, stripTop + 8.2 * u);
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${3 * u}px ${fonts.body}`;
    ctx.fillText(item.label.toUpperCase(), cx, stripTop + 11.6 * u);
  });

  // Brillo foil
  if (foil) {
    ctx.save();
    roundedRect(ctx, x, y, w, h, 7 * u);
    ctx.clip();
    const sheen = ctx.createLinearGradient(x, y + h, x + w, y);
    sheen.addColorStop(0.25, "rgba(255,255,255,0)");
    sheen.addColorStop(0.4, "rgba(255,255,255,0.35)");
    sheen.addColorStop(0.48, "rgba(125,211,252,0.28)");
    sheen.addColorStop(0.56, "rgba(244,114,182,0.26)");
    sheen.addColorStop(0.64, "rgba(253,224,71,0.28)");
    sheen.addColorStop(0.78, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

async function draw(card: CardFace, foil: boolean, assets: Assets): Promise<Blob> {
  const fonts = fontFamilies();
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

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Franja de carrera abajo
  ctx.fillStyle = RED;
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H - 36, W, 8);

  // Encabezado
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = RED;
  ctx.font = `700 40px ${fonts.display}`;
  ctx.fillText("PITWALL", W / 2, 110);
  ctx.fillStyle = "#ffffff";
  ctx.font = `italic 700 78px ${fonts.display}`;
  ctx.fillText("ME SALIÓ UNA CARTA", W / 2, 205);

  // La carta
  const cardW = 620;
  drawCard(ctx, card, foil, assets, (W - cardW) / 2, 262, cardW, fonts);

  // Pie
  ctx.fillStyle = MUTED;
  ctx.font = `400 34px ${fonts.body}`;
  ctx.fillText(`${RARITY_LABELS[card.rarity]} · ${KIND_LABELS[card.kind]}${foil ? " · Foil ✨" : ""}`, W / 2, 1225);
  ctx.font = `400 30px ${fonts.body}`;
  ctx.fillText(window.location.host, W / 2, 1285);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}

export async function renderCardImage(card: CardFace, foil: boolean, photoUrl: string | null): Promise<Blob> {
  const countryCode = statStr(card.stats, "country_code");
  const [photo, flag] = await Promise.all([
    card.kind === "driver" && photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
    card.kind === "circuit" && countryCode ? loadImage(flagUrl(countryCode, 80)) : Promise.resolve(null),
  ]);

  try {
    return await draw(card, foil, { photo, flag });
  } catch (error) {
    // Si el navegador bloquea las imágenes externas, se genera igual sin foto ni bandera.
    console.error("Imagen de la carta (se reintenta sin fotos):", error);
    return draw(card, foil, { photo: null, flag: null });
  }
}

// Abre el menú de compartir del sistema o, si no existe, descarga la imagen.
export async function shareImageBlob(blob: Blob, filename: string, text: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}