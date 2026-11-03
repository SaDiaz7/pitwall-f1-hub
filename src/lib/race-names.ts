// Nombres de los Grandes Premios en español. Si falta alguno, se muestra el nombre original de la API.
// Este archivo no importa nada de la app: también lo usa el servidor de notificaciones.
export const RACE_NAMES_ES: Record<string, string> = {
  "Australian Grand Prix": "GP de Australia",
  "Chinese Grand Prix": "GP de China",
  "Japanese Grand Prix": "GP de Japón",
  "Bahrain Grand Prix": "GP de Baréin",
  "Saudi Arabian Grand Prix": "GP de Arabia Saudita",
  "Miami Grand Prix": "GP de Miami",
  "Canadian Grand Prix": "GP de Canadá",
  "Monaco Grand Prix": "GP de Mónaco",
  "Spanish Grand Prix": "GP de España",
  "Austrian Grand Prix": "GP de Austria",
  "British Grand Prix": "GP de Gran Bretaña",
  "Belgian Grand Prix": "GP de Bélgica",
  "Hungarian Grand Prix": "GP de Hungría",
  "Dutch Grand Prix": "GP de Países Bajos",
  "Italian Grand Prix": "GP de Italia",
  "Azerbaijan Grand Prix": "GP de Azerbaiyán",
  "Singapore Grand Prix": "GP de Singapur",
  "United States Grand Prix": "GP de Estados Unidos",
  "Mexico City Grand Prix": "GP de México",
  "Brazilian Grand Prix": "GP de Brasil",
  "Las Vegas Grand Prix": "GP de Las Vegas",
  "Qatar Grand Prix": "GP de Catar",
  "Abu Dhabi Grand Prix": "GP de Abu Dabi",
  "Bahrain Grand Prix in Malaysia": "GP de Baréin en Malasia",
  "Barcelona Grand Prix": "GP de Barcelona",
};

export const translateRaceName = (name: string): string => RACE_NAMES_ES[name] ?? name;