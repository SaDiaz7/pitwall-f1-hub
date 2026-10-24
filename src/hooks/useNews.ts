import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/hooks/useSession";
import type { ActionResult } from "@/lib/wallpapers";

export type SiteNews = Database["public"]["Tables"]["site_news"]["Row"];

const closedKey = (version: number) => `pitwall:news-closed:${version}`;

export function useNews() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [news, setNews] = useState<SiteNews | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [closedThisSession, setClosedThisSession] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setNews(null);
      setLoading(false);
      return;
    }

    const [newsResult, dismissalResult] = await Promise.all([
      supabase.from("site_news").select("*").eq("id", 1).maybeSingle(),
      supabase.from("news_dismissals").select("version").eq("user_id", userId).maybeSingle(),
    ]);

    const current = newsResult.error ? null : newsResult.data;
    setNews(current);
    setDismissedVersion(dismissalResult.data?.version ?? 0);

    if (current) {
      try {
        setClosedThisSession(sessionStorage.getItem(closedKey(current.version)) === "1");
      } catch {
        setClosedThisSession(false);
      }
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  // Se muestra si está activa, la persona no la descartó para siempre y no la cerró en esta sesión.
  const visible = news !== null && news.active && dismissedVersion < news.version && !closedThisSession;

  // dontShowAgain = true: no vuelve a aparecer hasta la próxima edición. false: solo se cierra por esta sesión.
  const close = useCallback(
    async (dontShowAgain: boolean): Promise<ActionResult> => {
      if (!news || !userId) return { ok: true };

      try {
        sessionStorage.setItem(closedKey(news.version), "1");
      } catch {
        // Si el navegador no deja guardar, igual se cierra en pantalla.
      }
      setClosedThisSession(true);

      if (!dontShowAgain) return { ok: true };

      const { error } = await supabase
        .from("news_dismissals")
        .upsert({ user_id: userId, version: news.version, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      if (error) {
        console.error("Guardar descarte de novedades:", error);
        return { ok: false, message: "No pudimos guardar tu preferencia." };
      }

      setDismissedVersion(news.version);
      return { ok: true };
    },
    [news, userId],
  );

  return { news, loading, visible, close, reload: load };
}