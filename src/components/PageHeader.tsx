export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-4xl font-bold uppercase italic md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      <div className="mt-3 h-1 w-16 rounded-full bg-gradient-primary" />
    </header>
  );
}
