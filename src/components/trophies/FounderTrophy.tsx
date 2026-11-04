import { useId } from "react";

interface FounderTrophyProps {
  year?: number | undefined;
  caption?: string | undefined;
  className?: string | undefined;
}

// Copa del Fundador: el trofeo de la edición inaugural (2026).
// Los ids de los degradados llevan un prefijo único para que varios trofeos en la misma pantalla no se pisen.
export function FounderTrophy({ year = 2026, caption = "EDICIÓN INAUGURAL", className }: FounderTrophyProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 300 420"
      className={className}
      role="img"
      aria-label={`Copa ${year}`}
    >
      <title>{`Copa ${year}`}</title>
      <defs>
        <radialGradient id={id("glow")} gradientUnits="userSpaceOnUse" cx="150" cy="175" r="148">
          <stop offset="0" stopColor="#ffd666" stopOpacity="0.30"/>
          <stop offset="0.55" stopColor="#ffb020" stopOpacity="0.08"/>
          <stop offset="1" stopColor="#ffb020" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={id("goldH")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5e3f06"/>
          <stop offset="0.14" stopColor="#b88418"/>
          <stop offset="0.30" stopColor="#ffe38a"/>
          <stop offset="0.44" stopColor="#f3c94a"/>
          <stop offset="0.62" stopColor="#c8951b"/>
          <stop offset="0.82" stopColor="#8a5c0c"/>
          <stop offset="1" stopColor="#4a3004"/>
        </linearGradient>
        <linearGradient id={id("goldV")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2b0"/>
          <stop offset="0.5" stopColor="#e2b232"/>
          <stop offset="1" stopColor="#8a5c0c"/>
        </linearGradient>
        <linearGradient id={id("onyx")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a43"/>
          <stop offset="0.35" stopColor="#1c1c22"/>
          <stop offset="1" stopColor="#0a0a0d"/>
        </linearGradient>
        <radialGradient id={id("cupInside")} cx="50%" cy="30%" r="75%">
          <stop offset="0" stopColor="#140b01"/>
          <stop offset="0.6" stopColor="#5b3c07"/>
          <stop offset="1" stopColor="#b8861b"/>
        </radialGradient>
        <linearGradient id={id("redEnamel")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4a3d"/>
          <stop offset="1" stopColor="#a30800"/>
        </linearGradient>
        <linearGradient id={id("star")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffbe0"/>
          <stop offset="0.45" stopColor="#ffd24d"/>
          <stop offset="1" stopColor="#c58a14"/>
        </linearGradient>
        <pattern id={id("check")} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#0b0b0e"/>
          <rect width="4" height="4" fill="#e9bb3a"/>
          <rect x="4" y="4" width="4" height="4" fill="#e9bb3a"/>
        </pattern>
        <clipPath id={id("bowlClip")}>
          <path d="M84 96 C84 168 116 214 138 232 L162 232 C184 214 216 168 216 96 Z"/>
        </clipPath>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4"/>
        </filter>
        <filter id={id("blur4")} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
        <filter id={id("halo")} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <path id={id("spark")} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"/>
      </defs>

      {/* Resplandor de fondo */}
      <rect width="300" height="420" fill={ref("glow")}/>

      {/* Sombra en el piso */}
      <ellipse cx="150" cy="404" rx="112" ry="9" fill="#000" opacity="0.6" filter={ref("blur4")}/>

      {/* Base de ónix */}
      <rect x="40" y="370" width="220" height="32" rx="4" fill={ref("onyx")} stroke="#b8861b" strokeWidth="1"/>
      <rect x="40" y="381" width="220" height="4" fill={ref("redEnamel")}/>
      <rect x="40" y="380" width="220" height="1" fill="#f3c94a"/>
      <rect x="40" y="385" width="220" height="1" fill="#f3c94a"/>
      <text className="font-display" x="150" y="396" textAnchor="middle" fontFamily="'Barlow Condensed','Arial Narrow',Arial,sans-serif" fontSize="7.5" fontWeight="700" letterSpacing="2.6" fill="#e2b232">{caption}</text>

      <rect x="66" y="330" width="168" height="42" rx="3" fill={ref("onyx")} stroke="#b8861b" strokeWidth="1"/>
      <rect x="66" y="330" width="168" height="1.6" fill="#fff2b0" opacity="0.85"/>
      <rect x="74" y="336" width="152" height="8" fill={ref("check")} stroke="#b8861b" strokeWidth="0.8"/>
      <rect x="98" y="349" width="104" height="17" rx="2" fill={ref("goldH")} stroke="#fff2b0" strokeWidth="0.6"/>
      <text className="font-display" x="150" y="362.2" textAnchor="middle" fontFamily="'Barlow Condensed','Arial Narrow',Arial,sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="3" fill="#2a1a02">{year}</text>

      {/* Pie y tallo */}
      <path d="M106 330 C128 326 138 318 141 304 L159 304 C162 318 172 326 194 330 Z" fill={ref("goldH")}/>
      <path d="M106 330 C128 326 138 318 141 304" fill="none" stroke="#fff2b0" strokeWidth="0.8" opacity="0.7"/>
      <ellipse cx="150" cy="300" rx="21" ry="6" fill={ref("goldH")} stroke="#fff2b0" strokeWidth="0.6"/>
      <rect x="141" y="236" width="18" height="66" fill={ref("goldH")}/>

      {/* Neumático */}
      <ellipse cx="150" cy="266" rx="29" ry="9.5" fill="#101013" stroke={ref("goldV")} strokeWidth="3"/>
      <ellipse cx="150" cy="266" rx="22" ry="6.2" fill="none" stroke="#3b3b44" strokeWidth="4" strokeDasharray="2.6 2.6"/>
      <ellipse cx="150" cy="265" rx="11" ry="3.2" fill={ref("goldV")}/>

      {/* Base del cáliz */}
      <ellipse cx="150" cy="233" rx="17" ry="5" fill={ref("goldV")}/>

      {/* Asas en forma de ala */}
      <g>
        <path d="M214 102 C282 90 298 170 190 206 L192 190 C268 168 262 114 213 119 Z" fill={ref("goldH")} stroke="#4a3004" strokeWidth="0.8"/>
        <path d="M216 104 C278 94 292 166 196 200" fill="none" stroke="#fff6c4" strokeWidth="1.3" opacity="0.75"/>
      </g>
      <g transform="translate(300 0) scale(-1 1)">
        <path d="M214 102 C282 90 298 170 190 206 L192 190 C268 168 262 114 213 119 Z" fill={ref("goldH")} stroke="#4a3004" strokeWidth="0.8"/>
        <path d="M216 104 C278 94 292 166 196 200" fill="none" stroke="#fff6c4" strokeWidth="1.3" opacity="0.75"/>
      </g>

      {/* Copa */}
      <path d="M84 96 C84 168 116 214 138 232 L162 232 C184 214 216 168 216 96 Z" fill={ref("goldH")}/>
      <g clipPath={ref("bowlClip")}>
        {/* Circuito grabado */}
        <path d="M112 168 L112 150 C112 140 120 136 128 138 L146 144 C152 146 156 142 154 136 C152 130 158 126 166 128 L180 132 C190 135 192 146 184 152 L168 164 C162 169 164 174 170 174 L176 174 C182 174 184 178 178 180 L120 180 C114 180 112 176 112 168 Z"
              fill="none" stroke="#fff0a0" strokeWidth="1.2" opacity="0.6" transform="translate(0.9 0.9)"/>
        <path d="M112 168 L112 150 C112 140 120 136 128 138 L146 144 C152 146 156 142 154 136 C152 130 158 126 166 128 L180 132 C190 135 192 146 184 152 L168 164 C162 169 164 174 170 174 L176 174 C182 174 184 178 178 180 L120 180 C114 180 112 176 112 168 Z"
              fill="none" stroke="#5b3b07" strokeWidth="3.2" strokeLinejoin="round"/>
        <circle cx="112" cy="160" r="3.4" fill={ref("redEnamel")} stroke="#fff2b0" strokeWidth="0.7"/>
        {/* Brillos */}
        <path d="M97 110 C97 152 112 190 134 222" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.5" filter={ref("soft")}/>
        <path d="M205 114 C205 150 196 178 184 202" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.2" filter={ref("soft")}/>
      </g>

      {/* Remaches */}
      <g>
        <circle cx="214" cy="110" r="3.6" fill={ref("goldV")} stroke="#4a3004" strokeWidth="0.6"/>
        <circle cx="190" cy="198" r="3.4" fill={ref("goldV")} stroke="#4a3004" strokeWidth="0.6"/>
        <circle cx="86" cy="110" r="3.6" fill={ref("goldV")} stroke="#4a3004" strokeWidth="0.6"/>
        <circle cx="110" cy="198" r="3.4" fill={ref("goldV")} stroke="#4a3004" strokeWidth="0.6"/>
      </g>

      {/* Borde y boca de la copa */}
      <ellipse cx="150" cy="96" rx="66" ry="13" fill={ref("cupInside")} stroke={ref("goldV")} strokeWidth="4"/>
      <ellipse cx="150" cy="96" rx="66" ry="13" fill="none" stroke="#fffbe0" strokeWidth="0.9" opacity="0.8"/>
      <ellipse cx="150" cy="99" rx="52" ry="8" fill="none" stroke="#f3c94a" strokeWidth="0.8" opacity="0.35"/>

      {/* Estrella flotante */}
      <circle className="trophy-halo" cx="150" cy="50" r="22" fill="#ffd24d" opacity="0.55" filter={ref("halo")}/>
      <polygon points="150,33 154.4,43.9 166.2,44.8 157.1,52.3 160,63.8 150,57.5 140,63.8 142.9,52.3 133.8,44.8 145.6,43.9"
               fill={ref("star")} stroke="#fff6c4" strokeWidth="0.8" strokeLinejoin="round"/>

      {/* Destellos */}
      <use className="trophy-sparkle" style={{ animationDelay: "0s" }} href={`#${id("spark")}`} x="96" y="62" fill="#fff7c8" opacity="0.9"/>
      <use className="trophy-sparkle" style={{ animationDelay: "0.9s" }} href={`#${id("spark")}`} x="206" y="76" fill="#fff7c8" opacity="0.8" transform="translate(206 76) scale(0.7) translate(-206 -76)"/>
      <use className="trophy-sparkle" style={{ animationDelay: "1.7s" }} href={`#${id("spark")}`} x="120" y="26" fill="#fff7c8" opacity="0.7" transform="translate(120 26) scale(0.6) translate(-120 -26)"/>
      <use className="trophy-sparkle" style={{ animationDelay: "0.4s" }} href={`#${id("spark")}`} x="186" y="34" fill="#fff7c8" opacity="0.9" transform="translate(186 34) scale(0.85) translate(-186 -34)"/>
    </svg>
  );
}