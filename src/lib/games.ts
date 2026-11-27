// Programación de los juegos diarios (la define la tabla game_schedule en la base de datos).

export const GAME_LABELS: Record<string, string> = {
  circuit: "Adiviná el circuito",
  hl: "¿Más o menos?",
  dg: "Adiviná el piloto",
};

// Días de la semana: 0 = domingo ... 6 = sábado. En pantalla la semana arranca el lunes.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

export interface TodayInfo {
  today: string | null;
  weekday: number;
  week: { weekday: number; game: string }[];
}