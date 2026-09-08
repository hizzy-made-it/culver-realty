import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, Phone } from "lucide-react";
import api from "../lib/api";
import { BRAND } from "../lib/site";
import { Page } from "../components/motion";
import ListingCard from "../components/site/ListingCard";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";

const TABS = [
    { key: "sale", label: "For Sale" },
    { key: "rent", label: "For Rent" },
    { key: "all", label: "All" },
    { key: "sold", label: "Sold" },
];

const PRICE_OPTIONS = [
    { value: "", label: "Any price" },
    { value: "0-250000", label: "Under $250k" },
    { value: "250000-400000", label: "$250k – $400k" },
    { value: "400000-700000", label: "$400k – $700k" },
    { value: "700000-2000000", label: "$700k – $2M" },
    { value: "2000000-", label: "$2M+" },
];

export default function Listings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const tab = searchParams.get("tab") || "sale";
    const price = searchParams.get("price") || "";
    const beds = searchParams.get("beds") || "";
    const baths = searchParams.get("baths") || "";
    const city = searchParams.get("city") || "";

    const setParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        api.get("/properties/cities").then((r) => setCities(r.data.cities)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (tab === "sale") {
            params.listing_type = "sale";
            params.status = "live";
        } else if (tab === "rent") {
            params.listing_type = "rent";
            params.status = "live";
        } else if (tab === "sold") {
            params.status = "sold";
        }
        if (price) {
            const [min, max] = price.split("-");
            if (min) params.min_price = Number(min);
            if (max) params.max_price = Number(max);
        }
        if (beds) params.beds = Number(beds);
        if (baths) params.baths = Number(baths);
        if (city) params.city = city;
        api.get("/properties", { params })
            .then((r) => setProperties(r.data.properties))
            .catch(() => setProperties([]))
            .finally(() => setLoading(false));
    }, [tab, price, beds, baths, city]);

    const activeFilterCount = useMemo(() => [price, beds, baths, city].filter(Boolean).length, [price, beds, baths, city]);

    const selectCls =
        "w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[44px]";

    return (
        <Page>
            <Seo
                title="Homes for Sale & Rent in Ormond Beach, Daytona & Flagler | Culver Realty"
                description="Browse homes for sale and exclusive rentals in Ormond Beach, Daytona Beach, Volusia and Flagler Counties with Culver Realty & Property Management."
            />
            <PageHero
                eyebrow="Listings"
                title="Properties on the Halifax coast"
                sub="Homes for sale, exclusive rentals, and a record of recent results across Ormond Beach, Daytona Beach, Volusia and Flagler Counties."
                video="/api/uploads/seed/video/listings-oceanfront"
                poster="/api/uploads/seed/video/listings-oceanfront-poster.jpg"
                alt="Aerial view of oceanfront condominiums on the Halifax coast"
                size="sm"
                minHeight="min-h-[52vh]"
                testid="listings-header"
            />

            <section className="sticky top-16 md:top-20 z-30 bg-bone/95 backdrop-blur-xl border-b border-navy/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-3">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar" data-testid="listing-tabs">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setParam("tab", t.key === "sale" ? "" : t.key)}
                                data-testid={`listing-tab-${t.key}`}
                                className={`relative px-4 py-2.5 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-colors min-h-[44px] ${
                                    tab === t.key ? "text-navy" : "text-slate-500 hover:text-navy"
                                }`}
                            >
                                {t.label}
                                {tab === t.key && (
                                    <motion.span layoutId="tab-underline" className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gold" />
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        data-testid="listing-filters-toggle"
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-navy/20 text-xs font-semibold tracking-wider uppercase text-navy hover:border-gold transition-colors min-h-[44px]"
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold text-white text-[0.65rem]">{activeFilterCount}</span>
                        )}
                    </button>
                </div>
                <AnimatePresence>
                    {filtersOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden border-t border-navy/10"
                            data-testid="listing-filters-panel"
                        >
                            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <select className={selectCls} value={price} onChange={(e) => setParam("price", e.target.value)} data-testid="filter-price" aria-label="Price range">
                                    {PRICE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <select className={selectCls} value={beds} onChange={(e) => setParam("beds", e.target.value)} data-testid="filter-beds" aria-label="Bedrooms">
                                    <option value="">Any beds</option>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>{n}+ beds</option>
                                    ))}
                                </select>
                                <select className={selectCls} value={baths} onChange={(e) => setParam("baths", e.target.value)} data-testid="filter-baths" aria-label="Bathrooms">
                                    <option value="">Any baths</option>
                                    {[1, 2, 3].map((n) => (
                                        <option key={n} value={n}>{n}+ baths</option>
                                    ))}
                                </select>
                                <select className={selectCls} value={city} onChange={(e) => setParam("city", e.target.value)} data-testid="filter-city" aria-label="City">
                                    <option value="">All cities</option>
                                    {cities.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setSearchParams(tab === "sale" ? {} : { tab }, { replace: true })}
                                    data-testid="filter-reset-button"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-navy transition-colors min-h-[44px]"
                                >
                                    <X size={14} /> Reset
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 md:py-16" data-testid="listings-grid-section">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="border border-navy/10 bg-white">
                                <div className="aspect-[16/10] bg-sand-200 shimmer" />
                                <div className="p-5 space-y-3">
                                    <div className="h-6 w-1/2 bg-sand-200 shimmer" />
                                    <div className="h-4 w-3/4 bg-sand-200 shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-8" data-testid="listings-count">
                            {properties.length} propert{properties.length === 1 ? "y" : "ies"}
                        </p>
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                            <AnimatePresence mode="popLayout">
                                {properties.map((p, i) => (
                                    <ListingCard key={p.id} property={p} index={i} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-navy/10 bg-white px-6 py-20 text-center"
                        data-testid="listings-empty-state"
                    >
                        <p className="font-serif text-3xl text-navy">Nothing matches — yet.</p>
                        <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
                            New properties reach us before they reach the portals. Call {BRAND.phone} or adjust your
                            filters and we'll keep an eye out for you.
                        </p>
                        <a
                            href={BRAND.phoneHref}
                            data-testid="empty-state-call-button"
                            className="inline-flex items-center justify-center gap-2 mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]"
                        >
                            <Phone size={15} /> Call {BRAND.phone}
                        </a>
                    </motion.div>
                )}
            </section>
        </Page>
    );
}
