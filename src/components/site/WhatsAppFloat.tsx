import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/971553313325"
      target="_blank" rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="btn-pulse fixed bottom-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lift hover:scale-105 transition end-6 md:bottom-6"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
