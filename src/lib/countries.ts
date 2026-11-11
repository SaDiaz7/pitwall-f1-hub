// Códigos ISO 3166-1 de dos letras.
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO " +
  "JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR " +
  "MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO " +
  "RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV " +
  "TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW";

const COUNTRY_CODES = CODES.split(" ");

// Los nombres en español los da el propio navegador.
const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["es"], { type: "region" })
  : null;

export function countryName(code: string): string {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export const COUNTRY_OPTIONS: { code: string; name: string }[] = COUNTRY_CODES.map((code) => ({
  code,
  name: countryName(code),
})).sort((a, b) => a.name.localeCompare(b.name, "es"));

// Las banderas son imágenes porque Windows no muestra los emojis de bandera.
export function flagUrl(code: string, width: 20 | 40 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

// País del idioma del navegador (por ejemplo "es-AR" → AR), si es un código válido. Solo se usa en el navegador.
export function guessCountry(): string {
  const region = navigator.language.split("-")[1]?.toUpperCase();
  return region && COUNTRY_CODES.includes(region) ? region : "";
}

// Nacionalidad guardada en los datos de la cuenta al registrarse (si es un código válido).
export function countryFromMetadata(metadata: Record<string, unknown> | undefined): string | null {
  const value = metadata?.["country"];
  return typeof value === "string" && COUNTRY_CODES.includes(value.toUpperCase()) ? value.toUpperCase() : null;
}