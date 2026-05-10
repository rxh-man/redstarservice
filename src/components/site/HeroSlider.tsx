import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, MapPin, ShieldCheck, Clock, Users, ArrowRight } from "lucide-react";

const tags = [
  "Tasheel · Tawjeeh · Immigration",
  "Typing · Attestation · Translation",
  "Emirates ID · Medical · Licensing",
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % tags.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-card">
      {/* subtle gold pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.74 0.14 82) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* gold side bar */}
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-gold" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 fade-slide">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-foreground uppercase">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              <span>Al Sajaa Industrial Area · Sharjah</span>
            </div>

            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.05]">
              Government services,{" "}
              <span className="text-gold">handled with care.</span>
            </h1>

            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Tahleel is a one-stop service centre for government transactions, typing,
              certification, translation and attestation across Sharjah and the UAE.
            </p>

            <div className="mt-4 h-6 overflow-hidden">
              <div
                key={i}
                className="text-sm font-medium text-gold tracking-wide fade-slide"
              >
                {tags[i]}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gold text-gold-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
              >
                Book an Appointment <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/971553313325"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-gold transition"
              >
                <MessageCircle className="h-4 w-4 text-whatsapp" />
                <span>WhatsApp 055 331 3325</span>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { n: "13+", l: "Service categories" },
                { n: "6 days", l: "Open weekly" },
                { n: "8AM–8PM", l: "Centre hours" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-gold pl-3">
                  <div className="text-xl font-bold text-foreground">{s.n}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right card — official notice style */}
          <div className="lg:col-span-5">
            <div className="relative bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="bg-gradient-gold px-6 py-4 flex items-center justify-between">
                <div className="leading-tight">
                  <div className="text-[11px] uppercase tracking-widest text-gold-foreground/80">
                    Service Centre
                  </div>
                  <div className="text-lg font-semibold text-gold-foreground">
                    Tahleel · تحليل
                  </div>
                </div>
                <ShieldCheck className="h-7 w-7 text-gold-foreground" />
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-gold/10 text-gold border border-gold/40">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Centre Timing</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Mon–Sat · 8:00 AM – 8:00 PM
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Friday · 8:00 – 11:00 AM, 2:00 – 6:00 PM
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-gold/10 text-gold border border-gold/40">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Multilingual Team</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Arabic · English · Urdu · Hindi
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-gold/10 text-gold border border-gold/40">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Visit our centre</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Al Sajaa Industrial Area, Sharjah, UAE
                    </div>
                  </div>
                </div>

                <Link
                  to="/services"
                  className="block w-full text-center rounded-md border border-gold text-gold py-2.5 text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition"
                >
                  Explore all services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
