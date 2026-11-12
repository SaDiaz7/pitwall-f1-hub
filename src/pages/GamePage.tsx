import { useCallback, useState } from "react";
import { DailyGame } from "@/components/DailyGame";
import { DailyPack } from "@/components/DailyPack";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { PageHeader } from "@/components/PageHeader";

export function GamePage() {
  // Al terminar la partida, el ranking y el sobre se vuelven a cargar solos.
  const [version, setVersion] = useState(0);
  const refreshRanking = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <>
      <PageHeader title="Adiviná el circuito" subtitle="Un circuito nuevo cada día. ¿Lo reconocés por su trazado?" />
      <DailyGame onFinished={refreshRanking} />
      <div className="mt-6 max-w-3xl">
        <DailyPack refreshKey={version} />
      </div>
      <GameLeaderboard refreshKey={version} />
    </>
  );
}