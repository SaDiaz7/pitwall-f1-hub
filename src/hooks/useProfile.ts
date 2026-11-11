import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Evento para avisarle a todas las pantallas que el perfil cambió
// (así la barra lateral se actualiza cuando guardás en Ajustes).
const PROFILE_EVENT = "pitwall:profile-updated";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const HEADER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HEADER_MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB (después se achica)
const HEADER_WIDTH = 1500;

export const BIO_MAX = 160;

export interface Profile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  header_url: string | null;
  country: string | null;
  is_public: boolean;
  show_favorites: boolean;
}

export type SaveResult = { ok: true } | { ok: false; message: string };

const EMPTY_PROFILE: Profile = {
  username: null,
  display_name: null,
  avatar_url: null,
  bio: null,
  header_url: null,
  country: null,
  is_public: true,
  show_favorites: true,
};

// Devuelve las iniciales para mostrar cuando no hay foto.
export function getInitials(source?: string | null): string {
  if (!source) return "PW";
  const base = source.split("@")[0] ?? source;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const letters = second ? first + second : base.slice(0, 2);
  return letters ? letters.toUpperCase() : "PW";
}

// Achica el header a 1500 px de ancho y lo pasa a WebP, así pesa poco.
async function prepareHeader(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, HEADER_WIDTH / bitmap.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo preparar la imagen.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo preparar la imagen."))),
      "image/webp",
      0.85,
    );
  });
}

export function useProfile() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  // Lee el perfil del usuario logueado.
  const load = useCallback(async () => {
    if (!userId) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, bio, header_url, is_public, show_favorites, country")
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      setProfile(data ?? EMPTY_PROFILE);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
    window.addEventListener(PROFILE_EVENT, load);
    return () => window.removeEventListener(PROFILE_EVENT, load);
  }, [sessionLoading, load]);

  // Guarda cambios. Si el perfil todavía no existe, lo crea (upsert).
  const save = useCallback(
    async (changes: Partial<Profile>): Promise<SaveResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, ...changes, updated_at: new Date().toISOString() },
          { onConflict: "id" },
        );

      if (error) {
        if (error.code === "23505") {
          return { ok: false, message: "Ese nombre de usuario ya está en uso." };
        }
        if (error.code === "23514") {
          return {
            ok: false,
            message: "El nombre de usuario, el nombre visible o la biografía no cumplen el formato.",
          };
        }
        return { ok: false, message: "No pudimos guardar los cambios. Probá de nuevo." };
      }

      window.dispatchEvent(new Event(PROFILE_EVENT));
      return { ok: true };
    },
    [userId],
  );

  // Sube el avatar a Storage (carpeta con tu id) y guarda su dirección en el perfil.
  const uploadAvatar = useCallback(
    async (file: File): Promise<SaveResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

      if (!AVATAR_TYPES.includes(file.type)) {
        return { ok: false, message: "El avatar tiene que ser JPG, PNG o WebP." };
      }
      if (file.size > AVATAR_MAX_BYTES) {
        return { ok: false, message: "El avatar no puede pesar más de 2 MB." };
      }

      const path = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        return { ok: false, message: "No pudimos subir la imagen. Probá de nuevo." };
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // El "?v=" evita que el navegador muestre la foto vieja guardada en caché.
      const url = `${data.publicUrl}?v=${Date.now()}`;

      return save({ avatar_url: url });
    },
    [userId, save],
  );

  // Sube el header (foto larga del perfil): se achica y se guarda en tu carpeta del bucket "profile-headers".
  const uploadHeader = useCallback(
    async (file: File): Promise<SaveResult> => {
      if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

      if (!HEADER_TYPES.includes(file.type)) {
        return { ok: false, message: "El header tiene que ser JPG, PNG o WebP." };
      }
      if (file.size > HEADER_MAX_INPUT_BYTES) {
        return { ok: false, message: "El header no puede pesar más de 10 MB." };
      }

      let blob: Blob;
      try {
        blob = await prepareHeader(file);
      } catch (error) {
        console.error("Preparar header:", error);
        return { ok: false, message: "No pudimos procesar la imagen." };
      }

      const path = `${userId}/header`;
      const { error: uploadError } = await supabase.storage
        .from("profile-headers")
        .upload(path, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        console.error("Subir header:", uploadError);
        return { ok: false, message: "No pudimos subir la imagen. Probá de nuevo." };
      }

      const { data } = supabase.storage.from("profile-headers").getPublicUrl(path);
      return save({ header_url: `${data.publicUrl}?v=${Date.now()}` });
    },
    [userId, save],
  );

  const removeHeader = useCallback(async (): Promise<SaveResult> => {
    if (!userId) return { ok: false, message: "Tenés que iniciar sesión." };

    const result = await save({ header_url: null });
    if (result.ok) {
      // Si no se puede borrar el archivo no pasa nada: el perfil ya no lo muestra.
      await supabase.storage.from("profile-headers").remove([`${userId}/header`]);
    }
    return result;
  }, [userId, save]);

  return { profile, loading, save, uploadAvatar, uploadHeader, removeHeader };
}