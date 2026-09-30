import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, MessageCircle, Phone, ArrowRight } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { LanguageSwitch, useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { t } = useI18n();

  const links = [
    { to: "/", label: t("Home", "الرئيسية") },
    { to: "/services", label: t("Services", "الخدمات") },
    { to: "/partners", label: t("Partners", "الشركاء") },
    { to: "/quotation", label: t("Get a Quote", "طلب عرض سعر") },
    { to: "/contact", label: t("Contact", "تواصل") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={
        "sticky top-0 z-40 border-b transition-all duration-300 " +
        (scrolled || open
          ? "bg-card/95 backdrop-blur-md border-border shadow-[0_8px_24px_-16px_oklch(0.1_0_0/0.25)]"
          : "bg-card/80 backdrop-blur-md border-transparent")
      }
    >
      {/* Top info bar */}
      <div
        className={
          "hidden md:block overflow-hidden bg-[color:var(--foreground)] text-[color:var(--primary-foreground)] transition-all duration-300 " +
          (scrolled ? "max-h-0" : "max-h-10")
        }
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
          <span className="opacity-80">
            {t("Mon–Sat 8 AM – 8 PM · Friday 8–11 AM, 2–6 PM", "الاثنين–السبت 8 ص – 8 م · الجمعة 8–11 ص، 2–6 م")}
          </span>
          <a href="tel:+971553313325" className="inline-flex items-center gap-1.5 opacity-90 hover:text-[color:var(--brand-red)] transition">
            <Phone className="h-3.5 w-3.5" /> <span dir="ltr">055 331 3325</span>
          </a>
        </div>
      </div>

      <div
        className={
          "mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6 transition-all duration-300 " +
          (scrolled ? "py-2" : "py-3")
        }
      >
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Red Star Services"
            className={"w-auto object-contain transition-all duration-300 " + (scrolled ? "h-10" : "h-12")}
          />
          <div className="leading-tight hidden sm:block">
            <div className="font-semibold text-foreground text-base tracking-tight">
              {t("Red Star Services", "النجم الأحمر للخدمات")}
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("Government · Business · AI", "حكومي · أعمال · ذكاء اصطناعي")}
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label={t("Main", "الرئيسية")}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={
                "nav-link text-sm font-medium transition-colors hover:text-[color:var(--brand-red)] " +
                (pathname === l.to ? "text-[color:var(--brand-red)]" : "text-foreground")
              }
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
            className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t("Close menu", "إغلاق القائمة") : t("Open menu", "فتح القائمة")}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="menu-drop md:hidden border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={
                    "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition " +
                    (active
                      ? "bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]"
                      : "text-foreground hover:bg-secondary")
                  }
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 opacity-40 rtl:rotate-180" />
                </Link>
              );
            })}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href="tel:+971553313325"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-semibold text-foreground"
              >
                <Phone className="h-4 w-4" /> {t("Call", "اتصال")}
              </a>
              <a
                href="https://wa.me/971553313325"
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-3 py-3 text-sm font-semibold text-whatsapp-foreground"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
