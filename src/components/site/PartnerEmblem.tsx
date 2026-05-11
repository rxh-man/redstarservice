import { useState } from "react";
import {
  Shield, Building2, Car, Plane, Briefcase, Stethoscope,
  Scale, IdCard, Landmark, FileSignature, Globe, BadgeCheck,
  Banknote, GraduationCap, Heart, Flag, Building, Zap,
  type LucideIcon,
} from "lucide-react";
import mohreLogo from "@/assets/partners/mohre.png";
import gdrfaLogo from "@/assets/partners/gdrfa.png";
import icpLogo from "@/assets/partners/icp.png";
import rtaLogo from "@/assets/partners/rta.png";
import seddLogo from "@/assets/partners/sedd.png";
import sewaLogo from "@/assets/partners/sewa.png";
import shjMunLogo from "@/assets/partners/sharjah_municipality.png";
import tasheelLogo from "@/assets/partners/tasheel.png";
import tawjeehLogo from "@/assets/partners/tawjeeh.png";
import rakDedLogo from "@/assets/partners/rak_ded.png";
import abuDhabiJudicialLogo from "@/assets/partners/abu_dhabi_judicial.png";
import ajmanDedLogo from "@/assets/partners/ajman_ded.png";
import amerLogo from "@/assets/partners/amer.png";
import dewaLogo from "@/assets/partners/dewa.png";
import dubaiCourtsLogo from "@/assets/partners/dubai_courts.png";
import dubaiDetLogo from "@/assets/partners/dubai_det.png";
import dubaiMunLogo from "@/assets/partners/dubai_municipality.png";
import federalJudiciaryLogo from "@/assets/partners/federal_judiciary.png";

export type Partner = {
  short: string;
  name: string;
  arabic: string;
  icon: LucideIcon;
  domain?: string;
  logo?: string;
};

export const PARTNERS: Partner[] = [
  { short: "MOHRE",     name: "Ministry of Human Resources & Emiratisation", arabic: "وزارة الموارد البشرية والتوطين", icon: Briefcase, domain: "mohre.gov.ae", logo: mohreLogo },
  { short: "Dubai Police", name: "Dubai Police",          arabic: "شرطة دبي",                  icon: Shield,        domain: "dubaipolice.gov.ae" },
  { short: "Sharjah Police", name: "Sharjah Police",      arabic: "شرطة الشارقة",              icon: Shield,        domain: "shjpolice.gov.ae" },
  { short: "Abu Dhabi Police", name: "Abu Dhabi Police",  arabic: "شرطة أبوظبي",               icon: Shield,        domain: "adpolice.gov.ae" },
  { short: "RTA",       name: "Roads & Transport Authority", arabic: "هيئة الطرق والمواصلات",  icon: Car,           domain: "rta.ae", logo: rtaLogo },
  { short: "SEDD",      name: "Sharjah Economic Development", arabic: "دائرة التنمية الاقتصادية", icon: Building2,  domain: "sedd.ae", logo: seddLogo },
  { short: "DED Dubai", name: "Dubai Economy & Tourism", arabic: "اقتصادية دبي",                icon: Building2,    domain: "ded.ae" },
  { short: "DET",       name: "Dubai Economy & Tourism", arabic: "دبي للاقتصاد والسياحة",       icon: Building2,    domain: "det.gov.ae", logo: dubaiDetLogo },
  { short: "Ajman DED", name: "Ajman Department of Economic Development", arabic: "دائرة التنمية الاقتصادية - عجمان", icon: Building2, domain: "ajmanded.ae", logo: ajmanDedLogo },
  { short: "AMER",      name: "AMER Services (GDRFA Dubai)", arabic: "خدمات أمر",               icon: BadgeCheck,    domain: "amer.gdrfad.gov.ae", logo: amerLogo },
  { short: "Dubai Courts", name: "Dubai Courts",         arabic: "محاكم دبي",                  icon: Scale,         domain: "dc.gov.ae", logo: dubaiCourtsLogo },
  { short: "ADJD",      name: "Abu Dhabi Judicial Department", arabic: "دائرة القضاء - أبوظبي", icon: Scale,         domain: "adjd.gov.ae", logo: abuDhabiJudicialLogo },
  { short: "Federal Judiciary", name: "UAE Federal Judiciary", arabic: "القضاء الاتحادي",       icon: Scale,         domain: "mojfederal.gov.ae", logo: federalJudiciaryLogo },
  { short: "GDRFA",     name: "General Directorate of Residency & Foreigners", arabic: "الإقامة وشؤون الأجانب", icon: Plane, domain: "gdrfad.gov.ae", logo: gdrfaLogo },
  { short: "ICP",       name: "Identity, Citizenship, Customs & Ports", arabic: "الهوية والجنسية والجمارك", icon: IdCard, domain: "icp.gov.ae", logo: icpLogo },
  { short: "MoHAP",     name: "Ministry of Health & Prevention", arabic: "وزارة الصحة ووقاية المجتمع", icon: Stethoscope, domain: "mohap.gov.ae" },
  { short: "MOJ",       name: "Ministry of Justice",     arabic: "وزارة العدل",                icon: Scale,         domain: "moj.gov.ae" },
  { short: "MOFA",      name: "Ministry of Foreign Affairs", arabic: "وزارة الخارجية",         icon: Globe,         domain: "mofa.gov.ae" },
  { short: "MOF",       name: "Ministry of Finance",     arabic: "وزارة المالية",              icon: Banknote,      domain: "mof.gov.ae" },
  { short: "MOE",       name: "Ministry of Education",   arabic: "وزارة التربية والتعليم",      icon: GraduationCap, domain: "moe.gov.ae" },
  { short: "FTA",       name: "Federal Tax Authority",   arabic: "الهيئة الاتحادية للضرائب",     icon: Banknote,      domain: "tax.gov.ae" },
  { short: "Sharjah Municipality", name: "Sharjah Municipality", arabic: "بلدية الشارقة",      icon: Landmark,      domain: "portal.shjmun.gov.ae", logo: shjMunLogo },
  { short: "Dubai Municipality", name: "Dubai Municipality", arabic: "بلدية دبي",              icon: Landmark,      domain: "dm.gov.ae" },
  { short: "Tasheel",   name: "Tasheel Service Centers", arabic: "مراكز تسهيل",                icon: FileSignature, domain: "tasheel.ae", logo: tasheelLogo },
  { short: "Tawjeeh",   name: "Tawjeeh Centers",         arabic: "مراكز توجيه",                icon: Globe,         domain: "tawjeeh.ae", logo: tawjeehLogo },
  { short: "UAE Pass",  name: "UAE Pass · Digital Identity", arabic: "الهوية الرقمية الإماراتية", icon: BadgeCheck,  domain: "uaepass.ae" },
  { short: "EHS",       name: "Emirates Health Services", arabic: "خدمات الإمارات الصحية",     icon: Heart,         domain: "ehs.gov.ae" },
  { short: "DHA",       name: "Dubai Health Authority",  arabic: "هيئة الصحة بدبي",             icon: Heart,         domain: "dha.gov.ae" },
  { short: "TDRA",      name: "Telecommunications & Digital Government", arabic: "هيئة تنظيم الاتصالات", icon: Zap, domain: "tdra.gov.ae" },
  { short: "U.AE",      name: "The Official UAE Government Portal", arabic: "البوابة الرسمية لحكومة الإمارات", icon: Flag, domain: "u.ae" },
  { short: "SEWA",      name: "Sharjah Electricity, Water & Gas", arabic: "كهرباء ومياه الشارقة", icon: Zap,         domain: "sewa.gov.ae", logo: sewaLogo },
  { short: "DEWA",      name: "Dubai Electricity & Water Authority", arabic: "كهرباء ومياه دبي", icon: Zap,         domain: "dewa.gov.ae" },
  { short: "Etisalat",  name: "Etisalat by e&",          arabic: "اتصالات",                    icon: Zap,           domain: "etisalat.ae" },
  { short: "du",        name: "du Telecom",              arabic: "دو",                          icon: Zap,           domain: "du.ae" },
  { short: "RAK DED",   name: "Ras Al Khaimah Department of Economic Development", arabic: "دائرة التنمية الاقتصادية - رأس الخيمة", icon: Building2, domain: "ded.rak.ae", logo: rakDedLogo },
];

function PartnerLogo({ partner, size }: { partner: Partner; size: number }) {
  const Icon = partner.icon;
  const [failed, setFailed] = useState(false);
  const src = partner.logo
    ?? (partner.domain ? `https://www.google.com/s2/favicons?domain=${partner.domain}&sz=128` : null);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={partner.short + " logo"}
        loading="lazy"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Icon style={{ width: size * 0.6, height: size * 0.6 }} className="text-gold" />;
}

export function PartnerEmblem({ partner, variant = "tile" }: { partner: Partner; variant?: "tile" | "strip" }) {
  if (variant === "strip") {
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border shadow-card min-w-[220px]">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white border border-gold/40 shrink-0 overflow-hidden">
          <PartnerLogo partner={partner} size={32} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground whitespace-nowrap">{partner.short}</div>
          <div className="arabic text-[10px] whitespace-nowrap">{partner.arabic}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card-lift h-full bg-card rounded-xl border border-border p-6 text-center hover:border-gold transition shadow-card">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white border border-gold/40 overflow-hidden">
        <PartnerLogo partner={partner} size={56} />
      </div>
      <div className="mt-4 text-sm font-semibold text-foreground">{partner.short}</div>
      <div className="arabic text-xs mt-1">{partner.arabic}</div>
      <div className="mt-2 text-[11px] text-muted-foreground leading-snug">{partner.name}</div>
    </div>
  );
}
