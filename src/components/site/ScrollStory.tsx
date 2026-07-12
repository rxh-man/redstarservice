import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import { FileText, ShieldCheck, Sparkles, Users, CheckCircle2, Building2, IdCard, Plane, Stethoscope, Landmark, Keyboard, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/red-star-logo.png";

/**
 * Scroll-driven storytelling: 6 scenes pinned in a tall scroll container.
 * Each scene fades / scales in based on scroll progress.
 */
export function ScrollStory() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const SCENES = 6;
  // Each scene occupies 1/SCENES of the scroll.
  const sceneRange = (i: number): [number, number, number, number] => {
    const step = 1 / SCENES;
    const start = i * step;
    return [start, start + step * 0.15, start + step * 0.85, start + step];
  };

  return (
    <section
      ref={ref}
      className="relative bg-background"
      style={{ height: `${SCENES * 110}vh` }}
      aria-label="Red Star service journey"
    >
      {/* Progress rail */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <ProgressRail progress={progress} count={SCENES} labels={[
          t("Arrive", "الوصول"),
          t("Consult", "استشارة"),
          t("Submit", "التقديم"),
          t("Complete", "الإنجاز"),
          t("AI Support", "الذكاء الاصطناعي"),
          t("Explore", "اكتشف"),
        ]} />

        {/* Scene stack */}
        <div className="absolute inset-0">
          <Scene progress={progress} range={sceneRange(0)}><SceneArrive t={t} /></Scene>
          <Scene progress={progress} range={sceneRange(1)}><SceneConsult t={t} /></Scene>
          <Scene progress={progress} range={sceneRange(2)}><SceneSubmit t={t} /></Scene>
          <Scene progress={progress} range={sceneRange(3)}><SceneComplete t={t} /></Scene>
          <Scene progress={progress} range={sceneRange(4)}><SceneAI t={t} /></Scene>
          <Scene progress={progress} range={sceneRange(5)}><SceneExplore t={t} /></Scene>
        </div>

        {/* Ambient background */}
        <BackgroundGrid />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Framework                                                          */
/* ------------------------------------------------------------------ */

function Scene({
  progress, range, children,
}: { progress: MotionValue<number>; range: [number, number, number, number]; children: React.ReactNode }) {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [60, 0, 0, -60]);
  const scale = useTransform(progress, range, [0.96, 1, 1, 1.02]);
  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="absolute inset-0 flex items-center justify-center px-6"
    >
      <div className="w-full max-w-6xl">{children}</div>
    </motion.div>
  );
}

function ProgressRail({ progress, count, labels }: { progress: MotionValue<number>; count: number; labels: string[] }) {
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div className="absolute top-0 inset-x-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-red)] animate-pulse" />
          {labels[0]?.length ? "Service Journey" : ""}
        </div>
        <div className="relative flex-1 h-[3px] bg-border/60 rounded-full overflow-hidden">
          <motion.div style={{ width }} className="absolute inset-y-0 left-0 bg-[color:var(--brand-red)]" />
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {labels.map((l, i) => <Step key={l} progress={progress} i={i} n={count}>{l}</Step>)}
        </div>
      </div>
    </div>
  );
}

function Step({ progress, i, n, children }: { progress: MotionValue<number>; i: number; n: number; children: React.ReactNode }) {
  const active = useTransform(progress, [i / n, (i + 0.5) / n, (i + 1) / n], [0.3, 1, 0.3]);
  return (
    <motion.span style={{ opacity: active }} className="text-foreground font-semibold">{children}</motion.span>
  );
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-0 opacity-[0.05] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(oklch(0.16 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.16 0 0 / 0.5) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at 50% 40%, black 40%, transparent 78%)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scene shell                                                        */
/* ------------------------------------------------------------------ */

type T = (en: string, ar: string) => string;

function SceneShell({
  step, kicker, title, body, art,
}: { step: string; kicker: string; title: React.ReactNode; body: string; art: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-12 items-center">
      <div className="lg:col-span-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          <span className="text-[color:var(--brand-red)]">{step}</span>
          <span>·</span>
          <span>{kicker}</span>
        </div>
        <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
          {title}
        </h2>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">{body}</p>
      </div>
      <div className="lg:col-span-7">
        <div className="relative">
          <div aria-hidden className="absolute -inset-6 bg-[color:var(--brand-red)]/10 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-3xl border border-border bg-card/70 backdrop-blur-xl shadow-card p-6 md:p-10 overflow-hidden">
            {art}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                             */
/* ------------------------------------------------------------------ */

function SceneArrive({ t }: { t: T }) {
  return (
    <SceneShell
      step="01"
      kicker={t("Arrival", "الوصول")}
      title={<>{t("You walk into ", "تدخل إلى ")}<span className="text-[color:var(--brand-red)]">{t("Red Star Services.", "النجم الأحمر للخدمات.")}</span></>}
      body={t("Al Sajaa's calmest service floor. Reception greets you in Arabic or English, hands you a queue token, and confirms your file within seconds.", "أهدأ صالة خدمة في السجع. الاستقبال يرحّب بك بالعربية أو الإنجليزية، ويسلّمك رمز الدور ويؤكد ملفك خلال ثوان.")}
      art={<CentreScene t={t} />}
    />
  );
}

function SceneConsult({ t }: { t: T }) {
  return (
    <SceneShell
      step="02"
      kicker={t("Consultation", "استشارة")}
      title={<>{t("A PRO specialist ", "مختص خدمات ")}<span className="text-[color:var(--brand-red)]">{t("plans your case.", "يخطط لمعاملتك.")}</span></>}
      body={t("Licensed Emirati-trained PROs map every requirement, spot missing documents early, and quote timelines in plain language — before any fee is paid.", "مندوبون مرخصون يرسمون كل متطلب، ويكتشفون النواقص مبكراً، ويخبرونك بالمدة بلغة واضحة قبل أي رسوم.")}
      art={<ConsultScene t={t} />}
    />
  );
}

function SceneSubmit({ t }: { t: T }) {
  return (
    <SceneShell
      step="03"
      kicker={t("Submission", "التقديم")}
      title={<>{t("Documents flow ", "المستندات تسير ")}<span className="text-[color:var(--brand-red)]">{t("through AI review.", "عبر مراجعة ذكية.")}</span></>}
      body={t("Every form is checked by Red Star AI for typos, missing stamps and expired IDs before it ever reaches a government portal. Zero avoidable rejections.", "كل نموذج يُراجَع بواسطة الذكاء الاصطناعي بحثاً عن الأخطاء والأختام الناقصة والهويات المنتهية قبل أي إرسال حكومي.")}
      art={<SubmitScene />}
    />
  );
}

function SceneComplete({ t }: { t: T }) {
  return (
    <SceneShell
      step="04"
      kicker={t("Completion", "الإنجاز")}
      title={<>{t("Approved by ", "معتمد من ")}<span className="text-[color:var(--brand-red)]">{t("UAE government portals.", "بوابات الإمارات الحكومية.")}</span></>}
      body={t("Tasheel, ICP, MOHRE, GDRFA, SEDD, Municipality — approvals land back in your file, ready to collect or delivered digitally.", "تسهيل، الهوية والجنسية، الموارد البشرية، الإقامة، الاقتصادية، البلدية — تصل الموافقات إلى ملفك جاهزة للاستلام أو رقمياً.")}
      art={<CompleteScene t={t} />}
    />
  );
}

function SceneAI({ t }: { t: T }) {
  return (
    <SceneShell
      step="05"
      kicker={t("Red Star AI", "مساعد ريد ستار")}
      title={<>{t("Your ", "مستشارك ")}<span className="text-[color:var(--brand-red)]">{t("24 / 7 concierge.", "على مدار الساعة.")}</span></>}
      body={t("Ask any Tasheel, immigration or business-setup question in Arabic or English. Red Star AI answers instantly, then hands off to a human PRO when you're ready.", "اسأل أي سؤال حول تسهيل أو الهجرة أو تأسيس الأعمال بالعربية أو الإنجليزية. يجيبك المساعد فوراً ثم يحوّلك لمندوب بشري عند الحاجة.")}
      art={<AIScene t={t} />}
    />
  );
}

function SceneExplore({ t }: { t: T }) {
  return (
    <SceneShell
      step="06"
      kicker={t("Explore", "اكتشف")}
      title={<>{t("13+ service categories, ", "أكثر من 13 فئة خدمة، ")}<span className="text-[color:var(--brand-red)]">{t("one centre.", "مركز واحد.")}</span></>}
      body={t("From Emirates ID to Golden Visa, Ejari to trade licences — every UAE government workflow, unified under one licensed Red Star roof.", "من الهوية الإماراتية إلى الإقامة الذهبية، ومن إيجاري إلى الرخص التجارية — كل معاملة حكومية تحت سقف ريد ستار الواحد.")}
      art={<ExploreScene t={t} />}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SVG / illustration scenes                                          */
/* ------------------------------------------------------------------ */

function CentreScene({ t }: { t: T }) {
  return (
    <div className="relative h-[380px] md:h-[440px]">
      {/* Floor */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-foreground/[0.06] to-transparent" />
      {/* Sliding door frame */}
      <div className="absolute inset-x-8 top-8 bottom-14 rounded-2xl border border-border bg-background overflow-hidden">
        <motion.div
          initial={{ x: "0%" }} animate={{ x: ["0%", "-46%", "-46%", "0%"] }}
          transition={{ duration: 5, times: [0, 0.4, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-foreground/[0.08] to-foreground/[0.02] border-r border-border"
        />
        <motion.div
          initial={{ x: "0%" }} animate={{ x: ["0%", "46%", "46%", "0%"] }}
          transition={{ duration: 5, times: [0, 0.4, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-foreground/[0.08] to-foreground/[0.02] border-l border-border"
        />
        {/* Red Star signage inside */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
          <img src={logo} alt="" className="h-14 w-14 object-contain opacity-80" />
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {t("Red Star Services · Sharjah", "النجم الأحمر · الشارقة")}
          </div>
        </div>
      </div>
      {/* Emirati character walking in */}
      <motion.div
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute bottom-6 left-10 md:left-16"
      >
        <EmiratiKandura />
      </motion.div>
      {/* Queue token */}
      <motion.div
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute bottom-16 right-8 md:right-14 rounded-xl border border-border bg-card px-4 py-3 shadow-card"
      >
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{t("Your token", "رمزك")}</div>
        <div className="text-2xl font-semibold text-[color:var(--brand-red)] tabular-nums">A-042</div>
      </motion.div>
    </div>
  );
}

function ConsultScene({ t }: { t: T }) {
  const bubbles = [
    { s: t("Golden Visa?", "الإقامة الذهبية؟"), side: "left" as const, d: 0 },
    { s: t("Salary min AED 30k", "الحد الأدنى 30 ألف"), side: "right" as const, d: 0.6 },
    { s: t("+ 5 documents", "+ 5 مستندات"), side: "right" as const, d: 1.1 },
    { s: t("Timeline: 7 days", "المدة: 7 أيام"), side: "left" as const, d: 1.6 },
  ];
  return (
    <div className="relative h-[380px] md:h-[440px]">
      {/* Desk */}
      <div className="absolute bottom-8 inset-x-6 h-3 rounded-full bg-foreground/10" />
      {/* PRO */}
      <div className="absolute bottom-12 left-8 md:left-16"><EmiratiKandura variant="pro" /></div>
      {/* Customer */}
      <div className="absolute bottom-12 right-8 md:right-16"><EmiratiKandura mirrored /></div>
      {/* Speech bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -10, -30], scale: [0.9, 1, 1, 0.95] }}
            transition={{ duration: 4, delay: b.d, repeat: Infinity, repeatDelay: 1.5 }}
            className={`absolute top-${8 + (i * 12)}`}
            style={{
              top: `${18 + i * 18}%`,
              [b.side === "left" ? "left" : "right"]: "18%",
            }}
          >
            <div className={`rounded-2xl px-4 py-2 text-sm shadow-card border ${
              b.side === "left"
                ? "bg-card border-border text-foreground"
                : "bg-[color:var(--brand-red)] text-white border-transparent"
            }`}>{b.s}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SubmitScene() {
  const docs = [0, 1, 2, 3, 4];
  return (
    <div className="relative h-[380px] md:h-[440px] overflow-hidden">
      {/* Scanner beam */}
      <div className="absolute inset-x-10 top-16 bottom-16 rounded-2xl border border-border bg-background overflow-hidden">
        <motion.div
          className="absolute inset-x-0 h-8 bg-gradient-to-b from-[color:var(--brand-red)]/40 via-[color:var(--brand-red)]/10 to-transparent"
          animate={{ y: ["0%", "620%", "0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "linear-gradient(oklch(0.55 0.22 25 / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.22 25 / 0.15) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />
        {/* Floating docs */}
        <div className="absolute inset-0 flex items-center justify-center">
          {docs.map((i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ x: -180 + i * 20, y: 40, rotate: -8, opacity: 0 }}
              animate={{
                x: [-180 + i * 20, 0, 180 - i * 20],
                y: [40 - i * 5, -10, 40 - i * 5],
                rotate: [-8 + i * 2, 0, 8 - i * 2],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 4, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <DocCard />
            </motion.div>
          ))}
        </div>
        {/* Check badge */}
        <motion.div
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-semibold"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.85, 1] }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-red)]" />
          AI verified
        </motion.div>
      </div>
    </div>
  );
}

function CompleteScene({ t }: { t: T }) {
  const stamps = [
    { l: "Tasheel", d: 0 },
    { l: "ICP", d: 0.3 },
    { l: "MOHRE", d: 0.6 },
    { l: "SEDD", d: 0.9 },
    { l: "GDRFA", d: 1.2 },
  ];
  return (
    <div className="relative h-[380px] md:h-[440px]">
      <UAEMap />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative bg-card border border-border rounded-2xl shadow-card p-5 w-[280px]"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{t("File #A-042", "ملف #A-042")}</div>
            <ShieldCheck className="h-4 w-4 text-[color:var(--brand-red)]" />
          </div>
          <div className="mt-3 text-lg font-semibold">{t("Application approved", "تمت الموافقة")}</div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {stamps.map((s) => (
              <motion.span
                key={s.l}
                initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ delay: 0.8 + s.d, type: "spring", stiffness: 220, damping: 12 }}
                className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--brand-red)] border border-[color:var(--brand-red)]/60 rounded px-1.5 py-0.5"
              >{s.l}</motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AIScene({ t }: { t: T }) {
  return (
    <div className="relative h-[380px] md:h-[440px] flex items-center justify-center">
      {/* Orbit rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-[color:var(--brand-red)]/20"
          style={{ width: 160 + i * 90, height: 160 + i * 90 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14 + i * 6, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-[color:var(--brand-red)]" />
        </motion.div>
      ))}
      {/* Core */}
      <div className="relative z-10 rounded-2xl bg-foreground text-background px-5 py-4 shadow-lift min-w-[260px]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] opacity-70">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand-red)]" />
          {t("Red Star AI", "مساعد ريد ستار")}
        </div>
        <motion.div
          key="typing"
          className="mt-3 text-sm leading-relaxed"
          initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        >
          {t("How can I help with your file today?", "كيف أساعدك في ملفك اليوم؟")}
        </motion.div>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i} className="h-1.5 w-1.5 rounded-full bg-white/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExploreScene({ t }: { t: T }) {
  const items = [
    { icon: FileText, l: t("Tasheel", "تسهيل") },
    { icon: BadgeCheck, l: t("Tawjeeh", "توجيه") },
    { icon: Plane, l: t("Immigration", "الهجرة") },
    { icon: IdCard, l: t("Emirates ID", "الهوية") },
    { icon: Stethoscope, l: t("Medical", "الطبي") },
    { icon: Building2, l: t("SEDD", "الاقتصادية") },
    { icon: Landmark, l: t("Municipality", "البلدية") },
    { icon: Keyboard, l: t("Typing", "الطباعة") },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it, i) => (
        <motion.a
          key={it.l}
          href="/services"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.5 }}
          whileHover={{ y: -4 }}
          className="group relative rounded-xl border border-border bg-card p-4 shadow-card hover:border-[color:var(--brand-red)]/60 transition"
        >
          <div className="grid h-9 w-9 place-items-center rounded-md bg-background border border-border text-[color:var(--brand-red)] group-hover:scale-110 transition">
            <it.icon className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-semibold text-foreground">{it.l}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t("Explore →", "اكتشف →")}</div>
        </motion.a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-illustrations                                                  */
/* ------------------------------------------------------------------ */

function EmiratiKandura({ mirrored = false, variant = "customer" }: { mirrored?: boolean; variant?: "customer" | "pro" }) {
  return (
    <svg width="120" height="200" viewBox="0 0 120 200" style={{ transform: mirrored ? "scaleX(-1)" : undefined }}>
      {/* body / kandura */}
      <path d="M60 60 Q30 70 26 200 L94 200 Q90 70 60 60 Z" fill="oklch(0.98 0 0)" stroke="oklch(0.85 0 0)" />
      {/* face */}
      <circle cx="60" cy="42" r="18" fill="oklch(0.78 0.05 60)" />
      {/* ghutra */}
      <path d="M40 22 Q60 6 80 22 L86 60 Q60 46 34 60 Z" fill="oklch(0.99 0 0)" stroke="oklch(0.82 0 0)" />
      {/* agal */}
      <ellipse cx="60" cy="26" rx="22" ry="4" fill="oklch(0.18 0 0)" />
      {/* beard */}
      <path d="M48 48 Q60 58 72 48 Q68 56 60 58 Q52 56 48 48 Z" fill="oklch(0.28 0 0)" />
      {variant === "pro" && (
        <rect x="52" y="80" width="16" height="22" rx="2" fill="oklch(0.55 0.22 25)" />
      )}
    </svg>
  );
}

function DocCard() {
  return (
    <div className="w-40 h-52 rounded-md bg-card border border-border shadow-card p-3">
      <div className="h-2 w-16 bg-foreground/70 rounded-full" />
      <div className="mt-2 h-1.5 w-24 bg-foreground/20 rounded-full" />
      <div className="mt-1 h-1.5 w-20 bg-foreground/20 rounded-full" />
      <div className="mt-4 h-16 rounded bg-foreground/[0.05] border border-border" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-4 w-10 rounded bg-[color:var(--brand-red)]/70" />
        <div className="h-6 w-6 rounded-full border-2 border-[color:var(--brand-red)]/60" />
      </div>
    </div>
  );
}

function UAEMap() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full opacity-40">
      <path
        d="M60 190 L80 160 L110 150 L140 130 L180 110 L220 100 L260 80 L300 70 L340 90 L360 130 L340 170 L310 200 L270 220 L220 230 L170 240 L120 240 L80 220 Z"
        fill="none" stroke="oklch(0.16 0 0 / 0.5)" strokeWidth="1.5" strokeDasharray="4 4"
      />
      {[
        { x: 300, y: 90, l: "RAK" },
        { x: 260, y: 110, l: "UAQ" },
        { x: 235, y: 125, l: "AJM" },
        { x: 210, y: 145, l: "SHJ" },
        { x: 195, y: 165, l: "DXB" },
        { x: 130, y: 200, l: "AUH" },
        { x: 275, y: 100, l: "FUJ" },
      ].map((p, i) => (
        <g key={p.l}>
          <motion.circle
            cx={p.x} cy={p.y} r="4" fill="oklch(0.55 0.22 25)"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
          <text x={p.x + 8} y={p.y + 3} fontSize="9" fill="oklch(0.16 0 0)" fontWeight="600">{p.l}</text>
        </g>
      ))}
    </svg>
  );
}

/* Export a small hero-like landing header that plugs in above the story. */
export function StoryIntro() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-card border-b border-border">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--brand-red)]" />
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          <Users className="h-3.5 w-3.5 text-[color:var(--brand-red)]" />
          {t("Scroll to walk through your service journey", "مرر لتشاهد رحلة خدمتك")}
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.02]">
          {t("Government services,", "خدمات حكومية،")}<br />
          <span className="text-[color:var(--brand-red)]">{t("re-imagined.", "مُعاد تصوّرها.")}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t(
            "Red Star Services is Sharjah's first AI-integrated Tasheel-style centre. Six scenes below show exactly how your file moves from front door to final approval.",
            "النجم الأحمر أول مركز على نمط تسهيل في الشارقة مدعوم بالذكاء الاصطناعي. ست مشاهد أدناه توضّح كيف يتحرك ملفك من الاستقبال حتى الاعتماد النهائي.",
          )}
        </p>
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
          className="mt-12 mx-auto h-10 w-6 rounded-full border-2 border-foreground/40 flex items-start justify-center pt-1.5"
        >
          <span className="h-2 w-1 rounded-full bg-foreground/60" />
        </motion.div>
      </div>
    </section>
  );
}