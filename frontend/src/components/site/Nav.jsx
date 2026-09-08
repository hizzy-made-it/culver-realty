import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { BRAND } from "../../lib/site";

const LINKS = [
    { to: "/listings", label: "Listings" },
    { to: "/rentals", label: "Rentals" },
    { to: "/buyers", label: "Buyers" },
    { to: "/sellers", label: "Sellers" },
    { to: "/investors", label: "Investors" },
    { to: "/management", label: "Management" },
    { to: "/home-away", label: "Home Away" },
    { to: "/team", label: "Team" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
];

export default function Nav() {
    const [open, setOpen] = useState(false);
    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-bone/90 border-b border-navy/10" data-testid="site-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-16 md:h-20">
                <Link to="/" data-testid="nav-logo" onClick={() => setOpen(false)} aria-label="Culver Realty & Property Management — home">
                    <img
                        src="/api/uploads/seed/culver-logo.png"
                        alt="Culver Realty & Property Management"
                        className="h-10 md:h-12 w-auto"
                    />
                </Link>
                <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
                    {LINKS.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            data-testid={`nav-${l.label.toLowerCase()}-link`}
                            className={({ isActive }) =>
                                `text-sm font-medium tracking-wide transition-colors hover:text-gold ${
                                    isActive ? "text-gold" : "text-navy"
                                }`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="flex items-center gap-3">
                    <a
                        href={BRAND.phoneHref}
                        data-testid="nav-call-button"
                        className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-bone text-xs font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all duration-200 min-h-[44px]"
                    >
                        <Phone size={14} /> {BRAND.phone}
                    </a>
                    <button
                        className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-navy"
                        onClick={() => setOpen(!open)}
                        data-testid="nav-menu-toggle"
                        aria-label="Toggle menu"
                    >
                        {open ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.nav
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="lg:hidden overflow-hidden border-t border-navy/10 bg-bone"
                        data-testid="nav-mobile-menu"
                    >
                        <div className="px-4 py-4 flex flex-col">
                            {LINKS.map((l) => (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    onClick={() => setOpen(false)}
                                    data-testid={`nav-mobile-${l.label.toLowerCase()}-link`}
                                    className={({ isActive }) =>
                                        `py-3 text-base font-medium border-b border-navy/5 last:border-0 min-h-[44px] flex items-center ${
                                            isActive ? "text-gold" : "text-navy"
                                        }`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            ))}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}
