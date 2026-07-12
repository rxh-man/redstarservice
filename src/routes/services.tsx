import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import {
  FileText, BadgeCheck, Plane, Stethoscope, Building2, Landmark, IdCard,
  Scale, Users, Keyboard, Globe2, ShieldCheck, Cloud,
} from "lucide-react";

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

const services = [
  { icon: FileText, title: "Tasheel", arabic: "تسهيل", items: ["Processing all Tasheel transactions", "Open establishment", "Quota application", "Job offer + work permit (inside / outside)", "Cancellation work permit"] },
  { icon: BadgeCheck, title: "Tawjeeh", arabic: "توجيه", items: ["New labour card", "Renew labour card", "Issue e-sign card", "Add PRO", "Tawjeeh submission"] },
  { icon: Plane, title: "Immigration", arabic: "الهجرة", items: ["Initial approval", "Work visa & residence", "Family visa & residence", "Investor visa & residence", "Renewal & cancellation", "Golden Visa"] },
  { icon: Stethoscope, title: "Medical (EHS)", arabic: "الفحص الطبي", items: ["Employment medical", "Domestic worker medical", "Family medical"] },
  { icon: Building2, title: "SEDD", arabic: "دائرة التنمية الاقتصادية", items: ["Reserve trade name", "Issuance of licence", "Licence renewal", "Licence cancellation", "Fees & fines payments", "Memorandum of association"] },
  { icon: Landmark, title: "Sharjah Municipality", arabic: "بلدية الشارقة", items: ["New tenancy contract", "Renew tenancy contract", "Cancel tenancy contract"] },
  { icon: IdCard, title: "Emirates ID", arabic: "الهوية الإماراتية", items: ["New & renew EID", "Emirati citizen EID", "Replacement of EID", "Modify information"] },
  { icon: Scale, title: "Ministry of Justice", arabic: "وزارة العدل", items: ["Legal consultation", "Case file registration", "Court agreements", "Power of attorney"] },
  { icon: Users, title: "PRO & H.R. Consultancy", arabic: "استشارات الموارد البشرية", items: ["Following up government transactions", "Processing in ministries", "Attending inspections", "H.R. activities"] },
  { icon: Keyboard, title: "Typing Services", arabic: "خدمات الطباعة", items: ["CV/Resume typing", "NOC letters", "Application forms", "Government documents", "Arabic & English typing", "Salary certificates"] },
  { icon: Globe2, title: "Travels", arabic: "السفر والسياحة", items: ["Visit visa", "Tickets", "Tour packages"] },
  { icon: ShieldCheck, title: "Insurance", arabic: "التأمين", items: ["Health insurance", "Vehicle insurance", "Business insurance"] },
  { icon: Cloud, title: "Online Services", arabic: "الخدمات الإلكترونية", items: ["Documents attestation", "Road transport e-services", "Police e-services", "Other online applications"] },
];

function Services() {
  return (
    <>
      <PageHero
        tag="What we do"
        title="Our Services"
        subtitle="Money-saving: we help control the cost of settling your transactions. Time-saving: we free your time so you can focus on your business."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={(i % 6) * 80}>
                <div className="card-lift h-full bg-card rounded-xl p-6 shadow-card border-l-[3px] border-l-primary">
                  <div className="flex items-start justify-between">
                    <s.icon className="h-9 w-9 text-primary" />
                    <span className="arabic text-sm">{s.arabic}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                    {s.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 rounded-xl bg-primary text-primary-foreground p-6 text-center">
            <span className="text-gold font-semibold">Centre Timing:</span>{" "}
            Mon–Sat: 8:00 AM – 8:00 PM | Friday: 8:00 AM – 11:00 AM, 2:00 PM – 6:00 PM
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="rounded-md bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-gold hover:text-gold-foreground transition">Contact Us</Link>
            <Link to="/quotation" className="rounded-md bg-gold text-gold-foreground px-6 py-3 font-semibold hover:opacity-90 transition">Request a Quotation</Link>
          </div>
        </div>
      </section>
    </>
  );
}
