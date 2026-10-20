import type { Driver, GrandPrix, Team } from "@/lib/types";

// Datos de ejemplo. Reemplazar por datos reales (API / base de datos).

export const teams: Team[] = [
  { id: "mclaren", name: "McLaren", points: 612, wins: 11 },
  { id: "ferrari", name: "Ferrari", points: 398, wins: 3 },
  { id: "redbull", name: "Red Bull Racing", points: 371, wins: 5 },
  { id: "mercedes", name: "Mercedes", points: 352, wins: 2 },
  { id: "williams", name: "Williams", points: 101, wins: 0 },
  { id: "aston", name: "Aston Martin", points: 72, wins: 0 },
];

export const drivers: Driver[] = [
  { id: "piastri", name: "Oscar Piastri", number: 81, teamId: "mclaren", points: 316, wins: 6 },
  { id: "norris", name: "Lando Norris", number: 4, teamId: "mclaren", points: 296, wins: 5 },
  { id: "verstappen", name: "Max Verstappen", number: 1, teamId: "redbull", points: 290, wins: 5 },
  { id: "russell", name: "George Russell", number: 63, teamId: "mercedes", points: 228, wins: 2 },
  { id: "leclerc", name: "Charles Leclerc", number: 16, teamId: "ferrari", points: 210, wins: 2 },
  { id: "hamilton", name: "Lewis Hamilton", number: 44, teamId: "ferrari", points: 188, wins: 1 },
  { id: "antonelli", name: "Kimi Antonelli", number: 12, teamId: "mercedes", points: 124, wins: 0 },
  { id: "albon", name: "Alex Albon", number: 23, teamId: "williams", points: 70, wins: 0 },
  { id: "colapinto", name: "Franco Colapinto", number: 43, teamId: "williams", points: 31, wins: 0 },
  { id: "alonso", name: "Fernando Alonso", number: 14, teamId: "aston", points: 40, wins: 0 },
];

export const grandsPrix: GrandPrix[] = [
  { id: "aus", round: 1, name: "GP de Australia", circuit: "Albert Park", country: "Australia", date: "2026-03-08", status: "finalizado" },
  { id: "chn", round: 2, name: "GP de China", circuit: "Shanghái", country: "China", date: "2026-03-15", status: "finalizado" },
  { id: "jpn", round: 3, name: "GP de Japón", circuit: "Suzuka", country: "Japón", date: "2026-03-29", status: "finalizado" },
  { id: "mia", round: 4, name: "GP de Miami", circuit: "Miami International Autodrome", country: "Estados Unidos", date: "2026-05-03", status: "finalizado" },
  { id: "mon", round: 5, name: "GP de Mónaco", circuit: "Montecarlo", country: "Mónaco", date: "2026-06-07", status: "finalizado" },
  { id: "esp", round: 6, name: "GP de España", circuit: "Barcelona-Catalunya", country: "España", date: "2026-06-14", status: "finalizado" },
  { id: "gbr", round: 7, name: "GP de Gran Bretaña", circuit: "Silverstone", country: "Reino Unido", date: "2026-07-05", status: "finalizado" },
  { id: "bel", round: 8, name: "GP de Bélgica", circuit: "Spa-Francorchamps", country: "Bélgica", date: "2026-07-19", status: "finalizado" },
  { id: "ita", round: 9, name: "GP de Italia", circuit: "Monza", country: "Italia", date: "2026-09-06", status: "finalizado" },
  { id: "sgp", round: 10, name: "GP de Singapur", circuit: "Marina Bay", country: "Singapur", date: "2026-10-11", status: "finalizado" },
  { id: "usa", round: 11, name: "GP de Estados Unidos", circuit: "Circuito de las Américas", country: "Estados Unidos", date: "2026-10-25", status: "proximo" },
  { id: "mex", round: 12, name: "GP de México", circuit: "Hermanos Rodríguez", country: "México", date: "2026-11-01", status: "proximo" },
  { id: "bra", round: 13, name: "GP de São Paulo", circuit: "Interlagos", country: "Brasil", date: "2026-11-08", status: "proximo" },
  { id: "lvg", round: 14, name: "GP de Las Vegas", circuit: "Las Vegas Strip", country: "Estados Unidos", date: "2026-11-21", status: "proximo" },
  { id: "abu", round: 15, name: "GP de Abu Dabi", circuit: "Yas Marina", country: "Emiratos Árabes Unidos", date: "2026-12-06", status: "proximo" },
];

export const getTeam = (id: string) => teams.find((t) => t.id === id);
export const getNextGrandPrix = () => grandsPrix.find((g) => g.status === "proximo");
