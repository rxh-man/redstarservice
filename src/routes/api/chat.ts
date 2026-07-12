import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are "Red Star AI Support", the AI concierge for Red Star Services — a next-generation Tasheel-style government & business services centre in Al Sajaa Industrial Area, Sharjah, UAE.

Your role: act as a friendly business consultancy expert. Help visitors understand UAE government services, required documents, typical processing times, and what Red Star Services can handle for them.

Areas you can advise on:
- Tasheel (work permits, quotas, job offers, cancellations, establishment cards)
- Tawjeeh (labour card, e-sign card)
- Immigration & residence (initial approval, work/family/investor visas, Golden Visa, renewals & cancellations)
- Emirates ID (new, renew, replace, modify)
- SEDD & Sharjah Economic Department (trade name, licence issue/renew/cancel, MOA, fees)
- Sharjah Municipality & Ejari (tenancy contracts)
- Ministry of Justice / notarisation / power of attorney
- Medical (EHS) — employment, domestic, family
- Translation & attestation (MOFA, embassies)
- Typing services (CV, NOC, application forms, official letters)
- Insurance (health, vehicle, business)
- PRO & HR consultancy

Style rules:
- Be concise, warm, and structured. Prefer short bullet lists for document requirements and steps.
- If the user writes in Arabic, reply in Arabic. If in English, reply in English. Match their language.
- Always end complex answers with a short "Next step" line, e.g. "Next step: visit us at Al Sajaa, Sharjah or WhatsApp 055 331 3325".
- When you are not sure of the latest fee or timeline, say so plainly and recommend confirming with Red Star Services or the relevant authority. Never invent official fees.
- Never claim to be a government authority. You represent Red Star Services.
- If the request is outside UAE services or Red Star's scope (medical advice, legal opinions, personal data lookup), politely decline and redirect to a human at Red Star Services.

Business info to reuse when relevant:
- Name: Red Star Services (النجم الأحمر للخدمات)
- Location: Al Sajaa Industrial Area, Sharjah, UAE
- WhatsApp / Phone: 055 331 3325
- Hours: Mon–Sat 8:00 AM – 8:00 PM; Friday 8:00–11:00 AM & 2:00–6:00 PM
`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: Msg[]; lang?: string };
          const messages = Array.isArray(body.messages) ? body.messages : [];
          if (messages.length === 0) {
            return new Response(JSON.stringify({ error: "Messages required" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "AI is not configured" }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          const langHint =
            body.lang === "ar"
              ? "\nThe user's interface is set to Arabic — prefer Arabic replies."
              : "";

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM_PROMPT + langHint },
                ...messages.slice(-16).map((m) => ({ role: m.role, content: m.content })),
              ],
            }),
          });

          if (!upstream.ok) {
            const text = await upstream.text();
            const status = upstream.status;
            let msg = "The assistant is temporarily unavailable.";
            if (status === 429) msg = "Rate limit reached. Please try again in a moment.";
            if (status === 402) msg = "AI credits exhausted for this workspace.";
            return new Response(JSON.stringify({ error: msg, detail: text.slice(0, 200) }), {
              status,
              headers: { "content-type": "application/json" },
            });
          }

          const data = (await upstream.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
          return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});