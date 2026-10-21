import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: "/" | "/inicio" }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 font-display text-2xl font-bold uppercase italic tracking-wide"
    >
      <span className="h-6 w-2 skew-x-[-15deg] rounded-sm bg-gradient-primary" />
      Pit<span className="text-primary">Wall</span>
    </Link>
  );
}
