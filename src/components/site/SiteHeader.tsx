import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { LanguageSwitch, useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useI18n();

  const links = [
    { to: "/", label: t("Home", "الرئيسية") },
    { to: "/services", label: t("Services", "الخدمات") },
    { to: "/partners", label: t("Partners", "الشركاء") },
    { to: "/contact", label: t("Contact", "تواصل") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Red Star Services" className="h-12 w-auto object-contain" />
          <div className="leading-tight hidden sm:block">
            <div className="font-semibold text-foreground text-base tracking-tight">
              {t("Red Star Services", "النجم الأحمر للخدمات")}
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Government · Business · AI", "حكومي · أعمال · ذكاء اصطناعي")}
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="nav-link text-sm font-medium text-foreground"
              data-active={pathname === l.to ? "true" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <a
            href="https://wa.me/971553313325"
            target="_blank" rel="noreferrer"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--primary-foreground)] px-4 py-2 text-sm font-semibold hover:bg-[color:var(--brand-red)] transition"
          >
            <MessageCircle className="h-4 w-4" /> {t("WhatsApp Us", "واتساب")}
          </a>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-foreground border-b border-border last:border-0"
                data-active={pathname === l.to ? "true" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3">
              <LanguageSwitch />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
