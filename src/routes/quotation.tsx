import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Star } from "lucide-react";

export const Route = createFileRoute("/quotation")({
  head: () => ({
    meta: [
      { title: "Request a Quotation — Dua Documents Service" },
      { name: "description", content: "Tell us what you need and we'll get back to you with a quote as soon as possible." },
      { property: "og:title", content: "Request a Quotation — Dua Documents Service" },
      { property: "og:description", content: "Customer interface for service quotations." },
    ],
  }),
  component: Quotation,
});

const SERVICES = ["Emirates ID", "Tasheel", "Tawjeeh", "Typing Services", "Tenancy", "Immigration", "Medical", "Others"];

function Quotation() {
  const [form, setForm] = useState({ company: "", first: "", last: "", email: "", phone: "", notes: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [rating, setRating] = useState(5);

  const toggle = (s: string) => setPicked((p) => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Quotation Request — ${form.company || form.first}`);
    const body = encodeURIComponent(
      `Company: ${form.company}\nName: ${form.first} ${form.last}\nEmail: ${form.email}\nPhone: ${form.phone}\nServices: ${picked.join(", ")}\nRating: ${rating}/5\n\nNotes:\n${form.notes}`
    );
    window.location.href = `mailto:info@duadocuments.ae?subject=${subject}&body=${body}`;
  };

  const input = "w-full rounded-md border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <>
      <PageHero tag="Customer interface" title="Request a Quotation" subtitle="Tell us what you need and we'll get back to you with a quote as soon as possible." />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <form onSubmit={submit} className="bg-primary text-primary-foreground rounded-2xl p-8 shadow-lift space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Company name" className={input + " text-foreground"} value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
              <input placeholder="Phone" className={input + " text-foreground"} value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Owner first name" className={input + " text-foreground"} value={form.first} onChange={(e)=>setForm({...form, first:e.target.value})} />
              <input required placeholder="Owner last name" className={input + " text-foreground"} value={form.last} onChange={(e)=>setForm({...form, last:e.target.value})} />
            </div>
            <input required type="email" placeholder="Email" className={input + " text-foreground"} value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />

            <div>
              <div className="text-gold font-semibold mb-2">Which services do you require?</div>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((s) => {
                  const on = picked.includes(s);
                  return (
                    <button type="button" key={s} onClick={()=>toggle(s)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition ${on ? "bg-gold text-gold-foreground border-gold" : "border-primary-foreground/30 hover:border-gold"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea rows={5} placeholder="Additional notes" className={input + " text-foreground"} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />

            <div>
              <div className="text-gold font-semibold mb-2">How satisfied are you with our services?</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button type="button" key={n} onClick={()=>setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-7 w-7 ${n <= rating ? "fill-gold text-gold" : "text-primary-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full rounded-md bg-gold text-gold-foreground py-3 font-semibold hover:opacity-90 transition">
              Send Quotation Request
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
