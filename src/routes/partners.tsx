import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { PARTNERS, PartnerEmblem } from "@/components/site/PartnerEmblem";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <>
      <PageHero
        tag={t("Trusted by", "شركاؤنا")}
        title={t("Our Strategic Partners", "شركاؤنا الاستراتيجيون")}
        subtitle={t(
          "We work alongside UAE government entities and authorities to deliver fast, accurate and compliant services.",
          "نعمل جنباً إلى جنب مع الجهات الحكومية في الإمارات لتقديم خدمات سريعة ودقيقة ومتوافقة.",
        )}
      >
        <div className="mt-8 flex flex-wrap gap-8">
          <div>
            <div className="text-3xl font-bold">{PARTNERS.length}+</div>
            <div className="text-sm text-primary-foreground/60">{t("Government entities", "جهة حكومية")}</div>
          </div>
          <div>
            <div className="text-3xl font-bold">7</div>
            <div className="text-sm text-primary-foreground/60">{t("Emirates served", "إمارات نخدمها")}</div>
          </div>
        </div>
      </PageHero>
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
