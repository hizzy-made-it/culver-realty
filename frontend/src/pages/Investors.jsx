import { Link } from "react-router-dom";
import { ArrowRight, Building2, TrendingUp, ShieldCheck } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import { BRAND } from "../lib/site";

const ITEMS = [
    { icon: TrendingUp, title: "Acquisition", copy: "We source rentals and value-add properties with honest rent and renovation projections for the Ormond–Daytona–Flagler corridor." },
    { icon: Building2, title: "Portfolio guidance", copy: "From your first duplex to a dozen doors — local insight on neighborhoods, flood zones, insurance, and tenant demand." },
    { icon: ShieldCheck, title: "Management under one roof", copy: "Buy it, then hand us the keys. Screening, maintenance, and transparent reporting from the same team that helped you acquire it." },
];

export default function Investors() {
    return (
        <Page>
            <Seo
                title="Investment Properties & Management in Volusia & Flagler | Culver Realty"
                description="Investment property acquisition and hands-on property management under one roof in Ormond Beach, Daytona Beach, and Flagler County."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">For investors</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Investment properties and management, under one roof
                        </h1>
                        <p className="text-bone/75 mt-6 max-w-2xl leading-relaxed">
                            Building a real estate portfolio takes more than listings — it takes local knowledge of what
                            rents, what sells, and what to avoid. We help you acquire with confidence, then manage with care.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-9">
                            <Link to="/listings?tab=rent" data-testid="investors-rentals-button" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover active:scale-[0.98] transition-all min-h-[44px]">
                                See rental inventory <ArrowRight size={15} />
                            </Link>
                            <Link to="/management" data-testid="investors-management-button" className="inline-flex items-center justify-center px-7 py-3.5 border border-bone/40 text-bone text-sm font-semibold tracking-wider uppercase hover:bg-bone hover:text-navy transition-all min-h-[44px]">
                                Management services
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ITEMS.map((item, i) => (
                        <Reveal key={item.title} delay={i * 0.08}>
                            <div className="border border-navy/10 bg-white p-8 h-full" data-testid={`investor-item-${i}`}>
                                <span className="inline-flex items-center justify-center w-11 h-11 bg-seaglass-muted text-seaglass">
                                    <item.icon size={20} />
                                </span>
                                <h3 className="font-serif text-2xl font-semibold text-navy mt-5">{item.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mt-3">{item.copy}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="mt-16 bg-navy text-bone p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium">Let's talk numbers.</h2>
                        <p className="text-sm text-bone/70 mt-2 max-w-lg">
                            Tell us your goals and budget — we'll bring you real opportunities, not just listings.
                        </p>
                    </div>
                    <a href={BRAND.phoneHref} data-testid="investors-call-button" className="inline-flex items-center justify-center px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px] shrink-0">
                        Call {BRAND.phone}
                    </a>
                </Reveal>
            </section>
        </Page>
    );
}
