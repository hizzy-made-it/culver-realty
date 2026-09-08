import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import { BRAND } from "../lib/site";

const POINTS = [
    "Local guidance on every neighborhood from Ormond-by-the-Sea to Plantation Bay",
    "Early insight into homes before they reach the big portals",
    "Clear counsel on pricing, inspections, insurance, and coastal considerations",
    "Skilled negotiation and a calm path from contract to closing",
];

export default function Buyers() {
    return (
        <Page>
            <Seo
                title="Buy a Home in Ormond Beach & Volusia County | Culver Realty"
                description="First-home and move-up buyers on the Halifax coast trust Culver Realty & Property Management for local expertise and honest guidance. Call 386.414.3445."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">For buyers</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Find your place on the coast — with someone who lives here
                        </h1>
                        <p className="text-bone/75 mt-6 max-w-2xl leading-relaxed">
                            We like to consider ourselves experts in the areas we serve — because we live here, shop
                            here, and have fun here. Whether it's your first home or your forever home, we understand
                            the unique needs that come with what could be the largest purchase of your life.
                        </p>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <Reveal className="lg:col-span-6">
                    <div className="aspect-[4/3] overflow-hidden">
                        <img src="/api/uploads/seed/extra-home-2.jpg" alt="Coastal Florida home" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                </Reveal>
                <Reveal className="lg:col-span-6" delay={0.1}>
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">How Culver helps buyers</h2>
                    <p className="text-base text-slate-600 leading-relaxed mt-5">
                        We've helped buyers relocating from New York, New Jersey, Connecticut, Canada, and Europe — and
                        neighbors moving across town. Our involvement in this community means we often see new
                        opportunities before they're even announced.
                    </p>
                    <ul className="mt-7 space-y-4">
                        {POINTS.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-sm text-slate-700">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-seaglass-muted text-seaglass shrink-0 mt-0.5">
                                    <Check size={13} />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap gap-4 mt-9">
                        <Link to="/listings" data-testid="buyers-browse-button" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all min-h-[44px]">
                            Browse listings <ArrowRight size={15} />
                        </Link>
                        <a href={BRAND.phoneHref} data-testid="buyers-call-button" className="inline-flex items-center justify-center px-7 py-3.5 border border-navy text-navy text-sm font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all min-h-[44px]">
                            Call {BRAND.phone}
                        </a>
                    </div>
                </Reveal>
            </section>
        </Page>
    );
}
