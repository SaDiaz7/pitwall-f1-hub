import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Wallpaper = Database["public"]["Tables"]["wallpapers"]["Row"];
export type Quality = "4k" | "hd" | "sd";
export type ActionResult = { ok: true } | { ok: false; message: string };

export const QUALITY_LABELS: Record<Quality, string> = { "4k": "4K", hd: "HD", sd: "Baja" };

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB (igual que el bucket)

// Cada fondo se guarda en tres tamaños: la miniatura para las grillas, una vista previa para el visor
// y el original (que solo se baja al descargar). Así se gasta mucho menos tráfico.
interface ResizeOptions {
  width: number;
  height: number;
  quality: number;
}
const THUMB_MAX: ResizeOptions = { width: 640, height: 1280, quality: 0.8 };
const PREVIEW_MAX: ResizeOptions = { width: 1600, height: 1600, quality: 0.82 };

// Por encima de estos pesos, el optimizador considera que hay que regenerar la imagen.
const THUMB_OK_BYTES = 200 * 1024;
const PREVIEW_OK_BYTES = 600 * 1024;

const CACHE_ONE_YEAR = "31536000";

const EXTENSIONS: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function qualityLabel(quality: string): string {
  return QUALITY_LABELS[quality as Quality] ?? quality.toUpperCase();
}

// Calidad según el lado más largo de la imagen.
export function detectQuality(width: number, height: number): Quality {
  const longSide = Math.max(width, height);
  if (longSide >= 3840) return "4k";
  if (longSide >= 1920) return "hd";
  return "sd";
}

// Devuelve un mensaje de error, o null si el archivo es válido.
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "El fondo tiene que ser JPG, PNG o WebP.";
  if (file.size > MAX_FILE_BYTES) return "El fondo no puede pesar más de 15 MB.";
  return null;
}

export async function readImageSize(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

// Achica una imagen (sin agrandarla nunca) y la pasa a WebP.
async function resizeToWebp(source: Blob, options: ResizeOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, options.width / bitmap.width, options.height / bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo preparar la imagen.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", options.quality));
  // Algunos navegadores no saben guardar WebP y devuelven PNG, que pesa mucho más: en ese caso se descarta.
  if (!blob || blob.type !== "image/webp") {
    throw new Error("Este navegador no puede generar imágenes WebP.");
  }
  return blob;
}

export function getWallpaperUrls(id: string) {
  const bucket = supabase.storage.from("wallpapers");
  return {
    full: bucket.getPublicUrl(`${id}/full`).data.publicUrl,
    preview: bucket.getPublicUrl(`${id}/preview`).data.publicUrl,
    thumb: bucket.getPublicUrl(`${id}/thumb`).data.publicUrl,
  };
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Dirección que fuerza la descarga con un nombre de archivo prolijo.
export function getDownloadUrl(w: Wallpaper): string {
  const subject = slugify(w.driver_name ?? w.team_name ?? "fondo") || "fondo";
  const filename = `pitwall-${w.year}-${subject}-${w.quality}.${w.file_ext}`;
  return supabase.storage.from("wallpapers").getPublicUrl(`${w.id}/full`, { download: filename })
    .data.publicUrl;
}

export interface WallpaperMeta {
  year: number;
  driver: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  credit: string;
  width: number;
  height: number;
}

export async function uploadWallpaper(file: File, meta: WallpaperMeta): Promise<ActionResult> {
  const invalid = validateImageFile(file);
  if (invalid) return { ok: false, message: invalid };

  const id = crypto.randomUUID();
  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return { ok: false, message: "El fondo tiene que ser JPG, PNG o WebP." };
  }

  const bucket = supabase.storage.from("wallpapers");

  let thumb: Blob;
  let preview: Blob;
  try {
    thumb = await resizeToWebp(file, THUMB_MAX);
    preview = await resizeToWebp(file, PREVIEW_MAX);
  } catch (error) {
    console.error("Miniatura:", error);
    return { ok: false, message: "No pudimos procesar la imagen." };
  }

  const uploads: { path: string; blob: Blob; contentType: string }[] = [
    { path: `${id}/full`, blob: file, contentType: file.type },
    { path: `${id}/preview`, blob: preview, contentType: "image/webp" },
    { path: `${id}/thumb`, blob: thumb, contentType: "image/webp" },
  ];
  const paths = uploads.map((item) => item.path);

  for (const item of uploads) {
    const { error } = await bucket.upload(item.path, item.blob, {
      contentType: item.contentType,
      cacheControl: CACHE_ONE_YEAR,
    });
    if (error) {
      console.error("Subida de archivos del fondo:", item.path, error);
      await bucket.remove(paths);
      return {
        ok: false,
        message: "No pudimos subir la imagen. Revisá la consola para ver el detalle.",
      };
    }
  }

  const { error: insertError } = await supabase.from("wallpapers").insert({
    id,
    year: meta.year,
    driver_id: meta.driver?.id ?? null,
    driver_name: meta.driver?.name ?? null,
    team_id: meta.team?.id ?? null,
    team_name: meta.team?.name ?? null,
    quality: detectQuality(meta.width, meta.height),
    width: meta.width,
    height: meta.height,
    credit: meta.credit.trim() || null,
    file_ext: ext,
  });

  if (insertError) {
    console.error("Registro en la tabla:", insertError);
    await bucket.remove(paths);
    return {
      ok: false,
      message: "No pudimos guardar los datos del fondo. Revisá la consola para ver el detalle.",
    };
  }

  return { ok: true };
}

export async function deleteWallpaper(id: string): Promise<ActionResult> {
  const { error } = await supabase.from("wallpapers").delete().eq("id", id);
  if (error) {
    console.error("Borrado:", error);
    return { ok: false, message: "No pudimos borrar el fondo." };
  }
  await supabase.storage.from("wallpapers").remove([`${id}/full`, `${id}/preview`, `${id}/thumb`]);
  return { ok: true };
}

export type Orientation = "landscape" | "portrait" | "square";

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  landscape: "Horizontal · computadora",
  portrait: "Vertical · celular",
  square: "Cuadrado",
};

// Según la proporción de la imagen: apaisada = pensada para pantallas de compu, vertical = para celulares.
export function orientationOf(width: number, height: number): Orientation {
  const ratio = width / height;
  if (ratio >= 1.2) return "landscape";
  if (ratio <= 0.83) return "portrait";
  return "square";
}

export interface WallpaperEdit {
  year: number;
  driver: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  credit: string;
}

export async function updateWallpaper(id: string, edit: WallpaperEdit): Promise<ActionResult> {
  const { data, error } = await supabase
    .from("wallpapers")
    .update({
      year: edit.year,
      driver_id: edit.driver?.id ?? null,
      driver_name: edit.driver?.name ?? null,
      team_id: edit.team?.id ?? null,
      team_name: edit.team?.name ?? null,
      credit: edit.credit.trim() || null,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Editar fondo:", error);
    return { ok: false, message: "No pudimos guardar los cambios." };
  }
  // Si la base no deja editar, no da error: simplemente no cambia ninguna fila.
  if (!data || data.length === 0) {
    return { ok: false, message: "No pudimos guardar: el fondo no existe o no tenés permiso." };
  }
  return { ok: true };
}

export type OptimizeResult = { ok: true; changed: boolean } | { ok: false; message: string };

// Peso de un archivo mirando solo los encabezados (no descarga la imagen).
async function remoteSize(url: string): Promise<number | null> {
  const response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (!response.ok) return null;
  const length = Number(response.headers.get("content-length"));
  return Number.isFinite(length) && length > 0 ? length : null;
}

// Vuelve a generar la miniatura y la vista previa de un fondo ya subido, si pesan de más o no existen.
export async function optimizeWallpaperImages(id: string): Promise<OptimizeResult> {
  const urls = getWallpaperUrls(id);
  const bucket = supabase.storage.from("wallpapers");

  try {
    const [thumbSize, previewSize] = await Promise.all([remoteSize(urls.thumb), remoteSize(urls.preview)]);
    const thumbOk = thumbSize !== null && thumbSize <= THUMB_OK_BYTES;
    const previewOk = previewSize !== null && previewSize <= PREVIEW_OK_BYTES;
    if (thumbOk && previewOk) return { ok: true, changed: false };

    const response = await fetch(urls.full, { cache: "no-store" });
    if (!response.ok) return { ok: false, message: "No se pudo bajar el original." };
    const original = await response.blob();

    const replacements: { path: string; options: ResizeOptions; needed: boolean }[] = [
      { path: `${id}/thumb`, options: THUMB_MAX, needed: !thumbOk },
      { path: `${id}/preview`, options: PREVIEW_MAX, needed: !previewOk },
    ];

    for (const item of replacements) {
      if (!item.needed) continue;
      const blob = await resizeToWebp(original, item.options);
      await bucket.remove([item.path]);
      const { error } = await bucket.upload(item.path, blob, {
        contentType: "image/webp",
        cacheControl: CACHE_ONE_YEAR,
      });
      if (error) throw error;
    }

    return { ok: true, changed: true };
  } catch (error) {
    console.error("Optimizar fondo:", id, error);
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo optimizar." };
  }
}