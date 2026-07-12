import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap, Globe, ShieldCheck, MonitorSmartphone, ArrowRight, Sparkles,
  FileText, BadgeCheck, Plane, IdCard, Stethoscope, Building2, Landmark, Keyboard,
  MapPin, Phone, Mail,
} from "lucide-react";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ServiceFlipCard } from "@/components/site/ServiceFlipCard";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { PARTNERS, PartnerEmblem } from "@/components/site/PartnerEmblem";
import skylineImg from "@/assets/sharjah-skyline.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Red Star Services — Sharjah's AI-integrated Tasheel-style centre" },
      { name: "description", content: "Red Star Services — government transactions, Tasheel, Tawjeeh, Immigration, Emirates ID, typing, attestation & translation in Al Sajaa, Sharjah, with Red Star AI Support." },
      { property: "og:title", content: "Red Star Services" },
      { property: "og:description", content: "AI-powered government & business services in Sharjah, UAE." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();

  const features = [
    { icon: ShieldCheck, title: t("Trusted & licensed", "موثوق ومرخص"), desc: t("Compliant handling of every transaction, with clarity on requirements and timelines.", "معالجة متوافقة لكل معاملة مع وضوح المتطلبات والمواعيد.") },
    { icon: Zap, title: t("Fast turnaround", "إنجاز سريع"), desc: t("Streamlined workflows so you spend less time waiting.", "سير عمل مبسّط ليقل انتظارك.") },
    { icon: Sparkles, title: t("AI-assisted", "مدعوم بالذكاء الاصطناعي"), desc: t("Red Star AI guides you 24/7 on documents, steps and eligibility.", "مساعد ريد ستار يرشدك على مدار الساعة.") },
    { icon: Globe, title: t("Multilingual team", "فريق متعدد اللغات"), desc: t("Support in Arabic, English, Urdu and Hindi.", "دعم بالعربية والإنجليزية والأوردية والهندية.") },
    { icon: MonitorSmartphone, title: t("Modern systems", "أنظمة حديثة"), desc: t("Digital-first tools for typing, applications and secure documentation.", "أدوات رقمية للطباعة والتقديم والتوثيق الآمن.") },
  ];

  const flipCards = [
    { icon: <FileText className="h-7 w-7" />, title: t("Tasheel", "تسهيل"), arabic: "تسهيل", back: t("All Tasheel transactions, establishment cards, quotas, work permits inside / outside, cancellations.", "جميع معاملات تسهيل، بطاقات المنشأة، الحصص، تصاريح العمل داخل/خارج البلاد، الإلغاءات.") },
    { icon: <BadgeCheck className="h-7 w-7" />, title: t("Tawjeeh", "توجيه"), arabic: "توجيه", back: t("New / renew labour card, e-sign card, PRO addition, Tawjeeh submission.", "بطاقة عمل جديدة/تجديد، بطاقة التوقيع الإلكتروني، إضافة مندوب، تقديم توجيه.") },
    { icon: <Plane className="h-7 w-7" />, title: t("Immigration", "الهجرة"), arabic: "الهجرة", back: t("Initial approval, work / family / investor visa & residence, renewals, cancellations, Golden Visa.", "الموافقة المبدئية، تأشيرات وإقامات العمل والعائلة والمستثمر، الإقامة الذهبية.") },
    { icon: <IdCard className="h-7 w-7" />, title: t("Emirates ID", "الهوية الإماراتية"), arabic: "الهوية", back: t("New / renew / replace EID, modify information.", "إصدار وتجديد واستبدال الهوية، تعديل البيانات.") },
    { icon: <Stethoscope className="h-7 w-7" />, title: t("Medical (EHS)", "الفحص الطبي"), arabic: "الطبي", back: t("Employment medical, domestic worker, family medical.", "الفحص الطبي للعمل والعمالة المنزلية والعائلة.") },
    { icon: <Building2 className="h-7 w-7" />, title: t("SEDD", "الاقتصادية"), arabic: "الاقتصادية", back: t("Trade name, licence issue / renew / cancel, fees & fines, MOA.", "الاسم التجاري، إصدار وتجديد وإلغاء الرخصة، الرسوم والمخالفات، عقد التأسيس.") },
    { icon: <Landmark className="h-7 w-7" />, title: t("Municipality", "البلدية"), arabic: "البلدية", back: t("Tenancy contract new / renew / cancel, Ejari typing.", "عقد إيجار جديد/تجديد/إلغاء، طباعة إيجاري.") },
    { icon: <Keyboard className="h-7 w-7" />, title: t("Typing Services", "خدمات الطباعة"), arabic: "الطباعة", back: t("CVs, NOC, application forms, government documents, Arabic & English typing.", "السير الذاتية، خطابات عدم ممانعة، النماذج، المستندات الحكومية.") },
  ];

  const blogPosts = [
    { title: t("Everything to know about UAE Labour Law", "كل ما تريد معرفته عن قانون العمل الإماراتي"), desc: t("Practical insights for employers and employees on labour rules and compliance.", "نصائح عملية لأصحاب العمل والموظفين حول قواعد العمل.") },
    { title: t("What are the requirements for a Golden Visa?", "ما هي متطلبات الإقامة الذهبية؟"), desc: t("Key criteria and steps for long-term residence in the UAE.", "المعايير الرئيسية وخطوات الإقامة طويلة الأمد.") },
    { title: t("How to open a business in the UAE", "كيف تفتح نشاطاً تجارياً في الإمارات"), desc: t("From licensing and typing to setup paths — a quick orientation.", "من الترخيص والطباعة إلى مسارات التأسيس — دليل سريع.") },
  ];

  const openChat = () => window.dispatchEvent(new CustomEvent("open-red-star-chat"));

  return (
    <>
      <HeroSlider />

      {/* Why */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="max-w-2xl">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
                {t("Why Red Star", "لماذا ريد ستار")}
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                {t("A calmer, clearer way to move through government paperwork.", "طريقة أهدأ وأوضح لإنجاز المعاملات الحكومية.")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t("Experienced PRO team, modern systems, and an AI concierge — all under one roof in Al Sajaa, Sharjah.", "فريق مندوبين محترف، أنظمة حديثة، ومساعد ذكاء اصطناعي — كل ذلك تحت سقف واحد في السجع بالشارقة.")}
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="card-lift h-full bg-card rounded-2xl p-6 border border-border hover:border-[color:var(--brand-red)]/50 shadow-card">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-background border border-border text-[color:var(--brand-red)]">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI Strip */}
      <section className="py-24 bg-[color:var(--foreground)] text-[color:var(--primary-foreground)]">
        <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
          <Reveal>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
                {t("Introducing Red Star AI", "نقدم لكم مساعد ريد ستار الذكي")}
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
                {t("A business consultant, on demand.", "مستشار أعمال في متناول يدك.")}
              </h2>
              <p className="mt-4 opacity-80 text-base leading-relaxed max-w-lg">
                {t("Ask about any Tasheel step, required documents, processing times or eligibility — in Arabic or English. Trained on UAE government-service workflows and available across the site.", "اسأل عن أي خطوة في تسهيل، المستندات المطلوبة، مدد الإنجاز أو الأهلية — بالعربية أو الإنجليزية. متاح في كل صفحات الموقع.")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={openChat}
                  className="inline-flex items-center gap-2 rounded-md bg-[color:var(--brand-red)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--brand-red-deep)] transition"
                >
                  <Sparkles className="h-4 w-4" /> {t("Chat with Red Star AI", "دردش مع ريد ستار الذكي")}
                </button>
                <Link to="/services" className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold hover:border-white transition">
                  {t("See all services", "شاهد جميع الخدمات")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-70">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)] animate-pulse" />
                {t("Live · Red Star AI", "مباشر · مساعد ريد ستار")}
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg bg-white/10 px-3 py-2 max-w-[85%]">
                  {t("What do I need for a family visa?", "ما المطلوب لتأشيرة العائلة؟")}
                </div>
                <div className="rounded-lg bg-[color:var(--brand-red)] text-white px-3 py-2 max-w-[90%] ms-auto">
                  {t("Typically: sponsor's Emirates ID + salary certificate (min AED 4,000 with accommodation, 10,000 without), attested marriage/birth certificates, tenancy contract (Ejari), and applicant's passport. I can prepare a full checklist for you.", "عادةً: هوية الكفيل + شهادة راتب (4,000 درهم مع السكن أو 10,000 بدونه)، عقد الزواج/شهادات الميلاد مصدّقة، عقد الإيجار (إيجاري)، وجواز سفر مقدم الطلب. أستطيع تجهيز قائمة كاملة لك.")}
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2 max-w-[85%]">
                  {t("Great, share the checklist.", "ممتاز، شارك القائمة.")}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
                  {t("What we handle", "ما نتولاه")}
                </div>
                <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("Core services", "الخدمات الأساسية")}</h2>
                <p className="mt-2 text-muted-foreground text-sm">{t("Hover a card for details.", "مرر فوق البطاقة للتفاصيل.")}</p>
              </div>
              <Link to="/services" className="text-foreground font-semibold hover:text-[color:var(--brand-red)] transition inline-flex items-center gap-1">
                {t("Full services list", "قائمة الخدمات الكاملة")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {flipCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 60}>
                <ServiceFlipCard {...c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Centre */}
      <section className="py-24 bg-[color:var(--secondary)]">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
              {t("Resource centre", "مركز المعرفة")}
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("Guides & insights", "أدلة ومعلومات")}</h2>
            <p className="mt-2 text-muted-foreground">{t("Practical guides for government transactions, typing and attestation.", "أدلة عملية للمعاملات الحكومية والطباعة والتصديق.")}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {blogPosts.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <article className="card-lift h-full bg-card rounded-2xl p-6 border border-border shadow-card">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand-red)] font-semibold">
                    {t("Article", "مقال")}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                  <a href="#" className="mt-5 inline-flex items-center gap-1 text-foreground font-semibold hover:text-[color:var(--brand-red)]">
                    {t("Read more", "اقرأ المزيد")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-white overflow-hidden border-y border-border">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
                {t("Strategic Partners", "الشركاء الاستراتيجيون")}
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                {t("UAE government entities we work with", "الجهات الحكومية الإماراتية التي نتعامل معها")}
              </h2>
            </div>
          </Reveal>
        </div>
        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="marquee">
            {[...PARTNERS.filter(p => p.logo), ...PARTNERS.filter(p => p.logo)].map((p, i) => (
              <div key={`logo-${p.short}-${i}`} className="flex items-center justify-center h-24 min-w-[180px] px-8 bg-white grayscale hover:grayscale-0 transition" title={p.name}>
                <img src={p.logo} alt={p.short + " logo"} loading="lazy" className="max-h-16 max-w-[140px] object-contain" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee marquee-reverse">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <PartnerEmblem key={`${p.short}-${i}`} partner={p} variant="strip" />
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/partners" className="inline-flex items-center gap-1 text-[color:var(--brand-red)] font-semibold hover:underline">
            {t("View all partners", "عرض جميع الشركاء")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 mb-12">
          <div className="relative rounded-2xl overflow-hidden h-56 md:h-72 shadow-card">
            <img src={skylineImg} alt="Sharjah skyline" loading="lazy" width={1280} height={800} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--foreground)]/90 via-[color:var(--foreground)]/70 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-14 max-w-xl">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brand-red)] font-semibold">
                {t("Proudly serving the UAE", "بكل فخر نخدم دولة الإمارات")}
              </div>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {t("Sharjah · Dubai · All Emirates", "الشارقة · دبي · جميع الإمارات")}
              </h3>
              <p className="mt-2 text-sm text-white/80">
                {t("Headquartered in Al Sajaa Industrial Area, serving clients across the UAE.", "مقرنا في المنطقة الصناعية بالسجع، ونخدم عملاءنا في جميع الإمارات.")}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--brand-red)] font-semibold">
                {t("Contact", "تواصل")}
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("Get in touch", "تواصل معنا")}</h2>
              <p className="mt-2 text-muted-foreground">{t("Al Sajaa Industrial Area, Sharjah, UAE.", "المنطقة الصناعية بالسجع، الشارقة، الإمارات.")}</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: t("Address", "العنوان"), text: t("Al Sajaa Industrial Area, Sharjah, UAE", "المنطقة الصناعية بالسجع، الشارقة، الإمارات") },
              { icon: Phone, title: t("Phone", "الهاتف"), text: "055 331 3325" },
              { icon: Mail, title: t("Email", "البريد"), text: "info@redstarservices.ae" },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 100}>
                <div className="card-lift h-full bg-card rounded-2xl p-6 text-center shadow-card border border-border">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-8 rounded-2xl bg-[color:var(--foreground)] text-[color:var(--primary-foreground)] p-6 text-center">
              <span className="text-[color:var(--brand-red)] font-semibold">{t("Centre timing:", "أوقات العمل:")}</span>{" "}
              {t("Mon–Sat: 8:00 AM – 8:00 PM | Friday: 8:00 AM – 11:00 AM, 2:00 PM – 6:00 PM", "الاثنين–السبت: 8:00 صباحاً – 8:00 مساءً | الجمعة: 8:00 – 11:00 صباحاً و2:00 – 6:00 مساءً")}
            </div>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal><ContactForm /></Reveal>
            <Reveal delay={150}>
              <div className="h-full min-h-[400px] rounded-2xl overflow-hidden shadow-card">
                <iframe title="Map" className="w-full h-full min-h-[400px] border-0" loading="lazy" src="https://www.google.com/maps?q=Al+Sajaa+Industrial+Area+Sharjah+UAE&output=embed" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}