import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="relative mt-20 bg-[color:var(--foreground)] text-[color:var(--primary-foreground)] border-t border-border">
      <div aria-hidden className="h-1 w-full bg-gradient-gold" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-white">
              <img src={logo} alt="Red Star Services" className="h-11 w-11 object-contain" />
            </div>
          </div>
          <div className="mt-4 font-semibold">{t("Red Star Services", "النجم الأحمر للخدمات")}</div>
          <div className="text-xs opacity-70">{t("Al Sajaa · Sharjah · UAE", "السجع · الشارقة · الإمارات")}</div>
          <p className="mt-4 text-sm opacity-75 max-w-xs">
            {t(
              "A next-generation Tasheel-style service centre — government transactions, typing, attestation, translation, powered by Red Star AI.",
              "مركز خدمات من الجيل التالي على نمط تسهيل — معاملات حكومية، طباعة، تصديق وترجمة، مدعوم بالذكاء الاصطناعي من ريد ستار.",
            )}
          </p>
        </div>

        <div>
          <h4 className="text-[color:var(--brand-red)] font-semibold mb-3">{t("Quick Links", "روابط سريعة")}</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/" className="hover:text-[color:var(--brand-red)]">{t("Home", "الرئيسية")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)]">{t("Services", "الخدمات")}</Link></li>
            <li><Link to="/partners" className="hover:text-[color:var(--brand-red)]">{t("Partners", "الشركاء")}</Link></li>
            <li><Link to="/quotation" className="hover:text-[color:var(--brand-red)]">{t("Request Quotation", "طلب عرض سعر")}</Link></li>
            <li><Link to="/contact" className="hover:text-[color:var(--brand-red)]">{t("Contact", "تواصل")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[color:var(--brand-red)] font-semibold mb-3">{t("Services", "الخدمات")}</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("Tasheel", "تسهيل")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("Tawjeeh", "توجيه")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("Immigration", "الهجرة")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("Emirates ID", "الهوية الإماراتية")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("Typing & Translation", "الطباعة والترجمة")}</Link></li>
            <li><Link to="/services" className="hover:text-[color:var(--brand-red)] transition">{t("SEDD & Municipality", "الاقتصادية والبلدية")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[color:var(--brand-red)] font-semibold mb-3">{t("Contact", "تواصل")}</h4>
          <ul className="space-y-3 text-sm opacity-80">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[color:var(--brand-red)] mt-0.5 shrink-0" />
              <span>{t("Al Sajaa Industrial Area, Sharjah, UAE", "المنطقة الصناعية بالسجع، الشارقة، الإمارات")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-[color:var(--brand-red)] mt-0.5 shrink-0" />
              <a href="tel:+971553313325" dir="ltr" className="hover:text-[color:var(--brand-red)] transition">055 331 3325</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-[color:var(--brand-red)] mt-0.5 shrink-0" />
              <a href="mailto:info@redstarservices.ae" className="hover:text-[color:var(--brand-red)] transition">info@redstarservices.ae</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs opacity-70">
          © 2026 {t("Red Star Services. All rights reserved.", "النجم الأحمر للخدمات. جميع الحقوق محفوظة.")}
          <span className="mx-2 opacity-40">·</span>
          <Link to="/portal" className="underline-offset-4 hover:underline">
            {t("Staff Portal", "بوابة الموظفين")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
