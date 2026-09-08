import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { BRAND } from "../../lib/site";

export default function Footer() {
    return (
        <footer className="bg-navy text-bone" data-testid="site-footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                    <p className="font-serif text-2xl font-semibold">
                        Culver <span className="italic text-gold">Realty</span>
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-bone/60 mt-1">&amp; Property Management</p>
                    <p className="text-sm text-bone/70 mt-5 leading-relaxed max-w-xs">
                        Full-service real estate brokerage and property management with deep roots in Volusia and
                        Flagler Counties. Relationships come first.
                    </p>
                </div>
                <div className="text-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Visit &amp; Contact</p>
                    <a href="https://maps.google.com/?q=2412+John+Anderson+Drive,+Ormond+Beach,+FL+32176" target="_blank" rel="noreferrer" className="flex items-start gap-3 py-1.5 text-bone/80 hover:text-gold transition-colors" data-testid="footer-address">
                        <MapPin size={16} className="mt-0.5 shrink-0" /> {BRAND.address}
                    </a>
                    <a href={BRAND.phoneHref} className="flex items-center gap-3 py-1.5 text-bone/80 hover:text-gold transition-colors" data-testid="footer-phone">
                        <Phone size={16} className="shrink-0" /> {BRAND.phone}
                    </a>
                    <a href={BRAND.emailHref} className="flex items-center gap-3 py-1.5 text-bone/80 hover:text-gold transition-colors" data-testid="footer-email">
                        <Mail size={16} className="shrink-0" /> {BRAND.email}
                    </a>
                </div>
                <div className="text-sm">
                    <p className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Explore</p>
                    <div className="grid grid-cols-2 gap-x-6">
                        {[
                            ["Listings", "/listings"],
                            ["Rentals", "/rentals"],
                            ["Buyers", "/buyers"],
                            ["Sellers", "/sellers"],
                            ["Investors", "/investors"],
                            ["Management", "/management"],
                            ["Home Away", "/home-away"],
                            ["About", "/about"],
                            ["Meet the Team", "/team"],
                            ["FAQ", "/faq"],
                            ["Contact", "/contact"],
                        ].map(([label, to]) => (
                            <Link key={to} to={to} className="py-1.5 text-bone/80 hover:text-gold transition-colors" data-testid={`footer-${label.toLowerCase()}-link`}>
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t border-bone/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6">
                    <p className="text-xs text-bone/50 leading-relaxed" data-testid="footer-disclaimer">{BRAND.disclaimer}</p>
                    <p className="text-xs text-bone/40 mt-3">
                        © {new Date().getFullYear()} {BRAND.name} · Ormond Beach, Florida
                    </p>
                </div>
            </div>
        </footer>
    );
}
