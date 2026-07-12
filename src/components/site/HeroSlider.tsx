import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Clock, MapPin, MessageSquare } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { useI18n } from "@/lib/i18n";

export function HeroSlider() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-card border-b border-border">
      {/* subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.16 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.16 0 0 / 0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 30% 40%, black 40%, transparent 75%)",
        }}
      />
      {/* red accent bar */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--brand-red)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 fade-slide">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)] animate-pulse" />
              {t("Licensed service centre · Sharjah", "مركز خدمات مرخص · الشارقة")}
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.02]">
              {t("Government services,", "خدمات حكومية،")}{" "}
              <span className="text-[color:var(--brand-red)]">
                {t("re-engineered for the UAE.", "أُعيد ابتكارها للإمارات.")}
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              {t(
                "Red Star Services is a next-generation Tasheel-style centre in Al Sajaa, Sharjah — combining a licensed PRO team with Red Star AI for faster, clearer government transactions.",
                "النجم الأحمر للخدمات مركز من الجيل التالي على نمط تسهيل في السجع بالشارقة، يجمع فريق مندوبين مرخصين مع مساعد الذكاء الاصطناعي لتقديم معاملات حكومية أسرع وأوضح.",
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--brand-red)] text-white px-6 py-3.5 text-sm font-semibold hover:bg-[color:var(--brand-red-deep)] transition shadow-card"
              >
                {t("Book a consultation", "احجز استشارة")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:border-foreground transition"
              >
                {t("Explore services", "استعرض الخدمات")}
              </Link>
              <a
                href="#chat"
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-red-star-chat")); }}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground/[0.04] px-4 py-3.5 text-sm font-medium text-foreground hover:bg-foreground/[0.08] transition"
              >
                <Sparkles className="h-4 w-4 text-[color:var(--brand-red)]" />
                {t("Ask Red Star AI", "اسأل مساعد ريد ستار")}
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { n: "13+", l: t("Service categories", "فئة خدمة") },
                { n: t("6 days", "6 أيام"), l: t("Open weekly", "أسبوعياً") },
                { n: "8·8", l: t("AM to PM daily", "صباحاً - مساءً") },
              ].map((s) => (
                <div key={s.l} className="border-t border-foreground pt-3">
                  <div className="text-2xl font-semibold text-foreground tracking-tight">{s.n}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — official notice card */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-[color:var(--brand-red)]/10 rounded-3xl blur-2xl" aria-hidden />
              <div className="relative bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[color:var(--foreground)] text-[color:var(--primary-foreground)]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] opacity-80">
                    <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--brand-red)]" />
                    {t("Official Service Notice", "إشعار خدمة رسمي")}
                  </div>
                  <div className="text-[10px] opacity-60">RS·SHJ·001</div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-background border border-border">
                      <img src={logo} alt="" className="h-10 w-10 object-contain" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-foreground">
                        {t("Red Star Services Centre", "مركز النجم الأحمر للخدمات")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("Al Sajaa · Sharjah · UAE", "السجع · الشارقة · الإمارات")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 text-sm">
                    <Row icon={<Clock className="h-4 w-4" />} label={t("Centre timing", "أوقات العمل")} value={t("Mon–Sat · 8:00 – 20:00", "الاثنين–السبت · 8:00 – 20:00")} />
                    <Row icon={<MapPin className="h-4 w-4" />} label={t("Location", "الموقع")} value={t("Al Sajaa Industrial Area", "المنطقة الصناعية بالسجع")} />
                    <Row icon={<MessageSquare className="h-4 w-4" />} label={t("Direct line", "الخط المباشر")} value="055 331 3325" />
                  </div>

                  <div className="mt-6 rounded-lg border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/[0.04] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("New · AI-integrated services", "جديد · خدمات مدمجة بالذكاء الاصطناعي")}
                    </div>
                    <p className="mt-2 text-xs text-foreground leading-relaxed">
                      {t(
                        "Among Sharjah's first Tasheel-style platforms to embed an AI assistant across the customer journey.",
                        "من أوائل منصات تسهيل في الشارقة التي تدمج مساعداً ذكياً في رحلة العميل.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-background border border-border text-[color:var(--brand-red)]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
