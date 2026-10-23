export const BINGO_SIZE = 5;
export const BINGO_CELLS = BINGO_SIZE * BINGO_SIZE;
export const MAX_CELL_LENGTH = 80;

export interface BingoCell {
  text: string;
  marked: boolean;
}

// Ideas para completar las casillas vacías.
export const BINGO_IDEAS = [
  "Safety car en la primera vuelta",
  "Carrera con lluvia",
  "Bandera roja",
  "Gana el que larga desde la pole",
  "Gana un piloto que larga fuera del top 10",
  "Un abandono en la primera vuelta",
  "Doblete de un mismo equipo",
  "Penalización de 5 segundos",
  "Vuelta rápida en la última vuelta",
  "Un piloto gana de punta a punta",
  "Podio con tres equipos distintos",
  "Error en boxes con parada de más de 4 segundos",
  "Toque entre compañeros de equipo",
  "Un debutante suma puntos",
  "Virtual safety car",
  "Un piloto gana por menos de un segundo",
  "Carrera sin abandonos",
  "Carrera con 5 o más abandonos",
  "Un piloto sudamericano suma puntos",
  "Un campeón del mundo no puntúa",
  "Un piloto remonta más de 10 puestos",
  "Largada repetida",
  "Clasificación con bandera roja",
  "Un piloto descalificado",
  "El líder del campeonato no gana en tres carreras seguidas",
  "Un equipo puntúa con sus dos pilotos",
  "Cambio de piloto durante la temporada",
  "Sprint con cambios de líder",
  "Carrera con más de dos safety cars",
  "Un piloto gana su primera carrera",
];

// Cuenta las líneas completas: 5 filas, 5 columnas y las 2 diagonales.
export function countLines(marked: boolean[]): number {
  const lines: number[][] = [];

  for (let i = 0; i < BINGO_SIZE; i++) {
    lines.push(Array.from({ length: BINGO_SIZE }, (_, j) => i * BINGO_SIZE + j)); // fila
    lines.push(Array.from({ length: BINGO_SIZE }, (_, j) => j * BINGO_SIZE + i)); // columna
  }
  lines.push(Array.from({ length: BINGO_SIZE }, (_, i) => i * BINGO_SIZE + i)); // diagonal
  lines.push(Array.from({ length: BINGO_SIZE }, (_, i) => i * BINGO_SIZE + (BINGO_SIZE - 1 - i))); // diagonal inversa

  return lines.filter((line) => line.every((index) => marked[index] === true)).length;
}