import type { ReactNode } from "react";

export function PageHero({ tag, title, subtitle, children }: { tag?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="bg-gradient-hero text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28 fade-slide">
        {tag && <div className="inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-medium text-gold uppercase tracking-wider">{tag}</div>}
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-primary-foreground max-w-3xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-primary-foreground/85 text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
