import { useState } from "react";

const services = [
  "Typing Services",
  "Tasheel Labour",
  "Immigration Visa",
  "Emirates ID",
  "Business Setup",
  "Translation Attestation",
  "Other",
];

export function ContactForm() {
  const [data, setData] = useState({ name: "", email: "", phone: "", service: services[0], message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry: ${data.service}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nService: ${data.service}\n\n${data.message}`
    );
    window.location.href = `mailto:info@redstarservices.ae?subject=${subject}&body=${body}`;
  };

  const input = "w-full rounded-md border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-6 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Name" className={input} value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        <input required type="email" placeholder="Email" className={input} value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Phone" className={input} value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
        <select className={input} value={data.service} onChange={(e) => setData({ ...data, service: e.target.value })}>
          {services.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <textarea required rows={5} placeholder="Message" className={input} value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} />
      <button type="submit" className="w-full rounded-md bg-primary text-primary-foreground py-3 font-semibold hover:bg-gold hover:text-gold-foreground transition">
        Send Message
      </button>
    </form>
  );
}
