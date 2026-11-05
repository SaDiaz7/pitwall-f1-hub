import { useCallback, useState } from "react";
import { DailyGame } from "@/components/DailyGame";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { PageHeader } from "@/components/PageHeader";

export function GamePage() {
  // Al terminar la partida, el ranking se vuelve a cargar solo.
  const [version, setVersion] = useState(0);
  const refreshRanking = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <>
      <PageHeader title="Adiviná el circuito" subtitle="Un circuito nuevo cada día. ¿Lo reconocés por su trazado?" />
      <DailyGame onFinished={refreshRanking} />
      <GameLeaderboard refreshKey={version} />
    </>
  );
}