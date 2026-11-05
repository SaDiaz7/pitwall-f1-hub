import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/circuits";
import type { GameState } from "@/lib/daily-game";

const W = 1080;
const H = 1350;

// Colores de la tarjeta (se pueden cambiar acá).
const BG_TOP = "#0b0b0d";
const BG_BOTTOM = "#1a0a0c";
const RED = "#e10600";
const GREEN = "#22c55e";
const MISS = "#ef4444";
const EMPTY = "#2a2a30";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Usa las mismas tipografías que la página (la del título y la del texto).
function fontFamilies() {
  const body = getComputedStyle(document.body).fontFamily || "sans-serif";
  const heading = document.querySelector("h1");
  const display = heading ? getComputedStyle(heading).fontFamily || body : body;
  return { body, display };
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
    current -= 4;
  }
  ctx.font = `${prefix} ${current}px ${family}`;
}

export async function renderShareCard(state: GameState): Promise<Blob> {
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

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Franja de carrera abajo
  ctx.fillStyle = RED;
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = TEXT;
  ctx.fillRect(0, H - 36, W, 8);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Encabezado
  ctx.fillStyle = RED;
  ctx.font = `700 40px ${display}`;
  ctx.fillText("PITWALL", W / 2, 120);

  ctx.fillStyle = TEXT;
  fitFont(ctx, "ADIVINÁ EL CIRCUITO", W - 120, 92, "italic 700", display);
  ctx.fillText("ADIVINÁ EL CIRCUITO", W / 2, 220);

  const day = new Date(`${state.date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.fillStyle = MUTED;
  ctx.font = `400 34px ${body}`;
  ctx.fillText(day, W / 2, 285);

  // Panel con la silueta
  const panelX = 60;
  const panelY = 340;
  const panelW = W - 120;
  const panelH = 520;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  const scale = Math.min((panelW - 160) / MAP_WIDTH, (panelH - 140) / MAP_HEIGHT);
  ctx.save();
  ctx.translate(panelX + (panelW - MAP_WIDTH * scale) / 2, panelY + (panelH - MAP_HEIGHT * scale) / 2);
  ctx.scale(scale, scale);
  ctx.lineWidth = 10 / scale;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = RED;
  ctx.shadowColor = "rgba(225,6,0,0.55)";
  ctx.shadowBlur = 30;
  ctx.stroke(new Path2D(state.path));
  ctx.restore();

  // Puntaje
  const score = state.solved ? `${state.guesses.length}/${state.maxAttempts}` : `X/${state.maxAttempts}`;
  ctx.fillStyle = state.solved ? TEXT : MISS;
  ctx.font = `700 190px ${display}`;
  ctx.fillText(score, W / 2, 1050);

  // Cuadraditos
  const size = 84;
  const gap = 18;
  const total = state.maxAttempts * size + (state.maxAttempts - 1) * gap;
  const startX = (W - total) / 2;
  for (let i = 0; i < state.maxAttempts; i++) {
    let color = EMPTY;
    if (i < state.guesses.length) {
      color = state.solved && i === state.guesses.length - 1 ? GREEN : MISS;
    }
    roundedRect(ctx, startX + i * (size + gap), 1090, size, size, 16);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Racha (solo si hay)
  if (state.streak > 0) {
    ctx.fillStyle = TEXT;
    ctx.font = `700 44px ${body}`;
    ctx.fillText(`🔥 Racha de ${state.streak} ${state.streak === 1 ? "día" : "días"}`, W / 2, 1240);
  }

  // Dirección de la página
  ctx.fillStyle = MUTED;
  ctx.font = `400 30px ${body}`;
  ctx.fillText(window.location.host, W / 2, 1292);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}