import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Our Strategic Partners — Tahleel" },
      { name: "description", content: "Some of our trusted government and service partners across the UAE." },
      { property: "og:title", content: "Strategic Partners — Tahleel" },
      { property: "og:description", content: "Trusted partners who power our services." },
    ],
  }),
  component: Partners,
});

const PARTNERS = ["MOHRE", "ICA", "SEDD", "EHS Sharjah", "Sharjah Municipality", "Ministry of Justice", "GDRFA", "MoHAP", "Tasheel", "Tawjeeh", "UAE Pass", "Smart Dubai"];

function Partners() {
  return (
    <>
      <PageHero tag="Trusted by" title="Our Strategic Partners" subtitle="Some of our trusted partners whose support is critical to our success." />
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Replace placeholder boxes with actual partner logo images */}
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {PARTNERS.map((p, i) => (
              <Reveal key={p} delay={(i % 4) * 80}>
                <div className="card-lift h-24 grid place-items-center bg-card border-2 border-border rounded-lg hover:border-primary text-primary font-semibold text-center px-4">
                  {p}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
