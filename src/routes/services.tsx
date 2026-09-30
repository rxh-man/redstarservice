import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import {
  FileText, BadgeCheck, Plane, Stethoscope, Building2, Landmark, IdCard,
  Scale, Users, Keyboard, Globe2, ShieldCheck, Cloud,
  Search, Check, ArrowRight, Clock, MessageCircle, type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Our Services — Red Star Services" },
      { name: "description", content: "Tasheel, Tawjeeh, Immigration, Emirates ID, Typing, SEDD, Municipality, Translation and more — all in one Sharjah center." },
      { property: "og:title", content: "Our Services — Red Star Services" },
      { property: "og:description", content: "Money-saving and time-saving government & business services." },
    ],
  }),
  component: Services,
});

type Service = { icon: LucideIcon; title: string; arabic: string; items: [string, string][] };

const services: Service[] = [
  { icon: FileText, title: "Tasheel", arabic: "تسهيل", items: [["Processing all Tasheel transactions", "إنجاز جميع معاملات تسهيل"], ["Open establishment", "فتح منشأة"], ["Quota application", "طلب الحصة"], ["Job offer + work permit (inside / outside)", "عرض عمل + تصريح عمل (داخل / خارج الدولة)"], ["Cancellation work permit", "إلغاء تصريح العمل"]] },
  { icon: BadgeCheck, title: "Tawjeeh", arabic: "توجيه", items: [["New labour card", "بطاقة عمل جديدة"], ["Renew labour card", "تجديد بطاقة العمل"], ["Issue e-sign card", "إصدار بطاقة التوقيع الإلكتروني"], ["Add PRO", "إضافة مندوب"], ["Tawjeeh submission", "تقديم توجيه"]] },
  { icon: Plane, title: "Immigration", arabic: "الهجرة", items: [["Initial approval", "الموافقة المبدئية"], ["Work visa & residence", "تأشيرة وإقامة عمل"], ["Family visa & residence", "تأشيرة وإقامة عائلية"], ["Investor visa & residence", "تأشيرة وإقامة مستثمر"], ["Renewal & cancellation", "التجديد والإلغاء"], ["Golden Visa", "الإقامة الذهبية"]] },
  { icon: Stethoscope, title: "Medical (EHS)", arabic: "الفحص الطبي", items: [["Employment medical", "الفحص الطبي للعمل"], ["Domestic worker medical", "الفحص الطبي للعمالة المنزلية"], ["Family medical", "الفحص الطبي للعائلة"]] },
  { icon: Building2, title: "SEDD", arabic: "دائرة التنمية الاقتصادية", items: [["Reserve trade name", "حجز الاسم التجاري"], ["Issuance of licence", "إصدار الرخصة"], ["Licence renewal", "تجديد الرخصة"], ["Licence cancellation", "إلغاء الرخصة"], ["Fees & fines payments", "دفع الرسوم والمخالفات"], ["Memorandum of association", "عقد التأسيس"]] },
  { icon: Landmark, title: "Sharjah Municipality", arabic: "بلدية الشارقة", items: [["New tenancy contract", "عقد إيجار جديد"], ["Renew tenancy contract", "تجديد عقد الإيجار"], ["Cancel tenancy contract", "إلغاء عقد الإيجار"]] },
  { icon: IdCard, title: "Emirates ID", arabic: "الهوية الإماراتية", items: [["New & renew EID", "إصدار وتجديد الهوية"], ["Emirati citizen EID", "هوية المواطنين"], ["Replacement of EID", "بدل فاقد / تالف للهوية"], ["Modify information", "تعديل البيانات"]] },
  { icon: Scale, title: "Ministry of Justice", arabic: "وزارة العدل", items: [["Legal consultation", "استشارة قانونية"], ["Case file registration", "تسجيل ملف القضية"], ["Court agreements", "اتفاقيات المحكمة"], ["Power of attorney", "الوكالة القانونية"]] },
  { icon: Users, title: "PRO & H.R. Consultancy", arabic: "استشارات الموارد البشرية", items: [["Following up government transactions", "متابعة المعاملات الحكومية"], ["Processing in ministries", "الإنجاز لدى الوزارات"], ["Attending inspections", "حضور التفتيش"], ["H.R. activities", "أنشطة الموارد البشرية"]] },
  { icon: Keyboard, title: "Typing Services", arabic: "خدمات الطباعة", items: [["CV/Resume typing", "طباعة السيرة الذاتية"], ["NOC letters", "خطابات عدم الممانعة"], ["Application forms", "نماذج الطلبات"], ["Government documents", "المستندات الحكومية"], ["Arabic & English typing", "الطباعة بالعربية والإنجليزية"], ["Salary certificates", "شهادات الراتب"]] },
  { icon: Globe2, title: "Travels", arabic: "السفر والسياحة", items: [["Visit visa", "تأشيرة زيارة"], ["Tickets", "تذاكر الطيران"], ["Tour packages", "باقات سياحية"]] },
  { icon: ShieldCheck, title: "Insurance", arabic: "التأمين", items: [["Health insurance", "التأمين الصحي"], ["Vehicle insurance", "تأمين المركبات"], ["Business insurance", "تأمين الأعمال"]] },
  { icon: Cloud, title: "Online Services", arabic: "الخدمات الإلكترونية", items: [["Documents attestation", "تصديق المستندات"], ["Road transport e-services", "خدمات النقل الإلكترونية"], ["Police e-services", "خدمات الشرطة الإلكترونية"], ["Other online applications", "طلبات إلكترونية أخرى"]] },
];

function Services() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? services.filter((s) =>
        [s.title, s.arabic, ...s.items.flat()].some((x) => x.toLowerCase().includes(q)),
      )
    : services;

  return (
    <>
      <PageHero
        tag={t("What we do", "ما نقدمه")}
        title={t("Our Services", "خدماتنا")}
        subtitle={t(
          "Money-saving: we help control the cost of settling your transactions. Time-saving: we free your time so you can focus on your business.",
          "توفير المال: نساعدك في التحكم بتكلفة إنجاز معاملاتك. توفير الوقت: نوفر وقتك لتركز على أعمالك.",
        )}
      >
        <div className="mt-8 relative max-w-xl">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search a service — e.g. family visa, Ejari, Emirates ID", "ابحث عن خدمة — مثل تأشيرة العائلة، إيجاري، الهوية")}
            aria-label={t("Search services", "ابحث في الخدمات")}
            className="w-full rounded-full border border-white/10 bg-white py-3.5 ps-11 pe-4 text-sm text-foreground shadow-lift placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-[color:var(--brand-red)]/30"
          />
        </div>
      </PageHero>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t(`${filtered.length} of ${services.length} categories`, `${filtered.length} من ${services.length} فئة`)}
            </span>
            {q && (
              <button onClick={() => setQuery("")} className="font-semibold text-[color:var(--brand-red)] hover:underline">
                {t("Clear search", "مسح البحث")}
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="text-lg font-semibold">{t("No matching service", "لا توجد خدمة مطابقة")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("We probably still handle it — ask us directly.", "على الأغلب نقدمها — تواصل معنا مباشرة.")}
              </p>
              <a
                href="https://wa.me/971553313325"
                target="_blank" rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-whatsapp-foreground"
              >
                <MessageCircle className="h-4 w-4" /> {t("Ask on WhatsApp", "اسأل عبر واتساب")}
              </a>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s, i) => (
                <Reveal key={s.title} delay={(i % 6) * 80}>
                  <div className="group card-lift relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card hover:border-[color:var(--brand-red)]/40">
                    <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-gold scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)] transition group-hover:bg-[color:var(--brand-red)] group-hover:text-white">
                        <s.icon className="h-6 w-6" />
                      </div>
                      {lang === "en" && <span className="arabic text-sm">{s.arabic}</span>}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{lang === "ar" ? s.arabic : s.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {s.items.map(([en, ar]) => (
                        <li key={en} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-red)]" />
                          <span>{t(en, ar)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          <div className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12 text-primary-foreground">
            <div aria-hidden className="hero-glow absolute -bottom-24 end-0 h-72 w-72 rounded-full" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="eyebrow">{t("Ready when you are", "جاهزون لخدمتك")}</div>
                <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-primary-foreground">
                  {t("Tell us what you need — we'll handle the rest.", "أخبرنا بما تحتاجه — ونحن نتولى الباقي.")}
                </h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/70">
                  <Clock className="h-4 w-4" />
                  {t("Mon–Sat: 8:00 AM – 8:00 PM | Friday: 8:00 AM – 11:00 AM, 2:00 PM – 6:00 PM", "الاثنين–السبت: 8:00 ص – 8:00 م | الجمعة: 8:00 – 11:00 ص و2:00 – 6:00 م")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/quotation" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-red)] px-6 py-3 font-semibold text-white hover:bg-[color:var(--brand-red-deep)] transition">
                  {t("Request a Quotation", "اطلب عرض سعر")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold hover:border-white transition">
                  {t("Contact Us", "تواصل معنا")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
