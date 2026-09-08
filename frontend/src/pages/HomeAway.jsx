import { CalendarCheck, ShieldCheck, SlidersHorizontal, MapPin, Phone } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import InquiryForm from "../components/site/InquiryForm";
import { BRAND } from "../lib/site";

const FEATURES = [
    {
        icon: CalendarCheck,
        title: "Weekly inspections",
        copy: "Scheduled walk-throughs of your property — inside and out — so small issues never become expensive surprises while you're away.",
    },
    {
        icon: ShieldCheck,
        title: "Security & storm readiness",
        copy: "We check doors, windows, systems, and storm vulnerability, and coordinate the right professionals the moment something needs attention.",
    },
    {
        icon: SlidersHorizontal,
        title: "Customizable plans",
        copy: "Every home and every owner is different. Plans are tailored to your property, your schedule, and how you use your home.",
    },
    {
        icon: MapPin,
        title: "Volusia & Flagler focus",
        copy: "A local team that knows the coast — the weather, the vendors, and the neighborhoods — caring for your home as if it were our own.",
    },
];

export default function HomeAway() {
    return (
        <Page>
            <Seo
                title="Home Away — Home Watch & Care for 2nd Homeowners | Culver Realty, Ormond Beach"
                description="Home inspection and home watch services in Volusia & Flagler Counties for second homeowners, snowbirds, and travelers. Weekly inspections and customizable plans. Call 386.414.3445."
            />
            <PageHero
                eyebrow="Home Away by Culver Realty"
                title="Peace of mind while you're away"
                sub="Second homeowners, snowbirds, and travelers — discover peace of mind with Culver Realty's Home Away care. Our home inspection services ensure your property remains secure and well-maintained while you're away."
                video="/api/uploads/seed/video/home-away-sunset"
                poster="/api/uploads/seed/video/home-away-sunset-poster.jpg"
                alt="Pelicans over a Florida beach at sunset"
                minHeight="min-h-[70vh]"
                testid="home-away-hero"
            />

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <Reveal>
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy max-w-2xl">
                        Your home, cared for as if it were our own
                    </h2>
                    <p className="text-base text-slate-600 leading-relaxed mt-5 max-w-3xl">
                        With weekly inspections and customizable plans, we cater to your unique needs. Serving Volusia
                        and Flagler counties, our expert team safeguards your investment — so you can enjoy your time
                        away without worrying about what's happening at home.
                    </p>
                </Reveal>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} delay={i * 0.06}>
                            <div className="border border-navy/10 bg-white p-8 h-full flex gap-5" data-testid={`home-away-feature-${i}`}>
                                <span className="inline-flex items-center justify-center w-11 h-11 bg-seaglass-muted text-seaglass shrink-0">
                                    <f.icon size={20} />
                                </span>
                                <div>
                                    <h3 className="font-serif text-2xl font-semibold text-navy">{f.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mt-2">{f.copy}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-5">
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Get started</p>
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            Tell us about your home
                        </h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5">
                            Share your property address, how often you're away, and what matters most to you. We'll
                            follow up with a plan and straightforward pricing.
                        </p>
                        <a href={BRAND.phoneHref} data-testid="home-away-call-button" className="inline-flex items-center justify-center gap-2 mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]">
                            <Phone size={15} /> Call {BRAND.phone}
                        </a>
                    </Reveal>
                    <Reveal className="lg:col-span-7" delay={0.1}>
                        <div className="bg-white border border-navy/10 p-7 md:p-9 shadow-sm">
                            <InquiryForm
                                type="home_away"
                                title="Home Away inquiry"
                                subtitle="Property address and your typical time away are a great start."
                            />
                        </div>
                    </Reveal>
                </div>
            </section>
        </Page>
    );
}
