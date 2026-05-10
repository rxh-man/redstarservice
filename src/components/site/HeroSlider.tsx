import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroBg from "@/assets/hero-bg.jpg";

type Slide = {
  tag: string;
  title: string;
  body: string;
  primary: { label: string; to: string };
  secondary: { label: string; href: string; whatsapp?: boolean };
};

const slides: Slide[] = [
  {
    tag: "Sharjah · Al Sajaa Industrial",
    title: "Multiple services under one roof",
    body: "One-stop services for all your government transactions, typing, certification, translation and attestation needs.",
    primary: { label: "Book an Appointment", to: "/contact" },
    secondary: { label: "WhatsApp Us", href: "https://wa.me/971553313325", whatsapp: true },
  },
  {
    tag: "Labour · Immigration · Typing · Licensing",
    title: "Tasheel, Tawjeeh & more in one place",
    body: "Trusted support for labour, immigration, typing, licensing and documentation across Sharjah and the UAE.",
    primary: { label: "Explore Services", to: "/services" },
    secondary: { label: "Contact Us", href: "/contact" },
  },
  {
    tag: "Documents · Attestation · Translation · Typing",
    title: "Typing & certification support",
    body: "Fast, accurate typing and processing with a multilingual team and extended centre hours — so you can focus on what matters.",
    primary: { label: "Request a Quotation", to: "/quotation" },
    secondary: { label: "Book an Appointment", href: "/contact" },
  },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);
  const prev = () => setI((p) => (p - 1 + slides.length) % slides.length);
  const next = () => setI((p) => (p + 1) % slides.length);
  const s = slides[i];

  return (
    <section
      className="relative overflow-hidden text-primary-foreground"
      style={{
        backgroundImage: `linear-gradient(135deg, oklch(0.78 0.14 85 / 0.92), oklch(0.6 0.13 70 / 0.85)), url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-36 min-h-[560px] flex items-center">
        <div key={i} className="fade-slide max-w-3xl">
          <div className="inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-medium text-gold uppercase tracking-wider">
            {s.tag}
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">{s.title}</h1>
          <p className="mt-5 text-lg md:text-xl text-primary-foreground/85 max-w-2xl">{s.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={s.primary.to}
              className="inline-flex items-center justify-center rounded-md bg-gold text-gold-foreground px-6 py-3 font-semibold hover:opacity-90 transition hover:scale-[1.03]"
            >
              {s.primary.label}
            </Link>
            <a
              href={s.secondary.href}
              target={s.secondary.whatsapp ? "_blank" : undefined}
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-semibold transition hover:scale-[1.03] ${
                s.secondary.whatsapp
                  ? "bg-whatsapp text-whatsapp-foreground"
                  : "bg-card text-primary border-2 border-card hover:bg-card/90"
              }`}
            >
              {s.secondary.whatsapp && <MessageCircle className="h-4 w-4" />}
              {s.secondary.label}
            </a>
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-card/20 hover:bg-card/30 text-primary-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-card/20 hover:bg-card/30 text-primary-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-2 bg-card/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
