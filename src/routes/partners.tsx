import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { PARTNERS, PartnerEmblem } from "@/components/site/PartnerEmblem";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Our Strategic Partners — Red Star Services" },
      { name: "description", content: "Trusted government and service partners across the UAE — MOHRE, Dubai Police, RTA, SEDD, GDRFA and more." },
      { property: "og:title", content: "Strategic Partners — Red Star Services" },
      { property: "og:description", content: "Government partners powering our services." },
    ],
  }),
  component: Partners,
});

function Partners() {
  return (
    <>
      <PageHero
        tag="Trusted by"
        title="Our Strategic Partners"
        subtitle="We work alongside UAE government entities and authorities to deliver fast, accurate and compliant services."
      />
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {PARTNERS.map((p, i) => (
              <Reveal key={p.short} delay={(i % 4) * 70}>
                <PartnerEmblem partner={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
