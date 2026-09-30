import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Phone, MessageCircle, Mail, FileDown, Clock, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Red Star Services" },
      { name: "description", content: "Reach Red Star Services in Al Sajaa Industrial Area, Sharjah. Call, WhatsApp, email or visit our centre." },
      { property: "og:title", content: "Contact Red Star Services" },
      { property: "og:description", content: "We're here to help with all your government transactions." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();

  const channels = [
    { icon: Phone, title: t("Call us", "اتصل بنا"), value: "055 331 3325", href: "tel:+971553313325" },
    { icon: MessageCircle, title: "WhatsApp", value: "055 331 3325", href: "https://wa.me/971553313325", external: true },
    { icon: Mail, title: t("Email", "البريد الإلكتروني"), value: "info@redstarservices.ae", href: "mailto:info@redstarservices.ae" },
    { icon: MapPin, title: t("Visit", "زورونا"), value: t("Al Sajaa Industrial Area, Sharjah", "المنطقة الصناعية بالسجع، الشارقة"), href: "https://www.google.com/maps?q=Al+Sajaa+Industrial+Area+Sharjah+UAE", external: true },
  ];

  return (
    <>
      <PageHero
        tag={t("Get in touch", "تواصل معنا")}
        title={t("Contact Us", "اتصل بنا")}
        subtitle={t("Call, WhatsApp, email or drop by the centre — we're here to help.", "اتصل، راسلنا عبر واتساب أو البريد، أو قم بزيارة المركز — نحن هنا لمساعدتك.")}
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="-mt-28 relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c, i) => (
              <Reveal key={c.href} delay={i * 70}>
                <a
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noreferrer" : undefined}
                  className="group card-lift flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card hover:border-[color:var(--brand-red)]/40"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)] transition group-hover:bg-[color:var(--brand-red)] group-hover:text-white">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.title}
                      <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100" />
                    </div>
                    <div className="mt-1 break-words text-sm font-semibold text-foreground" dir={c.href.startsWith("tel") || c.href.includes("wa.me") ? "ltr" : undefined}>
                      {c.value}
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <div className="space-y-6">
                <div className="rounded-2xl bg-[color:var(--foreground)] p-6 text-[color:var(--primary-foreground)]">
                  <div className="flex items-center gap-2 font-semibold text-[color:var(--brand-red)]">
                    <Clock className="h-4 w-4" /> {t("Centre Timing", "أوقات العمل")}
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                      <dt className="opacity-70">{t("Monday – Saturday", "الاثنين – السبت")}</dt>
                      <dd className="font-medium">{t("8:00 AM – 8:00 PM", "8:00 ص – 8:00 م")}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="opacity-70">{t("Friday", "الجمعة")}</dt>
                      <dd className="text-end font-medium">{t("8–11 AM, 2–6 PM", "8–11 ص، 2–6 م")}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="text-lg font-semibold">{t("Downloads", "التنزيلات")}</h3>
                  <div className="mt-3 divide-y divide-border">
                    {[
                      t("Residential Tenancy Agreement (PDF)", "عقد إيجار سكني (PDF)"),
                      t("Commercial Tenancy Agreement (PDF)", "عقد إيجار تجاري (PDF)"),
                    ].map((d) => (
                      <a key={d} href="#" className="flex items-center gap-3 py-3 text-sm font-medium text-foreground hover:text-[color:var(--brand-red)] transition">
                        <FileDown className="h-4 w-4 text-[color:var(--brand-red)]" /> {d}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="h-72 overflow-hidden rounded-2xl border border-border shadow-card">
                  <iframe title="Map" className="h-full w-full border-0" loading="lazy"
                    src="https://www.google.com/maps?q=Al+Sajaa+Industrial+Area+Sharjah+UAE&output=embed" />
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
