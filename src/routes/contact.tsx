import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Phone, MessageCircle, Mail, FileDown } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Tahleel Business Man Service Center" },
      { name: "description", content: "Reach Tahleel in Al Sajaa Industrial Area, Sharjah. Call, WhatsApp, email or visit our centre." },
      { property: "og:title", content: "Contact Tahleel" },
      { property: "og:description", content: "We're here to help with all your government transactions." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero tag="Get in touch" title="Contact Us" subtitle="We're here to help." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-card border-l-[3px] border-l-gold">
                <h3 className="text-xl font-semibold mb-4">Contact details</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3"><MapPin className="h-5 w-5 text-primary mt-0.5" /> Al Sajaa Industrial Area, Sharjah, UAE</li>
                  <li className="flex gap-3"><Phone className="h-5 w-5 text-primary mt-0.5" /> 055 331 3325</li>
                  <li className="flex gap-3"><MessageCircle className="h-5 w-5 text-primary mt-0.5" /> WhatsApp: <a href="https://wa.me/971553313325" className="text-primary hover:text-gold font-medium">055 331 3325</a></li>
                  <li className="flex gap-3"><Mail className="h-5 w-5 text-primary mt-0.5" /> info@tahleel.ae</li>
                </ul>
              </div>

              <div className="bg-primary text-primary-foreground rounded-xl p-6">
                <h3 className="text-gold font-semibold mb-2">Centre Timing</h3>
                <p className="text-sm">Mon–Sat: 8:00 AM – 8:00 PM</p>
                <p className="text-sm">Friday: 8:00 AM – 11:00 AM, 2:00 PM – 6:00 PM</p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-3">Downloads</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center gap-2 text-sm text-primary hover:text-gold"><FileDown className="h-4 w-4" /> Residential Tenancy Agreement (PDF)</a>
                  <a href="#" className="flex items-center gap-2 text-sm text-primary hover:text-gold"><FileDown className="h-4 w-4" /> Commercial Tenancy Agreement (PDF)</a>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden shadow-card h-72">
                <iframe title="Map" className="w-full h-full border-0" loading="lazy"
                  src="https://www.google.com/maps?q=Al+Sajaa+Industrial+Area+Sharjah+UAE&output=embed" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
