import {
  Shield, Building2, Car, Plane, Briefcase, Stethoscope,
  Scale, IdCard, Landmark, FileSignature, Globe, BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export type Partner = {
  short: string;
  name: string;
  arabic: string;
  icon: LucideIcon;
};

export const PARTNERS: Partner[] = [
  { short: "MOHRE",     name: "Ministry of Human Resources & Emiratisation", arabic: "وزارة الموارد البشرية والتوطين", icon: Briefcase },
  { short: "Dubai Police", name: "Dubai Police",          arabic: "شرطة دبي",                  icon: Shield },
  { short: "Sharjah Police", name: "Sharjah Police",      arabic: "شرطة الشارقة",              icon: Shield },
  { short: "RTA",       name: "Roads & Transport Authority", arabic: "هيئة الطرق والمواصلات",  icon: Car },
  { short: "SEDD",      name: "Sharjah Economic Development", arabic: "دائرة التنمية الاقتصادية", icon: Building2 },
  { short: "GDRFA",     name: "General Directorate of Residency", arabic: "الإقامة وشؤون الأجانب", icon: Plane },
  { short: "ICA",       name: "Identity, Citizenship, Customs & Ports", arabic: "الهوية والجنسية والجمارك", icon: IdCard },
  { short: "MoHAP",     name: "Ministry of Health & Prevention", arabic: "وزارة الصحة ووقاية المجتمع", icon: Stethoscope },
  { short: "MOJ",       name: "Ministry of Justice",     arabic: "وزارة العدل",                icon: Scale },
  { short: "Sharjah Municipality", name: "Sharjah Municipality", arabic: "بلدية الشارقة",      icon: Landmark },
  { short: "Tasheel",   name: "Tasheel Service Centers", arabic: "مراكز تسهيل",                icon: FileSignature },
  { short: "UAE Pass",  name: "UAE Pass",                arabic: "الهوية الرقمية الإماراتية",   icon: BadgeCheck },
  { short: "EHS",       name: "Emirates Health Services", arabic: "خدمات الإمارات الصحية",     icon: Stethoscope },
  { short: "Tawjeeh",   name: "Tawjeeh Centers",         arabic: "مراكز توجيه",                icon: Globe },
];

export function PartnerEmblem({ partner, variant = "tile" }: { partner: Partner; variant?: "tile" | "strip" }) {
  const Icon = partner.icon;
  if (variant === "strip") {
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-border min-w-[200px]">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 border border-gold/40 text-gold shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground whitespace-nowrap">{partner.short}</div>
          <div className="arabic text-[10px] whitespace-nowrap">{partner.arabic}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card-lift h-full bg-card rounded-xl border border-border p-6 text-center hover:border-gold transition">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/10 border border-gold/40 text-gold">
        <Icon className="h-8 w-8" />
      </div>
      <div className="mt-4 text-sm font-semibold text-foreground">{partner.short}</div>
      <div className="arabic text-xs mt-1">{partner.arabic}</div>
      <div className="mt-2 text-[11px] text-muted-foreground leading-snug">{partner.name}</div>
    </div>
  );
}
