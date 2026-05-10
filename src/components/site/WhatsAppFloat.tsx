import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/971553313325"
      target="_blank" rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="btn-pulse fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lift hover:scale-105 transition"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
