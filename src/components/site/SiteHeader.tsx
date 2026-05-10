import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/partners", label: "Partners" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b-2 border-gold">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground font-bold text-lg">T</div>
          <div className="leading-tight">
            <div className="font-bold text-primary text-lg">Tahleel</div>
            <div className="arabic text-xs">تحليل</div>
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
          <a
            href="https://wa.me/971553313325"
            target="_blank" rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-whatsapp text-whatsapp-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <button
            className="md:hidden p-2 text-primary"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-card">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-foreground border-b last:border-0"
                data-active={pathname === l.to ? "true" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
