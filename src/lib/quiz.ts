// Preguntas del quiz "¿Cuánto sabés de F1?". Todas salen de lo que explica la guía (/guia).

export interface QuizQuestion {
  id: string;
  question: string;
  // La primera opción es la correcta: al jugar, las opciones se mezclan.
  options: [string, string, string, string];
  explanation: string;
  // Id de la sección de la guía donde se explica.
  section: string;
}

export interface PlayChoice {
  text: string;
  correct: boolean;
}

export interface PlayQuestion {
  id: string;
  question: string;
  choices: PlayChoice[];
  explanation: string;
  section: string;
}

export const ROUND_SIZE = 8;

export const SECTION_LABELS: Record<string, string> = {
  basico: "Lo básico",
  "fin-de-semana": "El fin de semana",
  practicas: "Prácticas",
  clasificacion: "Clasificación",
  sprint: "Sprint",
  carrera: "La carrera",
  puntos: "Puntos",
  neumaticos: "Neumáticos",
  banderas: "Banderas",
  "safety-car": "Safety car",
  auto: "El auto",
  reglas: "Reglas",
  glosario: "Glosario",
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: "grid-size",
    question: "¿Cuántos autos largan en una carrera de esta temporada?",
    options: ["22 (11 equipos con 2 pilotos)", "20 (10 equipos con 2 pilotos)", "24 (12 equipos con 2 pilotos)", "18 (9 equipos con 2 pilotos)"],
    explanation: "Hay 11 equipos y cada uno presenta 2 autos, así que son 22 en total.",
    section: "basico",
  },
  {
    id: "grid-order",
    question: "¿Qué define el orden de largada de la carrera del domingo?",
    options: [
      "La clasificación del sábado",
      "Las prácticas del viernes",
      "El resultado de la carrera sprint",
      "Un sorteo antes de la carrera",
    ],
    explanation:
      "La grilla sale de la clasificación del sábado. El sprint, cuando hay, tiene su propia grilla, pero no cambia la del domingo.",
    section: "clasificacion",
  },
  {
    id: "winner-points",
    question: "¿Cuántos puntos recibe el ganador de una carrera?",
    options: ["25", "20", "15", "10"],
    explanation: "El ganador se lleva 25, el segundo 18, el tercero 15, y así hasta el décimo, que recibe 1.",
    section: "puntos",
  },
  {
    id: "points-count",
    question: "¿Cuántos pilotos suman puntos en una carrera normal?",
    options: ["Los 10 primeros", "Los 3 primeros", "Los 5 primeros", "Los 20 primeros"],
    explanation: "Puntúan los 10 primeros de la carrera.",
    section: "puntos",
  },
  {
    id: "sprint-points",
    question: "¿Cuántos puntos da ganar una carrera sprint?",
    options: ["8", "25", "10", "5"],
    explanation: "En el sprint puntúan los 8 primeros: 8, 7, 6, 5, 4, 3, 2 y 1.",
    section: "sprint",
  },
  {
    id: "flag-blue",
    question: "¿Qué significa la bandera azul?",
    options: [
      "Hay que dejar pasar a un auto más rápido que está por doblarte",
      "La pista está mojada",
      "Terminó la carrera",
      "Hay un auto detenido adelante",
    ],
    explanation: "Se le muestra al piloto al que un auto más rápido está por doblar: tiene que dejarlo pasar sin pelear.",
    section: "banderas",
  },
  {
    id: "flag-red",
    question: "¿Qué bandera se muestra cuando se suspende la carrera?",
    options: ["Roja", "Amarilla", "Negra", "Blanca"],
    explanation: "Con la bandera roja todos entran a boxes hasta que la pista esté lista para seguir.",
    section: "banderas",
  },
  {
    id: "vsc",
    question: "¿Cuál es la diferencia entre el safety car virtual (VSC) y el safety car?",
    options: [
      "En el VSC no sale ningún auto y se mantienen las diferencias; con el safety car el pelotón se junta detrás del auto de seguridad",
      "El VSC se usa solo en la clasificación",
      "No hay diferencia: son dos nombres para lo mismo",
      "Con el VSC los pilotos pueden adelantar con libertad",
    ],
    explanation:
      "Con el safety car virtual nadie sale a la pista y las diferencias se mantienen. Con el safety car, todos se juntan detrás del auto de seguridad.",
    section: "safety-car",
  },
  {
    id: "soft-tyre",
    question: "¿Qué neumático seco es el más rápido pero el que menos dura?",
    options: ["El blando (franja roja)", "El duro (franja blanca)", "El medio (franja amarilla)", "El intermedio (franja verde)"],
    explanation: "El blando da más agarre y velocidad, pero se gasta enseguida.",
    section: "neumaticos",
  },
  {
    id: "rear-wing",
    question: "¿Para qué sirve el alerón trasero?",
    options: [
      "Da carga a las ruedas traseras (estabilidad y tracción) y es la pieza que más resistencia al aire genera",
      "Enfría el motor",
      "Protege la cabeza del piloto",
      "Aumenta el combustible disponible",
    ],
    explanation: "Da estabilidad en curva y tracción al acelerar, pero también es la pieza que más resistencia al aire genera.",
    section: "auto",
  },
  {
    id: "drs-2026",
    question: "¿Qué pasó con el DRS en 2026?",
    options: [
      "Desapareció: lo reemplazaron los alerones activos y el modo adelantamiento",
      "Se volvió obligatorio en todas las vueltas",
      "Solo se usa cuando llueve",
      "Se mantiene igual que en años anteriores",
    ],
    explanation:
      "El DRS se eliminó. Ahora los alerones delantero y trasero se mueven, y existe un modo adelantamiento con más potencia eléctrica.",
    section: "auto",
  },
  {
    id: "quali-parts",
    question: "¿Cuántas partes tiene la clasificación y qué pasa en cada una?",
    options: [
      "Tres (Q1, Q2 y Q3): en las dos primeras quedan eliminados los autos más lentos",
      "Una sola vuelta lanzada para todos los pilotos",
      "Dos partes: una de prácticas y otra de carrera",
      "Cinco partes de 5 minutos cada una",
    ],
    explanation: "Es una eliminatoria: con 22 autos quedan afuera los 6 más lentos de Q1, otros 6 en Q2, y 10 pelean la pole en Q3.",
    section: "clasificacion",
  },
  {
    id: "pole",
    question: "¿Qué es la pole position?",
    options: [
      "Salir primero en la grilla, por haber hecho el mejor tiempo de la clasificación",
      "Ganar la carrera sprint",
      "Hacer la vuelta más rápida de la carrera",
      "Ser el piloto que más puntos tiene",
    ],
    explanation: "Es la primera posición de la grilla de largada: la gana quien hace el mejor tiempo en la clasificación.",
    section: "clasificacion",
  },
  {
    id: "tyre-rule",
    question: "En una carrera con la pista seca, ¿qué regla hay sobre los neumáticos?",
    options: [
      "Hay que usar al menos dos tipos de neumáticos secos distintos",
      "Hay que usar siempre el mismo tipo",
      "Solo se pueden usar neumáticos nuevos",
      "Los neumáticos duros están prohibidos",
    ],
    explanation: "Por esa regla, casi todos los pilotos paran al menos una vez en boxes.",
    section: "carrera",
  },
  {
    id: "fastest-lap",
    question: "¿La vuelta rápida de la carrera da un punto extra?",
    options: [
      "No: ese punto se eliminó en 2025",
      "Sí, siempre da un punto extra",
      "Sí, pero solo en los sprint",
      "Sí, da dos puntos extra",
    ],
    explanation: "Hasta 2024 daba un punto. Desde 2025 ya no suma puntos.",
    section: "carrera",
  },
  {
    id: "distance",
    question: "¿Cuántos kilómetros recorre aproximadamente una carrera del domingo?",
    options: ["Unos 305", "Unos 100", "Unos 500", "Unos 50"],
    explanation: "Son unos 305 km (menos en Mónaco), con un límite de dos horas. Los 100 km son del sprint.",
    section: "carrera",
  },
  {
    id: "constructors",
    question: "¿Cómo se suman los puntos del campeonato de constructores?",
    options: [
      "Se suman los puntos de los dos pilotos de cada equipo",
      "Cuenta solo el mejor piloto de cada equipo",
      "Se reparten según las carreras que terminó el equipo",
      "Se suman solo los puntos de los sprint",
    ],
    explanation: "Cada equipo suma los puntos de sus dos pilotos. Quien más junta se lleva el título de equipos.",
    section: "puntos",
  },
  {
    id: "practice-why",
    question: "¿Para qué sirven las prácticas libres?",
    options: [
      "Para probar el auto, los neumáticos y ajustar la configuración",
      "Para dar puntos extra",
      "Para definir el orden de largada",
      "Para que el público vote a su piloto favorito",
    ],
    explanation: "Los equipos ajustan el auto y prueban neumáticos, y los pilotos aprenden el circuito. No dan puntos.",
    section: "practicas",
  },
  {
    id: "undercut",
    question: "¿Qué es un undercut?",
    options: [
      "Parar antes que el rival para salir con neumáticos nuevos y pasarlo cuando él pare",
      "Un adelantamiento por el exterior de una curva",
      "Una penalización de cinco segundos",
      "Un tipo de bandera",
    ],
    explanation: "Es una táctica de estrategia: entrar antes a boxes para ganar tiempo con neumáticos nuevos.",
    section: "glosario",
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

// Arma una ronda: preguntas al azar, con las opciones en orden distinto cada vez.
export function buildRound(count: number = ROUND_SIZE): PlayQuestion[] {
  return shuffle(QUESTIONS)
    .slice(0, count)
    .map((q) => ({
      id: q.id,
      question: q.question,
      choices: shuffle(q.options.map((text, index) => ({ text, correct: index === 0 }))),
      explanation: q.explanation,
      section: q.section,
    }));
}

export interface QuizLevel {
  name: string;
  text: string;
  champion: boolean;
}

export function levelFor(score: number, total: number): QuizLevel {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.9) {
    return { name: "Campeón del mundo", text: "Impecable. Sabés de F1 como pocos.", champion: true };
  }
  if (ratio >= 0.65) {
    return { name: "Líder del campeonato", text: "Sabés bastante. Seguro ya podés explicarle la F1 a un amigo.", champion: false };
  }
  if (ratio >= 0.4) {
    return {
      name: "Piloto titular",
      text: "Ya entendés lo básico. Con un repaso de la guía vas a seguir las carreras sin perderte.",
      champion: false,
    };
  }
  return { name: "Rookie", text: "Recién arrancás, y está perfecto: la guía te explica todo desde cero.", champion: false };
}