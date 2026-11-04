import { useId } from "react";

interface ChromeTrophyProps {
  year?: number | undefined;
  caption?: string | undefined;
  className?: string | undefined;
}

// Copa escultural cromada con panel blanco y listón rojo.
// Los ids de los degradados llevan un prefijo único para que varios trofeos en la misma pantalla no se pisen.
export function ChromeTrophy({ year = 2026, caption = "EDICIÓN INAUGURAL", className }: ChromeTrophyProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="0 0 300 420"
      className={className}
      role="img"
      aria-label={`Copa del Fundador ${year}`}
    >
      <title>{`Copa del Fundador ${year}`}</title>
      <defs>
        <radialGradient id={id("glow")} gradientUnits="userSpaceOnUse" cx="150" cy="190" r="150">
          <stop offset="0" stopColor="#cfe4ff" stopOpacity="0.22"/>
          <stop offset="0.6" stopColor="#9fc2ff" stopOpacity="0.06"/>
          <stop offset="1" stopColor="#9fc2ff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={id("chromeH")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a525b"/>
          <stop offset="0.10" stopColor="#e9eef3"/>
          <stop offset="0.20" stopColor="#8a949e"/>
          <stop offset="0.32" stopColor="#ffffff"/>
          <stop offset="0.46" stopColor="#555d67"/>
          <stop offset="0.60" stopColor="#c9d1d8"/>
          <stop offset="0.74" stopColor="#ffffff"/>
          <stop offset="0.88" stopColor="#78828c"/>
          <stop offset="1" stopColor="#363d45"/>
        </linearGradient>
        <linearGradient id={id("chromeUS")} gradientUnits="userSpaceOnUse" x1="98" y1="0" x2="254" y2="0">
          <stop offset="0" stopColor="#3f464e"/>
          <stop offset="0.08" stopColor="#eef2f6"/>
          <stop offset="0.17" stopColor="#7d8791"/>
          <stop offset="0.27" stopColor="#ffffff"/>
          <stop offset="0.38" stopColor="#4a525b"/>
          <stop offset="0.50" stopColor="#d3dae0"/>
          <stop offset="0.62" stopColor="#ffffff"/>
          <stop offset="0.74" stopColor="#6a747e"/>
          <stop offset="0.86" stopColor="#f1f4f7"/>
          <stop offset="1" stopColor="#363d45"/>
        </linearGradient>
        <linearGradient id={id("chromeV")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.45" stopColor="#aeb7c0"/>
          <stop offset="0.55" stopColor="#4b535c"/>
          <stop offset="1" stopColor="#cdd4db"/>
        </linearGradient>
        <linearGradient id={id("chromeDiag")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.25" stopColor="#9aa4ae"/>
          <stop offset="0.5" stopColor="#f4f7fa"/>
          <stop offset="0.75" stopColor="#6a737d"/>
          <stop offset="1" stopColor="#d5dbe1"/>
        </linearGradient>
        <linearGradient id={id("white")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.55" stopColor="#e6eaee"/>
          <stop offset="1" stopColor="#b4bcc5"/>
        </linearGradient>
        <linearGradient id={id("red")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3b30"/>
          <stop offset="0.6" stopColor="#d50a00"/>
          <stop offset="1" stopColor="#8f0500"/>
        </linearGradient>
        <linearGradient id={id("disc")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3b42"/>
          <stop offset="1" stopColor="#050506"/>
        </linearGradient>
        <filter id={id("blur4")} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
        <clipPath id={id("panelClip")}>
          <path d="M176 306 C232 270 262 200 252 126 C250 96 244 74 236 56 C208 62 182 80 164 104 C146 130 146 172 156 214 C162 250 168 280 176 306 Z"/>
        </clipPath>
        <filter id={id("blur5")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <path id={id("spark")} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"/>
      </defs>

      <rect width="300" height="420" fill={ref("glow")}/>
      <ellipse cx="150" cy="406" rx="108" ry="8" fill="#000" opacity="0.6" filter={ref("blur4")}/>

      {/* Base */}
      <ellipse cx="150" cy="396" rx="72" ry="11" fill={ref("disc")} stroke="#44444c" strokeWidth="0.8"/>
      <path d="M94 352 L94 388 A56 8 0 0 0 206 388 L206 352 Z" fill={ref("chromeH")}/>
      <ellipse cx="150" cy="352" rx="56" ry="8" fill={ref("chromeV")} stroke="#e9eef3" strokeWidth="0.6"/>
      <rect x="116" y="361" width="68" height="25" rx="3" fill={ref("chromeDiag")} stroke="#4b535c" strokeWidth="0.8"/>
      <text className="font-display" x="150" y="375" textAnchor="middle" fontFamily="'Barlow Condensed','Arial Narrow',Arial,sans-serif" fontSize="13" fontWeight="800" letterSpacing="2.5" fill="#14181d">{year}</text>
      <text className="font-display" x="150" y="382" textAnchor="middle" fontFamily="'Barlow Condensed','Arial Narrow',Arial,sans-serif" fontSize="3.5" fontWeight="700" letterSpacing="0.9" fill="#2a3036">{caption}</text>

      {/* Panel blanco */}
      <path d="M176 306 C232 270 262 200 252 126 C250 96 244 74 236 56 C208 62 182 80 164 104 C146 130 146 172 156 214 C162 250 168 280 176 306 Z" fill={ref("white")}/>
      <path d="M236 56 C228 90 222 122 198 152" fill="none" stroke="#b4bcc5" strokeWidth="1" opacity="0.5"/>

      <g clipPath={ref("panelClip")}>
        <path d="M164 104 C146 130 146 172 156 214 C162 250 168 280 176 306" fill="none" stroke="#8d97a1" strokeWidth="16" opacity="0.38" filter={ref("blur5")}/>
        <path d="M176 306 C232 270 262 200 252 126" fill="none" stroke="#b9c1c9" strokeWidth="14" opacity="0.5" filter={ref("blur5")}/>
      </g>
      <path d="M176 306 C232 270 262 200 252 126 C250 96 244 74 236 56" fill="none" stroke={ref("chromeUS")} strokeWidth="9" strokeLinecap="round"/>
      <path d="M176 306 C232 270 262 200 252 126 C250 96 244 74 236 56" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" transform="translate(-2 0)"/>

      {/* Barriga cromada con el borde derecho */}
      <path d="M126 352 C128 322 140 298 150 272 C160 246 176 234 196 216 C224 190 246 160 252 122 C252 98 246 76 236 56 C246 82 250 100 250 124 C240 170 214 206 190 228 C170 246 164 264 164 292 C164 320 176 340 198 352 Z" fill={ref("chromeUS")} stroke="#4b535c" strokeWidth="0.6"/>
      <path d="M236 56 C246 82 250 100 250 124" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>

      {/* Listón rojo */}
      <path d="M166 106 C148 130 150 170 158 212 C164 252 164 292 172 330 C175 340 180 346 188 351" fill="none" stroke={ref("red")} strokeWidth="6" strokeLinecap="round"/>
      <path d="M170 110 C154 132 156 170 163 210" fill="none" stroke="#ff8a80" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      <path d="M178 248 C208 220 234 188 246 138" fill="none" stroke={ref("red")} strokeWidth="3" strokeLinecap="round"/>

      {/* Aleta cromada con gancho */}
      <path d="M104 352 C112 332 120 316 120 290 C118 240 96 190 100 130 C102 94 124 68 152 62 C136 74 124 92 122 120 C120 172 134 226 148 262 C156 282 160 312 152 338 L142 352 Z" fill={ref("chromeUS")} stroke="#3c434b" strokeWidth="0.8"/>
      <path d="M102 128 C100 92 124 70 150 64" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9"/>
      <path d="M116 150 C116 200 132 250 146 288" fill="none" stroke="#1a1f25" strokeWidth="2.2" strokeLinecap="round" opacity="0.45"/>

      {/* Brillos */}
      <path d="M112 140 C112 190 130 240 152 280" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" filter={ref("soft")}/>
      <use className="trophy-sparkle" style={{ animationDelay: "0s" }} href={`#${id("spark")}`} x="104" y="84" fill="#fff" opacity="0.9"/>
      <use className="trophy-sparkle" style={{ animationDelay: "1.2s" }} href={`#${id("spark")}`} x="238" y="70" fill="#fff" opacity="0.8" transform="translate(238 70) scale(0.7) translate(-238 -70)"/>
    </svg>
  );
}