import { countryName, flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountryFlag({ code, className }: { code: string; className?: string | undefined }) {
  const name = countryName(code);

  return (
    <img
      src={flagUrl(code, 40)}
      srcSet={`${flagUrl(code, 80)} 2x`}
      alt={name}
      title={name}
      loading="lazy"
      className={cn("inline-block w-auto rounded-[2px] border border-white/10", className)}
    />
  );
}