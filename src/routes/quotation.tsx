import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Star, Check, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/quotation")({
  head: () => ({
    meta: [
      { title: "Request a Quotation — Red Star Services" },
      { name: "description", content: "Tell us what you need and we'll get back to you with a quote as soon as possible." },
      { property: "og:title", content: "Request a Quotation — Red Star Services" },
      { property: "og:description", content: "Customer interface for service quotations." },
    ],
  }),
  component: Quotation,
});

const SERVICES: [string, string][] = [
  ["Emirates ID", "الهوية الإماراتية"],
  ["Tasheel", "تسهيل"],
  ["Tawjeeh", "توجيه"],
  ["Typing Services", "خدمات الطباعة"],
  ["Tenancy", "عقود الإيجار"],
  ["Immigration", "الهجرة"],
  ["Medical", "الفحص الطبي"],
  ["Others", "أخرى"],
];

function Quotation() {
  const { t } = useI18n();
  const [form, setForm] = useState({ company: "", first: "", last: "", email: "", phone: "", notes: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [rating, setRating] = useState(5);

  const toggle = (s: string) => setPicked((p) => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Quotation Request — ${form.company || form.first}`);
    const body = encodeURIComponent(
      `Company: ${form.company}\nName: ${form.first} ${form.last}\nEmail: ${form.email}\nPhone: ${form.phone}\nServices: ${picked.join(", ")}\nRating: ${rating}/5\n\nNotes:\n${form.notes}`
    );
    window.location.href = `mailto:info@redstarservices.ae?subject=${subject}&body=${body}`;
  };

  const label = "mb-1.5 block text-xs font-semibold text-foreground";
  const step = (n: number, title: string) => (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--brand-red)] text-xs font-bold text-white">{n}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );

  return (
    <>
      <PageHero
        tag={t("Customer interface", "واجهة العملاء")}
        title={t("Request a Quotation", "طلب عرض سعر")}
        subtitle={t("Tell us what you need and we'll get back to you with a quote as soon as possible.", "أخبرنا بما تحتاجه وسنعود إليك بعرض سعر في أقرب وقت.")}
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={submit} className="space-y-10 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-card">
            <div className="space-y-5">
              {step(1, t("Your details", "بياناتك"))}
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className={label}>{t("Company name", "اسم الشركة")} *</span>
                  <input required autoComplete="organization" className="input-field" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} /></label>
                <label><span className={label}>{t("Phone", "الهاتف")}</span>
                  <input type="tel" autoComplete="tel" placeholder="05X XXX XXXX" className="input-field" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} /></label>
                <label><span className={label}>{t("Owner first name", "الاسم الأول للمالك")} *</span>
                  <input required autoComplete="given-name" className="input-field" value={form.first} onChange={(e)=>setForm({...form, first:e.target.value})} /></label>
                <label><span className={label}>{t("Owner last name", "اسم العائلة للمالك")} *</span>
                  <input required autoComplete="family-name" className="input-field" value={form.last} onChange={(e)=>setForm({...form, last:e.target.value})} /></label>
              </div>
              <label className="block"><span className={label}>{t("Email", "البريد الإلكتروني")} *</span>
                <input required type="email" autoComplete="email" className="input-field" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} /></label>
            </div>

            <div className="space-y-5">
              {step(2, t("Services required", "الخدمات المطلوبة"))}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SERVICES.map(([en, ar]) => {
                  const on = picked.includes(en);
                  return (
                    <button type="button" key={en} onClick={()=>toggle(en)} aria-pressed={on}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-start text-sm font-medium transition ${on ? "border-[color:var(--brand-red)] bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]" : "border-border hover:border-[color:var(--brand-red)]/50"}`}>
                      {t(en, ar)}
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-[color:var(--brand-red)] bg-[color:var(--brand-red)] text-white" : "border-border"}`}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className="block"><span className={label}>{t("Additional notes", "ملاحظات إضافية")}</span>
                <textarea rows={5} className="input-field resize-y" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} /></label>
            </div>

            <div className="space-y-4">
              {step(3, t("How satisfied are you with our services?", "ما مدى رضاك عن خدماتنا؟"))}
              <div className="flex gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button type="button" key={n} onClick={()=>setRating(n)} aria-label={`${n} stars`} className="rounded-md p-0.5 transition hover:scale-110">
                    <Star className={`h-8 w-8 ${n <= rating ? "fill-[color:var(--brand-red)] text-[color:var(--brand-red)]" : "text-border"}`} />
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--brand-red)] py-3.5 font-semibold text-white hover:bg-[color:var(--brand-red-deep)] transition">
              <Send className="h-4 w-4 rtl:-scale-x-100" /> {t("Send Quotation Request", "إرسال طلب عرض السعر")}
            </button>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-[color:var(--foreground)] p-6 text-[color:var(--primary-foreground)]">
              <div className="eyebrow">{t("Your request", "طلبك")}</div>
              <div className="mt-4 text-3xl font-bold">{picked.length}</div>
              <div className="text-sm opacity-70">{t("services selected", "خدمات مختارة")}</div>
              {picked.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {picked.map((p) => {
                    const ar = SERVICES.find(([en]) => en === p)?.[1] ?? p;
                    return <span key={p} className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{t(p, ar)}</span>;
                  })}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-semibold">{t("What happens next?", "ماذا بعد؟")}</h3>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-red)]" />{t("We review your requirements.", "نراجع متطلباتك.")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-red)]" />{t("You receive a clear, itemised quote.", "تستلم عرض سعر واضح ومفصل.")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-red)]" />{t("Our PRO team gets to work.", "يبدأ فريق المندوبين بالعمل.")}</li>
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
