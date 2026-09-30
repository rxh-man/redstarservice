import { useState } from "react";
import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const services: [string, string][] = [
  ["Typing Services", "خدمات الطباعة"],
  ["Tasheel Labour", "تسهيل العمل"],
  ["Immigration Visa", "تأشيرات الهجرة"],
  ["Emirates ID", "الهوية الإماراتية"],
  ["Business Setup", "تأسيس الأعمال"],
  ["Translation Attestation", "الترجمة والتصديق"],
  ["Other", "أخرى"],
];

export function ContactForm() {
  const { t } = useI18n();
  const [data, setData] = useState({ name: "", email: "", phone: "", service: services[0][0], message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry: ${data.service}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service}\n\n${data.message}`
    );
    window.location.href = `mailto:info@redstarservices.ae?subject=${subject}&body=${body}`;
  };

  const label = "mb-1.5 block text-xs font-semibold text-foreground";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
      <div>
        <h3 className="text-xl font-semibold">{t("Send us a message", "أرسل لنا رسالة")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("We usually reply within a few working hours.", "نرد عادةً خلال ساعات عمل قليلة.")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>{t("Full name", "الاسم الكامل")}</span>
          <input required autoComplete="name" className="input-field" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </label>
        <label>
          <span className={label}>{t("Email", "البريد الإلكتروني")}</span>
          <input required type="email" autoComplete="email" className="input-field" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={label}>{t("Phone", "الهاتف")}</span>
          <input required type="tel" autoComplete="tel" placeholder="05X XXX XXXX" className="input-field" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
        </label>
        <label>
          <span className={label}>{t("Service", "الخدمة")}</span>
          <select className="input-field" value={data.service} onChange={(e) => setData({ ...data, service: e.target.value })}>
            {services.map(([en, ar]) => <option key={en} value={en}>{t(en, ar)}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={label}>{t("Message", "الرسالة")}</span>
        <textarea required rows={5} className="input-field resize-y" value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} />
      </label>
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--brand-red)] py-3 font-semibold text-white hover:bg-[color:var(--brand-red-deep)] transition">
        <Send className="h-4 w-4 rtl:-scale-x-100" /> {t("Send Message", "إرسال الرسالة")}
      </button>
    </form>
  );
}
