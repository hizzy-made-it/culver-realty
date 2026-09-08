import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, Phone, ChevronDown, ExternalLink } from "lucide-react";
import { BRAND } from "../../lib/site";

/**
 * Ten flat links crowded the bar, so the pages people rarely jump between are grouped.
 * Listings, Rentals and Home Away stay one click because they carry the traffic.
 */
const NAV = [
    { to: "/listings", label: "Listings" },
    { to: "/rentals", label: "Rentals" },
    { to: "/home-away", label: "Home Away" },
    {
        label: "Services",
        children: [
            { to: "/buyers", label: "Buyers", blurb: "Finding your place on the coast" },
            { to: "/sellers", label: "Sellers", blurb: "Pricing, marketing, and the move" },
            { to: "/investors", label: "Investors", blurb: "Acquire and hold with local insight" },
            { to: "/management", label: "Property Management", blurb: "Tenants, upkeep, and reporting" },
        ],
    },
    {
        label: "About",
        children: [
            { to: "/about", label: "About Culver", blurb: "Deep roots on the Halifax coast" },
            { to: "/team", label: "Meet the Team", blurb: "The people you'll work with" },
            { to: "/faq", label: "FAQ", blurb: "Straight answers, no runaround" },
        ],
    },
    { to: "/contact", label: "Contact" },
];

const HD_CONNEX = "https://hdconnex.com";

const linkCls = (isActive) =>
    `relative text-sm font-medium tracking-wide transition-colors hover:text-gold ${
        isActive ? "text-gold" : "text-navy"
    }`;

function Underline({ reduce }) {
    return (
        <motion.span
            layoutId="nav-underline"
            className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold"
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
        />
    );
}

function Dropdown({ group, reduce }) {
    const [open, setOpen] = useState(false);
    const wrap = useRef(null);
    const { pathname } = useLocation();
    const active = group.children.some((c) => pathname === c.to);

    // Close on outside click and on Escape, so the panel never strands the keyboard.
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    useEffect(() => setOpen(false), [pathname]);

    return (
        <div
            ref={wrap}
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="true"
                data-testid={`nav-${group.label.toLowerCase()}-trigger`}
                className={`${linkCls(active)} inline-flex items-center gap-1`}
            >
                {group.label}
                <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
                {active && <Underline reduce={reduce} />}
            </button>

            {/*
              Visibility is CSS, not an animation. An AnimatePresence version mounted the
              panel correctly but never ran its enter transition, leaving it permanently at
              opacity 0 — a nav must not be able to fail that way.
            */}
            <div
                aria-hidden={!open}
                className={`absolute left-1/2 top-full pt-4 w-72 z-50 transition-[opacity,transform] ease-out ${
                    reduce ? "duration-0" : "duration-200"
                } ${
                    open
                        ? "opacity-100 -translate-x-1/2 translate-y-0 visible"
                        : "opacity-0 -translate-x-1/2 -translate-y-1 invisible pointer-events-none"
                }`}
                data-testid={`nav-${group.label.toLowerCase()}-menu`}
            >
                <div className="bg-bone border border-navy/10 shadow-xl shadow-navy-deep/10 py-2">
                    {group.children.map((c) => (
                        <NavLink
                            key={c.to}
                            to={c.to}
                            onClick={() => setOpen(false)}
                            tabIndex={open ? 0 : -1}
                            data-testid={`nav-${c.to.slice(1)}-link`}
                            className={({ isActive }) =>
                                `block px-5 py-3 transition-colors group/item ${
                                    isActive ? "bg-sand-100" : "hover:bg-sand-100"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`block text-sm font-semibold transition-colors ${
                                            isActive ? "text-gold" : "text-navy group-hover/item:text-gold"
                                        }`}
                                    >
                                        {c.label}
                                    </span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{c.blurb}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
}

function HdConnexLink({ mobile = false, onClick }) {
    if (mobile) {
        return (
            <a
                href={HD_CONNEX}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                data-testid="nav-mobile-hdconnex-link"
                className="mt-3 pt-4 border-t border-navy/10 flex items-center gap-3 text-navy/70 hover:text-gold transition-colors min-h-[44px]"
            >
                <img src="/api/uploads/seed/hdconnex-logo.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-md" />
                <span className="flex flex-col leading-tight">
                    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-navy/40">Site by</span>
                    <span className="text-sm font-semibold">HD Connex</span>
                </span>
                <ExternalLink size={13} className="ml-auto opacity-50" />
            </a>
        );
    }
    return (
        <a
            href={HD_CONNEX}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="nav-hdconnex-link"
            title="Site by HD Connex"
            className="hidden md:inline-flex items-center gap-2 pl-3 ml-1 border-l border-navy/10 group/hd"
        >
            <img
                src="/api/uploads/seed/hdconnex-logo.png"
                alt="HD Connex"
                className="h-7 w-7 rounded-md transition-transform duration-200 group-hover/hd:scale-105"
            />
            <span className="hidden xl:flex flex-col leading-none">
                <span className="text-[0.58rem] uppercase tracking-[0.18em] text-navy/40">Site by</span>
                <span className="text-[0.72rem] font-semibold text-navy/70 group-hover/hd:text-gold transition-colors">
                    HD Connex
                </span>
            </span>
        </a>
    );
}

export default function Nav() {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();
    const { pathname } = useLocation();

    useEffect(() => setOpen(false), [pathname]);

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

                <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
                    {NAV.map((item) =>
                        item.children ? (
                            <Dropdown key={item.label} group={item} reduce={reduce} />
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}-link`}
                                className={({ isActive }) => linkCls(isActive)}
                            >
                                {({ isActive }) => (
                                    <>
                                        {item.label}
                                        {isActive && <Underline reduce={reduce} />}
                                    </>
                                )}
                            </NavLink>
                        )
                    )}
                </nav>

                <div className="flex items-center gap-3">
                    <a
                        href={BRAND.phoneHref}
                        data-testid="nav-call-button"
                        className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-bone text-xs font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all duration-200 min-h-[44px]"
                    >
                        <Phone size={14} /> {BRAND.phone}
                    </a>
                    <HdConnexLink />
                    <button
                        className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-navy"
                        onClick={() => setOpen(!open)}
                        data-testid="nav-menu-toggle"
                        aria-label="Toggle menu"
                        aria-expanded={open}
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
                            {NAV.map((item) =>
                                item.children ? (
                                    <div key={item.label} className="py-2 border-b border-navy/5">
                                        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-navy/40 font-semibold py-1">
                                            {item.label}
                                        </p>
                                        {item.children.map((c) => (
                                            <NavLink
                                                key={c.to}
                                                to={c.to}
                                                onClick={() => setOpen(false)}
                                                data-testid={`nav-mobile-${c.to.slice(1)}-link`}
                                                className={({ isActive }) =>
                                                    `pl-3 py-2.5 text-base font-medium min-h-[44px] flex items-center ${
                                                        isActive ? "text-gold" : "text-navy"
                                                    }`
                                                }
                                            >
                                                {c.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                ) : (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setOpen(false)}
                                        data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}-link`}
                                        className={({ isActive }) =>
                                            `py-3 text-base font-medium border-b border-navy/5 min-h-[44px] flex items-center ${
                                                isActive ? "text-gold" : "text-navy"
                                            }`
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                )
                            )}
                            <HdConnexLink mobile onClick={() => setOpen(false)} />
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}
