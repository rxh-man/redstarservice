import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-gold text-gold-foreground font-bold">T</div>
            <div>
              <div className="font-bold text-lg">Tahleel</div>
              <div className="arabic text-xs">تحليل</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/80 max-w-xs">
            Multiple services under one roof — government transactions, typing, certification, translation and attestation.
          </p>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-gold">Home</Link></li>
            <li><Link to="/services" className="hover:text-gold">Services</Link></li>
            <li><Link to="/smart-pro" className="hover:text-gold">Smart PRO</Link></li>
            <li><Link to="/partners" className="hover:text-gold">Partners</Link></li>
            <li><Link to="/quotation" className="hover:text-gold">Request Quotation</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/85">
            <li>Tasheel</li>
            <li>Tawjeeh</li>
            <li>Immigration</li>
            <li>Emirates ID</li>
            <li>Typing & Translation</li>
            <li>SEDD & Municipality</li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Contact</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2"><MapPin className="h-4 w-4 text-gold mt-0.5" /> Al Sajaa Industrial Area, Sharjah, UAE</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 text-gold mt-0.5" /> 055 331 3325</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 text-gold mt-0.5" /> info@tahleel.ae</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs text-primary-foreground/70">
          © 2025 Tahleel Business Man Service Center. All rights reserved. | Al Sajaa, Sharjah, UAE
        </div>
      </div>
    </footer>
  );
}
