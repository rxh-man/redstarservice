import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gem, Zap, Globe, Car, MonitorSmartphone, ArrowRight,
  FileText, BadgeCheck, Plane, IdCard, Stethoscope, Building2, Landmark, Keyboard,
  MapPin, Phone, Mail,
} from "lucide-react";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ServiceFlipCard } from "@/components/site/ServiceFlipCard";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { PARTNERS, PartnerEmblem } from "@/components/site/PartnerEmblem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tahleel Business Man Service Center — Sharjah" },
      { name: "description", content: "One-stop center in Al Sajaa, Sharjah for Tasheel, Tawjeeh, Immigration, Emirates ID, typing, attestation and translation." },
      { property: "og:title", content: "Tahleel Business Man Service Center" },
      { property: "og:description", content: "Multiple services under one roof — Sharjah, UAE." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Gem, title: "Affordable Price", desc: "Competitive handling with clarity on requirements and timelines." },
  { icon: Zap, title: "Quick Service", desc: "Streamlined flows so you spend less time waiting." },
  { icon: Globe, title: "Multilingual Team", desc: "Guidance in Arabic, English, Urdu and more." },
  { icon: Car, title: "Free Parking", desc: "Easy access in Al Sajaa Industrial Area, Sharjah." },
  { icon: MonitorSmartphone, title: "Advance Systems", desc: "Modern tools to support typing, applications and documentation." },
];

const flipCards = [
  { icon: <FileText className="h-7 w-7" />, title: "Tasheel", arabic: "تسهيل", back: "Processing all Tasheel transactions, open establishment, quota application, job offer + work permit inside / outside, cancellation work permit." },
  { icon: <BadgeCheck className="h-7 w-7" />, title: "Tawjeeh", arabic: "توجيه", back: "New labour card, renew labour card, issue e-sign card, add PRO, Tawjeeh submission." },
  { icon: <Plane className="h-7 w-7" />, title: "Immigration", arabic: "الهجرة", back: "Initial approval, work visa & residence, family visa & residence, investor visa & residence, residence renewal & cancellation, Golden Visa." },
  { icon: <IdCard className="h-7 w-7" />, title: "Emirates ID", arabic: "الهوية الإماراتية", back: "New & renew EID, Emirati citizen EID, replacement of EID, modify information." },
  { icon: <Stethoscope className="h-7 w-7" />, title: "Medical (EHS)", arabic: "الفحص الطبي", back: "Employment medical, domestic worker medical, family medical." },
  { icon: <Building2 className="h-7 w-7" />, title: "SEDD", arabic: "دائرة التنمية الاقتصادية", back: "Reserve trade name, issuance of licence, licence renewal, licence cancellation, fees & fines payments, memorandum of association." },
  { icon: <Landmark className="h-7 w-7" />, title: "Municipality", arabic: "بلدية الشارقة", back: "New tenancy contract, renew tenancy contract, cancel tenancy contract, Ejari typing." },
  { icon: <Keyboard className="h-7 w-7" />, title: "Typing Services", arabic: "خدمات الطباعة", back: "CV/Resume typing, NOC letters, application forms, government documents, Arabic & English typing, all official letters." },
];

const blogPosts = [
  { title: "Everything to know about UAE Labour Law", desc: "Practical insights for employers and employees navigating labour rules and compliance." },
  { title: "What are the requirements to apply for a Golden Visa?", desc: "Key criteria and steps for long-term residence options in the UAE." },
  { title: "Here's what you need to open a business in the UAE", desc: "From licensing and typing to setup paths — a quick orientation for new businesses." },
];

function Home() {
  return (
    <>
      <HeroSlider />

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Why choose us?</h2>
              <p className="mt-3 text-muted-foreground">
                Tahleel offers you prompt services, all in one place, thanks to our experienced team and advanced systems.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="card-lift h-full bg-card rounded-xl p-6 border-l-[3px] border-l-primary shadow-card">
                  <f.icon className="h-8 w-8 text-gold" />
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services - flip cards */}
      <section className="py-20 bg-surface-blue">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">Our services</h2>
                <p className="mt-2 text-muted-foreground">Hover a card to see more.</p>
              </div>
              <Link to="/services" className="text-primary font-semibold hover:text-gold transition inline-flex items-center gap-1">
                Full services list <ArrowRight className="h-4 w-4" />
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
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold">Our resource centre</h2>
            <p className="mt-2 text-muted-foreground">Guides to help you with government transactions, typing requirements and attestation in the UAE.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {blogPosts.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <article className="card-lift h-full bg-card rounded-xl p-6 border-t-[3px] border-t-primary hover:border-t-gold shadow-card">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                  <a href="#" className="mt-5 inline-flex items-center gap-1 text-primary font-semibold hover:text-gold">
                    Read more <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partners marquee */}
      <section className="py-16 bg-white overflow-hidden border-y border-border">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold">Strategic Partners</div>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">UAE government entities we work with</h2>
            </div>
          </Reveal>
        </div>
        {/* Real logos strip on white bg */}
        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="marquee">
            {[...PARTNERS.filter(p => p.logo), ...PARTNERS.filter(p => p.logo)].map((p, i) => (
              <div
                key={`logo-${p.short}-${i}`}
                className="flex items-center justify-center h-28 min-w-[200px] px-8 bg-white"
                title={p.name}
              >
                <img
                  src={p.logo}
                  alt={p.short + " logo"}
                  loading="lazy"
                  className="max-h-20 max-w-[160px] object-contain transition hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Secondary strip for the rest */}
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee marquee-reverse">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <PartnerEmblem key={`${p.short}-${i}`} partner={p} variant="strip" />
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/partners" className="inline-flex items-center gap-1 text-gold font-semibold hover:underline">
            View all partners <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Contact section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Get in touch</h2>
              <p className="mt-2 text-muted-foreground">Al Sajaa Industrial Area, Sharjah, UAE.</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Address", text: "Al Sajaa Industrial Area, Sharjah, UAE" },
              { icon: Phone, title: "Phone", text: "055 331 3325" },
              { icon: Mail, title: "Email", text: "info@tahleel.ae" },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 100}>
                <div className="card-lift h-full bg-card rounded-xl p-6 text-center shadow-card border-l-[3px] border-l-gold">
                  <c.icon className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-8 rounded-xl bg-primary text-primary-foreground p-6 text-center">
              <span className="text-gold font-semibold">Centre Timing:</span>{" "}
              Mon–Sat: 8:00 AM – 8:00 PM | Friday: 8:00 AM – 11:00 AM, 2:00 PM – 6:00 PM
            </div>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal><ContactForm /></Reveal>
            <Reveal delay={150}>
              <div className="h-full min-h-[400px] rounded-2xl overflow-hidden shadow-card">
                <iframe
                  title="Map"
                  className="w-full h-full min-h-[400px] border-0"
                  loading="lazy"
                  src="https://www.google.com/maps?q=Al+Sajaa+Industrial+Area+Sharjah+UAE&output=embed"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
