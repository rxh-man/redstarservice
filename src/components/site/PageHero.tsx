import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PageHero({ tag, title, subtitle, children }: { tag?: string; title: string; subtitle?: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div aria-hidden className="hero-grid absolute inset-0" />
      <div aria-hidden className="hero-glow absolute -top-24 end-[-6rem] h-80 w-80 rounded-full" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24 fade-slide">
        <nav aria-label={t("Breadcrumb", "مسار التنقل")} className="flex items-center gap-1.5 text-xs text-primary-foreground/60">
          <Link to="/" className="hover:text-primary-foreground transition">{t("Home", "الرئيسية")}</Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          <span className="text-primary-foreground/90">{title}</span>
        </nav>
        {tag && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-wider text-primary-foreground/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)]" />
            {tag}
          </div>
        )}
        <h1 className="mt-4 text-4xl md:text-6xl font-bold text-primary-foreground max-w-3xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-primary-foreground/75 text-lg leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
