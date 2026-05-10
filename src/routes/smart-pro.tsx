import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import {
  MessageCircle, FolderOpen, KeyRound, BarChart3, FileText, Users,
  Clock, Building, CreditCard, Bell, ShieldCheck, Zap, CheckCircle2, AlertTriangle, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/smart-pro")({
  head: () => ({
    meta: [
      { title: "Tahleel Smart PRO — Manage Company Documents" },
      { name: "description", content: "Send your documents on WhatsApp. We upload, organize, track expiry dates, and give you secure dashboard access." },
      { property: "og:title", content: "Tahleel Smart PRO" },
      { property: "og:description", content: "We manage your company documents for you. Free service." },
    ],
  }),
  component: SmartPro,
});

function CountUp({ end, duration = 1500 }: { end: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{String(val).padStart(2, "0")}</span>;
}

const steps = [
  { icon: MessageCircle, n: "01", title: "Send documents", desc: "Send your company documents to our WhatsApp number." },
  { icon: FolderOpen, n: "02", title: "We upload & organize", desc: "Tahleel team uploads and arranges everything properly." },
  { icon: KeyRound, n: "03", title: "You receive login", desc: "You get your username and password after setup." },
  { icon: BarChart3, n: "04", title: "Track online", desc: "Open your dashboard anytime and monitor everything clearly." },
];

const tiles = [
  { icon: FileText, title: "Company Documents", desc: "View trade license, tenancy, agreements, Emirates ID, and other files." },
  { icon: Users, title: "Staff Documents", desc: "Track passports, visas, Emirates IDs, work permits, and staff records." },
  { icon: Clock, title: "Expiry Tracking", desc: "See valid, expiring soon, expired, and no-expiry document statuses." },
  { icon: Building, title: "Companies & Branches", desc: "Manage multiple companies or branches in one customer dashboard." },
  { icon: CreditCard, title: "Payments", desc: "View payment requests, payment links, invoices, and upload proof." },
  { icon: Bell, title: "Notifications", desc: "Get updates when documents are requested, uploaded, or expiring." },
];

const why = [
  { icon: CheckCircle2, title: "No technical setup", desc: "You don't need to learn any software. We set it up for you." },
  { icon: ShieldCheck, title: "Secure private dashboard", desc: "Your company gets private login access to view organized records." },
  { icon: Zap, title: "Fast onboarding", desc: "Send documents on WhatsApp and our team will prepare your portal." },
];

function SmartPro() {
  return (
    <>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20 grid gap-10 lg:grid-cols-2 items-center">
          <div className="fade-slide">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-medium text-gold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Tahleel
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-primary-foreground">Tahleel Smart PRO</h1>
            <h2 className="mt-3 text-xl md:text-2xl text-gold font-semibold">We manage your company documents for you.</h2>
            <p className="mt-4 text-primary-foreground/85">
              You don't need to upload or manage anything. Just send your documents on WhatsApp. Our team will upload, organize, track expiry dates, and give you secure dashboard access anytime.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://wa.me/971553313325" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-whatsapp text-whatsapp-foreground px-6 py-3 font-semibold hover:opacity-90 transition hover:scale-[1.03]">
                <MessageCircle className="h-5 w-5" /> Send Documents on WhatsApp
              </a>
            </div>
            <p className="mt-3 text-xs text-primary-foreground/60">Used by companies through Tahleel services in UAE.</p>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-card rounded-2xl shadow-lift p-5 text-foreground fade-slide">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="text-xs text-muted-foreground">Tahleel Smart PRO</div>
                <div className="font-semibold text-primary">Company Dashboard</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-whatsapp animate-pulse" /> Active
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: "Total Documents", n: 48 },
                { label: "Expiring Soon", n: 5 },
                { label: "Pending Requests", n: 3 },
                { label: "Payment Pending", n: 1 },
              ].map((s) => (
                <div key={s.label} className="bg-surface-blue rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary"><CountUp end={s.n} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md bg-gold/15 border border-gold/40 px-3 py-2 text-sm animate-pulse">
              <AlertTriangle className="h-4 w-4 text-gold" />
              <span className="text-foreground">Trade License expires in 12 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center">How it works</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 150}>
                <div className="card-lift h-full bg-card rounded-xl p-6 shadow-card border-t-[3px] border-t-gold">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-8 w-8 text-primary" />
                    <span className="text-3xl font-bold text-gold/40">{s.n}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What you see after login */}
      <section className="py-20 bg-surface-blue">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center">What you see after login</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t, i) => (
              <Reveal key={t.title} delay={(i%3)*100}>
                <div className="card-lift h-full bg-card rounded-xl p-6 shadow-card">
                  <t.icon className="h-8 w-8 text-gold" />
                  <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center">Why companies use Tahleel Smart PRO</h2></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {why.map((w, i) => (
              <Reveal key={w.title} delay={i*120}>
                <div className="card-lift h-full bg-primary text-primary-foreground rounded-xl p-6">
                  <w.icon className="h-9 w-9 text-gold" />
                  <h3 className="mt-3 text-lg font-semibold text-primary-foreground">{w.title}</h3>
                  <p className="mt-2 text-sm text-primary-foreground/85">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FREE banner */}
      <section className="py-20 bg-gradient-gold">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gold-foreground">This service is completely FREE.</h2>
          <p className="mt-4 text-gold-foreground/85 max-w-2xl mx-auto">
            You do not need to upload or manage anything yourself. Send your documents to us, and Tahleel will upload, arrange, track, and give you login details.
          </p>
          <a href="https://wa.me/971553313325" target="_blank" rel="noreferrer"
             className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition hover:scale-[1.03]">
            <MessageCircle className="h-5 w-5" /> Get Free Setup on WhatsApp
          </a>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to organize your company documents?</h2>
          <p className="mt-3 text-gold font-semibold text-lg">WhatsApp: 055 331 3325</p>
          <a href="https://wa.me/971553313325" target="_blank" rel="noreferrer"
             className="mt-6 inline-flex items-center gap-2 rounded-md bg-whatsapp text-whatsapp-foreground px-6 py-3 font-semibold hover:opacity-90 transition hover:scale-[1.03]">
            <MessageCircle className="h-5 w-5" /> Send Documents on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
