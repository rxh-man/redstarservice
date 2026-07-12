import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/red-star-logo.png";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_EN = [
  "What documents are needed for Emirates ID?",
  "How does Tasheel work permit processing work?",
  "Requirements for a family visa",
  "How do I renew my trade licence (SEDD)?",
];
const SUGGESTIONS_AR = [
  "ما المستندات المطلوبة للهوية الإماراتية؟",
  "كيف تعمل معاملة تصاريح العمل عبر تسهيل؟",
  "متطلبات تأشيرة العائلة",
  "كيف أجدد الرخصة التجارية (SEDD)؟",
];

export function RedStarChat() {
  const { t, lang, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-red-star-chat", handler);
    return () => window.removeEventListener("open-red-star-chat", handler);
  }, []);

  const greeting = t(
    "Hello! I'm Red Star AI Support. Ask me about any government service, required documents, or process.",
    "مرحباً! أنا مساعد الذكاء الاصطناعي من ريد ستار. اسألني عن أي خدمة حكومية أو المستندات المطلوبة أو الإجراءات.",
  );

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, lang }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: t(
            "Sorry, I couldn't reach the assistant. Please try again in a moment, or WhatsApp us at 055 331 3325.",
            "عذراً، لم أتمكن من الاتصال بالمساعد. يرجى المحاولة بعد قليل أو التواصل عبر واتساب 055 331 3325.",
          ),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = lang === "ar" ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Red Star AI Support"
          className={
            "fixed bottom-6 z-50 group inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-red)] text-white pl-3 pr-4 py-3 shadow-lift hover:opacity-95 transition " +
            (dir === "rtl" ? "left-6" : "right-6") +
            " md:bottom-24"
          }
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold hidden sm:inline">
            {t("Red Star AI", "مساعد ريد ستار الذكي")}
          </span>
          <MessageSquare className="h-4 w-4 sm:hidden" />
        </button>
      )}

      {open && (
        <div
          className={
            "fixed z-50 bottom-4 w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl overflow-hidden border border-border bg-card shadow-lift " +
            (dir === "rtl" ? "left-4" : "right-4") +
            " md:bottom-24"
          }
          dir={dir}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[color:var(--foreground)] text-[color:var(--primary-foreground)]">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white">
                <img src={logo} alt="" className="h-7 w-7 object-contain" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">
                  {t("Red Star AI Support", "دعم ريد ستار الذكي")}
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">
                  {t("Online · Beta", "متصل · تجريبي")}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="max-h-[55vh] min-h-[280px] overflow-y-auto px-3 py-4 space-y-3 bg-background">
            <div className="flex gap-2">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--brand-red)] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl bg-card border border-border px-3 py-2 text-sm text-foreground max-w-[85%]">
                {greeting}
              </div>
            </div>

            {messages.length === 0 && (
              <div className="pt-1 space-y-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-start rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground hover:border-[color:var(--brand-red)] hover:text-[color:var(--brand-red)] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={"flex gap-2 " + (m.role === "user" ? "justify-end" : "")}>
                {m.role === "assistant" && (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--brand-red)] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={
                    "rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap " +
                    (m.role === "user"
                      ? "bg-[color:var(--foreground)] text-[color:var(--primary-foreground)]"
                      : "bg-card border border-border text-foreground")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--brand-red)] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl bg-card border border-border px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("Ask about a service or document…", "اسأل عن خدمة أو مستند…")}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2 py-2"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--brand-red)] text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="px-3 pb-2 text-[10px] text-muted-foreground">
            {t(
              "Informational only — not legal advice. Verify with the relevant authority.",
              "للأغراض التوضيحية فقط — ليست استشارة قانونية. يرجى التأكد من الجهة المعنية.",
            )}
          </div>
        </div>
      )}
    </>
  );
}