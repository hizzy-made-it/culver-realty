import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import api from "../lib/api";
import { BRAND } from "../lib/site";
import { Page, Reveal } from "../components/motion";
import ListingCard from "../components/site/ListingCard";
import InquiryForm from "../components/site/InquiryForm";
import Seo from "../components/site/Seo";

export default function Rentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/properties", { params: { listing_type: "rent", status: "live" } })
            .then((r) => setRentals(r.data.properties))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <Page>
            <Seo
                title="Exclusive Rentals in Ormond Beach & Volusia County | Culver Realty"
                description="Find your perfect rental home in Volusia and Flagler Counties. Exclusive rentals professionally managed by Culver Realty & Property Management."
            />
            <section className="bg-navy text-bone py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Exclusive rentals</p>
                        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight font-medium">Find your perfect rental home today</h1>
                        <p className="text-bone/75 mt-5 max-w-2xl leading-relaxed text-sm md:text-base">
                            Culver Realty &amp; Property Management specializes in helping you find rental homes in
                            beautiful Volusia and Flagler Counties. Our dedicated team ensures a seamless rental
                            process, with a variety of homes to suit your lifestyle and budget.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20" data-testid="rentals-grid-section">
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
                ) : rentals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {rentals.map((p, i) => (
                            <ListingCard key={p.id} property={p} index={i} />
                        ))}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border border-navy/10 bg-white px-6 py-20 text-center" data-testid="rentals-empty-state">
                        <p className="font-serif text-3xl text-navy">Our rentals move quickly.</p>
                        <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">
                            Call {BRAND.phone} to join the list and hear about upcoming homes first.
                        </p>
                        <a href={BRAND.phoneHref} data-testid="rentals-empty-call-button" className="inline-flex items-center justify-center gap-2 mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]">
                            <Phone size={15} /> Call {BRAND.phone}
                        </a>
                    </motion.div>
                )}
            </section>

            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-5">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">Looking for a rental?</h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5">
                            Tell us what you're looking for — budget, bedrooms, timing — and we'll match you with
                            current and upcoming homes. Every Culver rental is professionally managed, so maintenance
                            requests actually get answered.
                        </p>
                    </Reveal>
                    <Reveal className="lg:col-span-7" delay={0.1}>
                        <div className="bg-white border border-navy/10 p-7 md:p-9 shadow-sm">
                            <InquiryForm type="tenant" title="Tenant inquiry" subtitle="We'll respond within one business day." />
                        </div>
                    </Reveal>
                </div>
            </section>
        </Page>
    );
}
