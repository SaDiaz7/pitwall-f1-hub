import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Solo sirve para mostrar u ocultar botones. La seguridad real son las políticas de Supabase.
export function useIsAdmin() {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && data === true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, sessionLoading]);

  return isAdmin;
}
