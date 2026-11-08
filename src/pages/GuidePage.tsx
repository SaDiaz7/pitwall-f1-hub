import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  CircleDot,
  Flag,
  Gauge,
  ShieldAlert,
  Timer,
  Trophy,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { cn } from "@/lib/utils";

const TOC = [
  { id: "basico", label: "Lo básico" },
  { id: "fin-de-semana", label: "El fin de semana" },
  { id: "practicas", label: "Prácticas" },
  { id: "clasificacion", label: "Clasificación" },
  { id: "sprint", label: "Sprint" },
  { id: "carrera", label: "La carrera" },
  { id: "puntos", label: "Puntos" },
  { id: "neumaticos", label: "Neumáticos" },
  { id: "banderas", label: "Banderas" },
  { id: "safety-car", label: "Safety car" },
  { id: "auto", label: "El auto" },
  { id: "reglas", label: "Reglas" },
  { id: "glosario", label: "Glosario" },
] as const;

const FACTS = [
  { value: "22", text: "autos en pista: 11 equipos con 2 pilotos cada uno" },
  { value: "3", text: "momentos clave por fin de semana: prácticas, clasificación y carrera" },
  { value: "10", text: "pilotos suman puntos en cada carrera; gana el campeonato quien más junta" },
  { value: "20+", text: "carreras por temporada, en circuitos de todo el mundo" },
];

const GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

const FUNNEL = [
  { label: "Q1", minutes: 18, cars: 22, out: 6 },
  { label: "Q2", minutes: 15, cars: 16, out: 6 },
  { label: "Q3", minutes: 12, cars: 10, out: 0 },
];

const TYRES = [
  { name: "Blando", color: "#ef4444", text: "El más rápido, pero se gasta enseguida. Ideal para una vuelta rápida o para arrancar con ritmo." },
  { name: "Medio", color: "#facc15", text: "El equilibrio: bastante rápido y dura bastante. Es el más usado." },
  { name: "Duro", color: "#f8fafc", text: "El más lento, pero el que más aguanta. Sirve para tandas largas." },
  { name: "Intermedio", color: "#22c55e", text: "Para pista mojada, con poca agua. Tiene dibujo para evacuarla." },
  { name: "Lluvia", color: "#3b82f6", text: "Para lluvia fuerte. Es el que más agua saca, y el más lento sobre pista seca." },
];

const FLAGS = [
  {
    name: "Amarilla",
    background: "#facc15",
    text: "Hay peligro adelante (un auto detenido, un accidente). En esa zona hay que bajar la velocidad y no se puede adelantar.",
  },
  {
    name: "Doble amarilla",
    background: "linear-gradient(to bottom, #facc15 0 45%, transparent 45% 55%, #facc15 55% 100%)",
    text: "Peligro más serio: hay que estar listo para frenar o incluso detenerse.",
  },
  {
    name: "Verde",
    background: "#22c55e",
    text: "Se terminó el peligro: se puede volver al ritmo normal.",
  },
  {
    name: "Azul",
    background: "#3b82f6",
    text: "Se le muestra a un piloto al que está por doblar un auto más rápido: tiene que dejarlo pasar sin pelear.",
  },
  {
    name: "Roja",
    background: "#ef4444",
    text: "Se suspende la carrera o la sesión. Todos entran a boxes hasta que la pista esté lista. Mirá la sección de safety car.",
  },
  {
    name: "Blanca",
    background: "#f8fafc",
    text: "Hay un vehículo lento en pista (por ejemplo, un auto de rescate). Precaución.",
  },
  {
    name: "Negra",
    background: "#0a0a0a",
    text: "Descalificación: el piloto tiene que entrar a boxes y abandona la carrera.",
  },
  {
    name: "Blanca y negra",
    background: "linear-gradient(135deg, #f8fafc 50%, #0a0a0a 50%)",
    text: "Advertencia por conducta antideportiva. Si se repite, puede llegar una sanción.",
  },
  {
    name: "Negra con círculo naranja",
    background: "radial-gradient(circle at center, #f97316 0 28%, #0a0a0a 30%)",
    text: "El auto tiene un problema mecánico que puede ser peligroso: tiene que entrar a boxes.",
  },
  {
    name: "Amarilla con rayas rojas",
    background: "repeating-linear-gradient(90deg, #facc15 0 8px, #ef4444 8px 16px)",
    text: "La pista está resbaladiza (aceite, agua o restos).",
  },
  {
    name: "A cuadros",
    background: "conic-gradient(#f8fafc 25%, #0a0a0a 0 50%, #f8fafc 0 75%, #0a0a0a 0) 0 0 / 14px 14px",
    text: "Terminó la sesión o la carrera.",
  },
];

const GLOSSARY = [
  { term: "Pole position", text: "Salir primero en la grilla, por haber hecho el mejor tiempo en la clasificación." },
  { term: "Grilla", text: "El orden de largada de la carrera." },
  { term: "Boxes (pit lane)", text: "La calle paralela a la pista donde cada equipo tiene su garaje y hace las paradas." },
  { term: "Parada en boxes", text: "Cuando el piloto entra para cambiar neumáticos (a veces, también para reparar algo). Dura unos segundos." },
  { term: "Estrategia", text: "El plan de cuántas paradas hacer y con qué neumáticos." },
  { term: "Undercut", text: "Parar antes que el rival para salir con neumáticos nuevos, ir más rápido y pasarlo cuando él pare." },
  { term: "Doblado", text: "Un piloto al que el líder le sacó una vuelta de ventaja." },
  { term: "Degradación", text: "Lo que se gasta el neumático: cuanto más se usa, menos agarre tiene." },
  { term: "DNF / DNS / DSQ", text: "No terminó (abandonó), no largó o fue descalificado." },
  { term: "Relargada", text: "El momento en que se reanuda la carrera después de una safety car o una bandera roja." },
  { term: "Parc fermé", text: "Régimen que prohíbe a los equipos tocar el auto casi por completo entre la clasificación y la carrera." },
  { term: "Paddock", text: "La zona de equipos, donde está todo el movimiento detrás de escena del fin de semana." },
  { term: "Podio", text: "Los tres primeros de la carrera, que suben al escenario a recibir los trofeos." },
  { term: "Stint", text: "Cada tramo de la carrera entre dos paradas." },
];

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <h2 className="flex items-center gap-3 text-2xl font-bold uppercase">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Q({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-bold uppercase tracking-wide">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-foreground/85">{children}</p>;
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">
      <span className="font-bold uppercase tracking-wide text-primary">Para recordar: </span>
      {children}
    </div>
  );
}

function More({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border bg-background/40 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

function PointsList({ points }: { points: number[] }) {
  const max = points[0] ?? 1;
  return (
    <ol className="space-y-1.5">
      {points.map((value, index) => (
        <li key={index} className="flex items-center gap-3 text-sm">
          <span className="w-8 text-right font-semibold tabular-nums text-muted-foreground">{index + 1}.º</span>
          <AnimatedBar percent={Math.round((value / max) * 100)} className="h-2 flex-1" />
          <span className="w-8 text-right font-display text-base font-bold tabular-nums">{value}</span>
        </li>
      ))}
    </ol>
  );
}

function DayCard({ title, days }: { title: string; days: { day: string; items: string }[] }) {
  return (
    <div className="rounded-xl border bg-background/40 p-4">
      <h3 className="mb-3 text-base font-bold uppercase tracking-wide text-primary">{title}</h3>
      <ul className="space-y-2 text-sm">
        {days.map((item) => (
          <li key={item.day} className="flex gap-3">
            <span className="w-20 shrink-0 font-semibold">{item.day}</span>
            <span className="text-foreground/85">{item.items}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LINK_PRIMARY =
  "inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95";
const LINK_OUTLINE =
  "inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:bg-accent/40 active:scale-95";

export function GuidePage() {
  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-hero p-6 md:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <BookOpen className="h-4 w-4" /> Guía para principiantes
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase italic leading-none md:text-6xl">
          La F1, explicada desde cero
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Qué pasa en un fin de semana de carrera, cómo se reparten los puntos, qué significa cada bandera y para qué
          sirven las alas del auto. Sin dar nada por sabido.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/calendario" className={LINK_PRIMARY}>
            Ver el calendario
          </Link>
          <Link to="/campeonato" className={LINK_OUTLINE}>
            Ver el campeonato
          </Link>
          <Link to="/quiz" className={LINK_OUTLINE}>
            Poné a prueba lo que sabés
          </Link>
        </div>
      </header>

      <section aria-label="La F1 en 60 segundos">
        <h2 className="mb-3 text-2xl font-bold uppercase">En 60 segundos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.value} className="rounded-2xl border bg-card p-4">
              <p className="font-display text-4xl font-bold leading-none text-primary">{fact.value}</p>
              <p className="mt-2 text-sm text-foreground/85">{fact.text}</p>
            </div>
          ))}
        </div>
      </section>

      <nav
        aria-label="Índice de la guía"
        className="sticky top-[3.5rem] z-10 -mx-4 flex gap-2 overflow-x-auto border-b bg-background/85 px-4 py-2 backdrop-blur md:top-0 md:mx-0 md:rounded-xl md:border md:px-3"
      >
        {TOC.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            className="shrink-0 rounded-full border bg-card px-3 py-1 text-sm font-semibold transition-all hover:border-primary/60 hover:text-primary active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <Section id="basico" icon={Flag} title="Lo básico">
        <Q>¿Qué es la Fórmula 1?</Q>
        <P>
          Es el campeonato mundial de automovilismo con los autos más avanzados del mundo: monoplazas, o sea, autos de un
          solo asiento y con las ruedas descubiertas. Cada carrera se llama <b>Gran Premio</b> y se corre en un circuito
          de un país distinto, entre marzo y diciembre.
        </P>
        <Q>¿Quiénes compiten?</Q>
        <P>
          Hay <b>11 equipos</b> (también llamados constructores) y cada uno presenta <b>2 autos con 2 pilotos</b>. En
          total, 22 autos en la pista. Los equipos y los pilotos cambian de una temporada a otra: en la sección{" "}
          <Link to="/campeonato" className="font-semibold text-primary hover:underline">
            Campeonato
          </Link>{" "}
          de PitWall ves siempre los de este año.
        </P>
        <Q>¿Cuántos campeonatos hay?</Q>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Campeonato de pilotos</p>
            <p className="mt-1 text-sm text-foreground/85">
              Cada piloto suma sus puntos personales. Quien tiene más al final del año es el campeón del mundo.
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Campeonato de constructores</p>
            <p className="mt-1 text-sm text-foreground/85">
              Cada equipo suma los puntos de sus dos pilotos. El que más junta se lleva el título de equipos.
            </p>
          </div>
        </div>
      </Section>

      <Section id="fin-de-semana" icon={Timer} title="Un fin de semana de carrera">
        <P>
          Una carrera no es solo el domingo: se reparte en tres días. Hay dos formatos. El normal es el más común, y el
          formato sprint se usa solo en algunos fines de semana del año (seis por temporada).
        </P>
        <div className="grid gap-3 md:grid-cols-2">
          <DayCard
            title="Formato normal"
            days={[
              { day: "Viernes", items: "Práctica 1 y Práctica 2" },
              { day: "Sábado", items: "Práctica 3 y Clasificación" },
              { day: "Domingo", items: "Carrera" },
            ]}
          />
          <DayCard
            title="Formato sprint"
            days={[
              { day: "Viernes", items: "Práctica 1 y Clasificación sprint" },
              { day: "Sábado", items: "Carrera sprint y Clasificación" },
              { day: "Domingo", items: "Carrera" },
            ]}
          />
        </div>
        <Tip>
          Los horarios dependen del país donde se corre. En PitWall los ves siempre en tu zona horaria, en el{" "}
          <Link to="/calendario" className="font-semibold text-primary hover:underline">
            Calendario
          </Link>{" "}
          y en Inicio.
        </Tip>
      </Section>

      <Section id="practicas" icon={Gauge} title="Prácticas libres">
        <Q>¿Qué es una práctica?</Q>
        <P>
          Son sesiones de una hora en las que nadie compite por puntos. Los equipos aprovechan para probar cómo anda el
          auto: ajustan las alas, la altura, los frenos y comparan los distintos neumáticos. Los pilotos, además,
          aprenden el circuito.
        </P>
        <Q>¿Por qué hay tres?</Q>
        <P>
          Porque el auto se va ajustando de a poco. La <b>Práctica 1</b> sirve para tomar contacto con la pista y probar
          piezas nuevas. La <b>Práctica 2</b> suele hacerse a una hora parecida a la de la carrera, así que los equipos
          simulan tandas largas para ver cómo se gastan los neumáticos. La <b>Práctica 3</b> es el último retoque antes de
          la clasificación. En los fines de semana sprint hay una sola práctica, porque el auto tiene que estar listo
          mucho antes.
        </P>
        <Tip>
          Los tiempos de las prácticas engañan: cada equipo prueba cosas distintas, con más o menos combustible. No son
          una predicción confiable de quién va a ganar.
        </Tip>
      </Section>

      <Section id="clasificacion" icon={Timer} title="Clasificación">
        <Q>¿Qué es la clasificación?</Q>
        <P>
          Es la sesión del sábado que decide el <b>orden de largada</b> de la carrera. Cada piloto intenta dar la vuelta
          más rápida posible, y quien hace el mejor tiempo sale primero: es la <b>pole position</b>. Salir adelante es muy
          importante porque adelantar en carrera es difícil.
        </P>
        <Q>¿Por qué hay tres (Q1, Q2 y Q3)?</Q>
        <P>
          Porque es una eliminatoria: a medida que avanza, la pista queda más libre y quedan menos autos. Con 22 autos:
        </P>
        <ol className="space-y-3">
          {FUNNEL.map((step) => (
            <li key={step.label} className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {step.label} · {step.minutes} min
                </span>
                <span className="text-muted-foreground">
                  {step.cars} autos
                  {step.out > 0 ? ` · quedan afuera los ${step.out} más lentos` : " · pelean por la pole"}
                </span>
              </div>
              <AnimatedBar percent={Math.round((step.cars / 22) * 100)} className="h-3" />
            </li>
          ))}
        </ol>
        <P>
          Los que quedan eliminados en Q1 y Q2 largan en las últimas posiciones, en el orden de sus mejores tiempos. Los
          diez que llegan a Q3 se reparten los primeros diez lugares de la grilla.
        </P>
        <Tip>
          La grilla final también puede cambiar por penalizaciones (por ejemplo, por cambiar piezas del motor más veces de
          las permitidas).
        </Tip>
      </Section>

      <Section id="sprint" icon={Flag} title="Sprint">
        <Q>¿Qué es una carrera sprint?</Q>
        <P>
          Es una carrera corta, de unos 100 kilómetros (alrededor de media hora), que se corre el sábado en algunos fines
          de semana del año. No hay parada en boxes obligatoria: es todo velocidad, de principio a fin.
        </P>
        <Q>¿Cómo se define la grilla?</Q>
        <P>
          La grilla del sprint sale de la <b>clasificación sprint</b> (también en tres partes, pero más cortas: 12, 10 y 8
          minutos). La grilla de la carrera del domingo, en cambio, sale de la clasificación normal del sábado. El
          resultado del sprint no cambia la largada del domingo.
        </P>
        <Q>¿Cómo son los puntos del sprint?</Q>
        <P>Puntúan los 8 primeros, y el reparto es más chico que el de la carrera grande:</P>
        <PointsList points={SPRINT_POINTS} />
      </Section>

      <Section id="carrera" icon={Flag} title="La carrera">
        <Q>¿Cómo funciona?</Q>
        <P>
          Los autos largan parados desde la grilla, cuando se apagan las cinco luces rojas. Se da la cantidad de vueltas
          necesaria para recorrer unos <b>305 kilómetros</b> (menos en Mónaco, que es un circuito muy corto y lento), con
          un límite de dos horas. Gana quien completa la distancia primero.
        </P>
        <Q>¿Y las paradas en boxes?</Q>
        <P>
          Durante la carrera, los pilotos entran a boxes a cambiar los neumáticos. La parada completa dura pocos
          segundos, pero pasar por la calle de boxes también cuesta tiempo. Hay una regla importante: en una carrera
          seca, hay que usar <b>al menos dos tipos de neumáticos secos distintos</b>. Por eso casi todos paran al menos
          una vez.
        </P>
        <More title="¿Y la vuelta rápida?">
          <P>
            Es la vuelta más veloz de toda la carrera. Hasta 2024 daba un punto extra, pero <b>desde 2025 ya no suma
            puntos</b>: queda solo como récord personal.
          </P>
        </More>
        <More title="¿Qué pasa si la carrera no se puede terminar?">
          <P>
            Si se suspende antes de completarse, se reparten menos puntos según cuánta carrera se llegó a correr. Si se
            hicieron muy pocas vueltas, no se reparten.
          </P>
        </More>
      </Section>

      <Section id="puntos" icon={Trophy} title="Puntos y campeonato">
        <Q>¿Cómo se suman los puntos?</Q>
        <P>
          En cada carrera, los <b>10 primeros</b> suman puntos. El ganador se lleva 25 y el reparto va bajando hasta 1
          para el décimo:
        </P>
        <PointsList points={GP_POINTS} />
        <P>
          Los puntos de la carrera (y los del sprint, cuando hay) se acumulan durante todo el año. El campeón de pilotos
          es quien tiene más al final. Si dos pilotos terminan empatados, gana el que tiene más victorias; si siguen
          igualados, se mira la cantidad de segundos puestos, y así sucesivamente.
        </P>
        <Tip>
          En el campeonato de constructores se suman los puntos de los dos pilotos del equipo. Por eso, tener dos buenos
          pilotos importa tanto como tener uno excelente.
        </Tip>
        <P>
          Querés ponerte a prueba? En PitWall podés{" "}
          <Link to="/predicciones" className="font-semibold text-primary hover:underline">
            predecir el top 10
          </Link>{" "}
          de cada carrera y sumar puntos contra tus amigos.
        </P>
      </Section>

      <Section id="neumaticos" icon={CircleDot} title="Neumáticos">
        <P>
          Todos los equipos usan neumáticos de una misma marca, Pirelli. Cada tipo se reconoce por el color de la franja
          en su lateral, y cuanto más blando es, más agarre da pero menos dura.
        </P>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TYRES.map((tyre) => (
            <li key={tyre.name} className="flex items-start gap-3 rounded-xl border bg-background/40 p-3">
              <span
                aria-hidden
                className="mt-0.5 inline-block h-8 w-8 shrink-0 rounded-full border-4 border-black"
                style={{ boxShadow: `inset 0 0 0 3px ${tyre.color}` }}
              />
              <div>
                <p className="font-semibold">{tyre.name}</p>
                <p className="text-sm text-foreground/85">{tyre.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <Tip>
          Gran parte de la estrategia es elegir cuándo parar y con qué neumático salir: un neumático nuevo vale más
          velocidad, pero pararse cuesta tiempo.
        </Tip>
      </Section>

      <Section id="banderas" icon={Flag} title="Banderas">
        <P>
          Las banderas son la forma en que la dirección de carrera se comunica con los pilotos. Además de agitarlas los
          comisarios, hoy también se avisan con luces en la pista y con las luces del volante.
        </P>
        <ul className="grid gap-4 md:grid-cols-2">
          {FLAGS.map((flag) => (
            <li key={flag.name} className="flex gap-3">
              <span
                aria-hidden
                className="mt-0.5 h-9 w-14 shrink-0 rounded-md border"
                style={{ background: flag.background }}
              />
              <div>
                <p className="font-semibold">{flag.name}</p>
                <p className="text-sm text-foreground/85">{flag.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="safety-car" icon={ShieldAlert} title="Safety car, safety car virtual y bandera roja">
        <P>
          Cuando hay un accidente o peligro en la pista, la carrera se neutraliza. Hay tres niveles, de menos a más
          serio:
        </P>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Safety car virtual (VSC)</p>
            <p className="mt-1 text-sm text-foreground/85">
              No sale ningún auto a la pista. Los pilotos deben ir mucho más lento, respetando un tiempo mínimo que ven en
              el volante, y no pueden adelantar. Las diferencias entre ellos se mantienen. Se usa para peligros chicos,
              como un auto detenido a un costado.
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Safety car (SC)</p>
            <p className="mt-1 text-sm text-foreground/85">
              Sale a la pista un auto de seguridad, y todos lo siguen en fila, a ritmo lento y sin adelantar. Los autos se
              juntan, así que se pierden las ventajas que había. Los boxes están abiertos, y los doblados pueden ponerse
              al día. Cuando el peligro pasa, el auto de seguridad se retira y hay una relargada.
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Bandera roja</p>
            <p className="mt-1 text-sm text-foreground/85">
              La carrera se detiene por completo. Todos entran a boxes y esperan, y los equipos pueden reparar y cambiar
              neumáticos libremente. Se usa para accidentes graves, pista dañada o lluvia muy fuerte. La carrera se
              retoma con una nueva largada.
            </p>
          </div>
        </div>
        <Tip>
          La diferencia clave entre VSC y safety car: en el VSC nadie sale a la pista y las diferencias se mantienen; con
          el safety car, el pelotón se junta detrás del auto de seguridad. Esto puede cambiar totalmente una carrera:
          parar en boxes con safety car cuesta mucho menos tiempo.
        </Tip>
      </Section>

      <Section id="auto" icon={Wind} title="El auto: aerodinámica y motor">
        <Q>La idea central: el auto se «pega» al piso</Q>
        <P>
          Un auto de F1 funciona como un avión, pero al revés: en lugar de levantarlo, el aire lo <b>empuja contra el
          asfalto</b>. Esa fuerza se llama <b>carga aerodinámica</b>, y es lo que permite tomar las curvas a velocidades
          enormes. El costo es la <b>resistencia al avance</b>: cuanta más carga, más freno le hace el aire en las rectas.
          Casi todo el diseño de un F1 busca el mejor equilibrio entre las dos cosas.
        </P>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Alerón delantero</p>
            <p className="mt-1 text-sm text-foreground/85">
              Es lo primero que toca el aire. Da carga a las ruedas delanteras (para que el auto gire con precisión) y
              además ordena el aire que va hacia el resto del auto: ruedas, piso y alerón trasero. Si se rompe, todo el
              auto pierde equilibrio.
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Alerón trasero</p>
            <p className="mt-1 text-sm text-foreground/85">
              Da carga a las ruedas traseras: estabilidad en curva y tracción al acelerar. Es la pieza que más resistencia
              al aire genera, así que los equipos eligen entre más carga (para circuitos con muchas curvas) o menos
              resistencia (para circuitos con rectas largas).
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Piso y difusor</p>
            <p className="mt-1 text-sm text-foreground/85">
              Gran parte de la carga viene de abajo: el piso tiene túneles que aceleran el aire y «chupan» el auto contra
              el asfalto (el llamado efecto suelo). El difusor, atrás, ayuda a sacar ese aire de forma ordenada.
            </p>
          </div>
          <div className="rounded-xl border bg-background/40 p-4">
            <p className="font-bold uppercase tracking-wide text-primary">Halo</p>
            <p className="mt-1 text-sm text-foreground/85">
              La estructura curva de titanio sobre la cabina. Protege la cabeza del piloto de golpes y de objetos que
              puedan llegar a la cabina.
            </p>
          </div>
        </div>

        <Q>Lo nuevo de 2026</Q>
        <P>
          Este año cambiaron las reglas del auto casi por completo. Los autos son más chicos y más livianos (el peso
          mínimo bajó a 768 kg), y hay tres novedades importantes:
        </P>
        <ul className="space-y-2 text-[15px] leading-relaxed text-foreground/85">
          <li>
            <b>Adiós al DRS.</b> El alerón trasero que se abría para facilitar los adelantamientos desapareció.
          </li>
          <li>
            <b>Alerones activos.</b> Los alerones delantero y trasero se mueven. En <b>modo curva</b> dan toda la carga; en
            <b> modo recta</b> se abren para bajar la resistencia y ganar velocidad punta, en las zonas de cada circuito
            donde está permitido.
          </li>
          <li>
            <b>Modo adelantamiento.</b> Un piloto que llega a menos de un segundo del auto de adelante puede usar un extra
            de potencia eléctrica para intentar el pase.
          </li>
        </ul>
        <More title="¿Cómo es el motor?">
          <P>
            Sigue siendo un motor V6 turbo de 1,6 litros combinado con un motor eléctrico, pero ahora la potencia se
            reparte casi mitad y mitad entre los dos (antes era mucho más a favor del motor a nafta). Además, el
            combustible es 100% sostenible. La batería se recarga con la energía que se recupera al frenar.
          </P>
        </More>
      </Section>

      <Section id="reglas" icon={ShieldAlert} title="Reglas y penalizaciones">
        <P>
          Los comisarios (llamados stewards) revisan los incidentes durante todo el fin de semana. Si un piloto hizo algo
          indebido, las sanciones más comunes son:
        </P>
        <ul className="space-y-2 text-[15px] leading-relaxed text-foreground/85">
          <li>
            <b>Penalización de tiempo (5 o 10 segundos):</b> se cumple en la parada en boxes o se suma al tiempo final.
          </li>
          <li>
            <b>Pasada por boxes (drive-through) o parada con espera (stop-and-go):</b> el piloto tiene que entrar a boxes
            y perder tiempo antes de seguir.
          </li>
          <li>
            <b>Penalización en la grilla:</b> el piloto retrocede lugares en la largada de la siguiente carrera.
          </li>
          <li>
            <b>Puntos en la superlicencia:</b> cada infracción grave suma puntos al piloto; si junta demasiados, queda
            suspendido una carrera.
          </li>
        </ul>
        <More title="¿Qué son los límites de pista?">
          <P>
            Las líneas blancas que marcan el borde del asfalto. Si un piloto se pasa con las cuatro ruedas, está ganando
            ventaja de forma ilegal, y recibe advertencias y, si insiste, una penalización.
          </P>
        </More>
        <More title="¿Qué es el parc fermé?">
          <P>
            Desde que empieza la clasificación, los equipos casi no pueden tocar los autos, para que no los reformen
            entre el sábado y la carrera. Solo se permiten arreglos y ajustes muy limitados.
          </P>
        </More>
      </Section>

      <Section id="glosario" icon={BookOpen} title="Glosario rápido">
        <dl className="grid gap-3 md:grid-cols-2">
          {GLOSSARY.map((item) => (
            <div key={item.term} className="rounded-xl border bg-background/40 p-3">
              <dt className="font-semibold text-primary">{item.term}</dt>
              <dd className="mt-0.5 text-sm text-foreground/85">{item.text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="rounded-2xl border bg-hero p-6 text-center md:p-8">
        <h2 className="font-display text-3xl font-bold uppercase md:text-4xl">¿Listo para seguir la temporada?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Ya sabés lo básico. Ahora mirá cómo viene el campeonato, armá tu predicción o jugá al circuito del día.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/calendario" className={LINK_PRIMARY}>
            Ver el calendario
          </Link>
          <Link to="/predicciones" className={LINK_OUTLINE}>
            Armar mi predicción
          </Link>
          <Link to="/juego" className={cn(LINK_OUTLINE)}>
            Jugar al circuito del día
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Esta guía resume el reglamento de la temporada 2026. Las reglas pueden cambiar de un año a otro.
        </p>
      </section>
    </div>
  );
}