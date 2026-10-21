import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/hooks/useSession";
import type { ActionResult } from "@/lib/wallpapers";

export type CircuitFact = Database["public"]["Tables"]["circuit_facts"]["Row"];

export function useCircuitFacts(circuitId: string) {
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [facts, setFacts] = useState<CircuitFact[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setFacts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("circuit_facts")
      .select("*")
      .eq("circuit_id", circuitId)
      .order("created_at", { ascending: true });

    if (!error) setFacts(data ?? []);
    setLoading(false);
  }, [userId, circuitId]);

  useEffect(() => {
    if (sessionLoading) return;
    reload();
  }, [sessionLoading, reload]);

  const add = useCallback(
    async (fact: string, source: string): Promise<ActionResult> => {
      const { error } = await supabase.from("circuit_facts").insert({
        circuit_id: circuitId,
        fact: fact.trim(),
        source: source.trim() || null,
      });

      if (error) {
        console.error("Agregar dato curioso:", error);
        return { ok: false, message: "No pudimos guardar el dato. Revisá la consola para ver el detalle." };
      }

      await reload();
      return { ok: true };
    },
    [circuitId, reload],
  );

  const remove = useCallback(
    async (id: string): Promise<ActionResult> => {
      const { error } = await supabase.from("circuit_facts").delete().eq("id", id);

      if (error) {
        console.error("Borrar dato curioso:", error);
        return { ok: false, message: "No pudimos borrar el dato." };
      }

      await reload();
      return { ok: true };
    },
    [reload],
  );

  return { facts, loading, add, remove };
}