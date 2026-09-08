import { Phone, Mail } from "lucide-react";
import { BRAND } from "../../lib/site";

export default function MobileCallBar() {
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-t border-white/10 p-3 shadow-2xl md:hidden flex gap-3"
            data-testid="mobile-call-bar"
        >
            <a
                href={BRAND.phoneHref}
                data-testid="mobile-call-button"
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-gold text-white text-sm font-semibold tracking-wider uppercase active:scale-[0.98] transition-transform"
            >
                <Phone size={16} /> Call {BRAND.phone}
            </a>
            <a
                href={BRAND.emailHref}
                data-testid="mobile-email-button"
                className="min-h-[44px] min-w-[56px] inline-flex items-center justify-center gap-2 border border-bone/40 text-bone text-sm font-semibold active:scale-[0.98] transition-transform px-4"
                aria-label="Email us"
            >
                <Mail size={16} />
            </a>
        </div>
    );
}
