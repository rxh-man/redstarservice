import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "ar";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  dir: "ltr" | "rtl";
  t: (en: string, ar: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("rs.lang") as Lang | null) ?? "en";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("rs.lang", l); } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    toggle: () => setLang(lang === "en" ? "ar" : "en"),
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (en: string, ar: string) => (lang === "ar" ? ar : en),
  }), [lang, setLang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) {
    // Safe fallback so SSR / stray usage doesn't crash
    return {
      lang: "en",
      setLang: () => {},
      toggle: () => {},
      dir: "ltr",
      t: (en: string) => en,
    };
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      className={
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-[color:var(--brand-red)] hover:text-[color:var(--brand-red)] transition " +
        className
      }
    >
      <span aria-hidden className="text-[color:var(--brand-red)]">◐</span>
      <span>{lang === "en" ? "العربية" : "English"}</span>
    </button>
  );
}