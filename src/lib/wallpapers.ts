import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Wallpaper = Database["public"]["Tables"]["wallpapers"]["Row"];
export type Quality = "4k" | "hd" | "sd";
export type ActionResult = { ok: true } | { ok: false; message: string };

export const QUALITY_LABELS: Record<Quality, string> = { "4k": "4K", hd: "HD", sd: "Baja" };

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB (igual que el bucket)
const THUMB_WIDTH = 640;

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

// Genera una miniatura liviana para la grilla.
async function createThumbnail(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, THUMB_WIDTH / bitmap.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo crear la miniatura.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear la miniatura."))),
      "image/webp",
      0.8,
    );
  });
}

export function getWallpaperUrls(id: string) {
  const bucket = supabase.storage.from("wallpapers");
  return {
    full: bucket.getPublicUrl(`${id}/full`).data.publicUrl,
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
  return supabase.storage.from("wallpapers").getPublicUrl(`${w.id}/full`, { download: filename }).data.publicUrl;
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
  const paths = [`${id}/full`, `${id}/thumb`];

  let thumb: Blob;
  try {
    thumb = await createThumbnail(file);
  } catch (error) {
    console.error("Miniatura:", error);
    return { ok: false, message: "No pudimos procesar la imagen." };
  }

  const { error: fullError } = await bucket.upload(paths[0]!, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (fullError) {
    console.error("Subida del original:", fullError);
    return { ok: false, message: "No pudimos subir la imagen. Revisá la consola para ver el detalle." };
  }

  const { error: thumbError } = await bucket.upload(paths[1]!, thumb, {
    contentType: thumb.type || "image/webp",
    cacheControl: "31536000",
  });
  if (thumbError) {
    console.error("Subida de la miniatura:", thumbError);
    await bucket.remove([paths[0]!]);
    return { ok: false, message: "No pudimos subir la miniatura. Revisá la consola para ver el detalle." };
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
    return { ok: false, message: "No pudimos guardar los datos del fondo. Revisá la consola para ver el detalle." };
  }

  return { ok: true };
}

export async function deleteWallpaper(id: string): Promise<ActionResult> {
  const { error } = await supabase.from("wallpapers").delete().eq("id", id);
  if (error) {
    console.error("Borrado:", error);
    return { ok: false, message: "No pudimos borrar el fondo." };
  }
  await supabase.storage.from("wallpapers").remove([`${id}/full`, `${id}/thumb`]);
  return { ok: true };
}