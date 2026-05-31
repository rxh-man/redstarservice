import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import duaLogo from "@/assets/dua-logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-card text-foreground border-t-2 border-gold">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={duaLogo} alt="Dua Documents Service" className="h-14 w-auto object-contain" />
          </div>
          <div className="mt-3 font-bold text-foreground">Dua Documents Service</div>
          <div className="arabic text-xs">دعاء لخدمات المستندات</div>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Multiple services under one roof — government transactions, typing, certification, translation and attestation.
          </p>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-gold">Home</Link></li>
            <li><Link to="/services" className="hover:text-gold">Services</Link></li>
            <li><Link to="/partners" className="hover:text-gold">Partners</Link></li>
            <li><Link to="/quotation" className="hover:text-gold">Request Quotation</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Tasheel</li>
            <li>Tawjeeh</li>
            <li>Immigration</li>
            <li>Emirates ID</li>
            <li>Typing &amp; Translation</li>
            <li>SEDD &amp; Municipality</li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold font-semibold mb-3">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <span>Al Sajaa Industrial Area, Sharjah, UAE</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <span>055 331 3325</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <span>info@duadocuments.ae</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs text-muted-foreground">
          © 2025 Dua Documents Service. All rights reserved. | Al Sajaa, Sharjah, UAE
        </div>
      </div>
    </footer>
  );
}
