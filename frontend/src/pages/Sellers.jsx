import { Check } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import InquiryForm from "../components/site/InquiryForm";

const STEPS = [
    { title: "Strategic pricing", copy: "A data-informed price backed by street-level knowledge of Ormond Beach, Daytona, and Flagler — not a generic algorithm." },
    { title: "Marketing that shows", copy: "Professional presentation, photography, and exposure designed to protect your interests and maximize value." },
    { title: "Negotiation", copy: "Experienced, steady negotiation from first offer through inspection and appraisal." },
    { title: "Seamless closing", copy: "Clear communication at every step so closing day feels like a formality, not a hurdle." },
];

export default function Sellers() {
    return (
        <Page>
            <Seo
                title="Sell Your Home in Ormond Beach & Volusia County | Culver Realty"
                description="Pricing, marketing, negotiation, and seamless closings across Volusia and Flagler Counties. Request a home valuation from Culver Realty & Property Management."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">For sellers</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Selling well is a craft. We treat it that way.
                        </h1>
                        <p className="text-bone/75 mt-6 max-w-2xl leading-relaxed">
                            Selling a property can be long and complicated — regardless of how good the market is.
                            Whether you're a first-time seller or an experienced pro, our team will help you through
                            every step, from pricing to marketing to finding your next home.
                        </p>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {STEPS.map((s, i) => (
                        <Reveal key={s.title} delay={i * 0.06}>
                            <div className="bg-white border border-navy/10 p-8 h-full" data-testid={`seller-step-${i}`}>
                                <p className="font-serif text-5xl text-gold/60 font-semibold">{String(i + 1).padStart(2, "0")}</p>
                                <h3 className="font-serif text-2xl font-semibold text-navy mt-4">{s.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mt-3">{s.copy}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>
            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-6">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            What's your home worth on today's coast?
                        </h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5">
                            Request a no-obligation valuation. We'll look at recent sales around your neighborhood —
                            and the details portals miss, like condition, upgrades, and street appeal.
                        </p>
                        <ul className="mt-6 space-y-3">
                            {["Recent comparable sales", "Coastal market trends", "A clear plan to list, if and when you're ready"].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-white text-seaglass shrink-0 mt-0.5">
                                        <Check size={13} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                    <Reveal className="lg:col-span-6" delay={0.1}>
                        <div className="bg-white border border-navy/10 p-7 md:p-9 shadow-sm">
                            <InquiryForm
                                type="valuation"
                                title="Request a home valuation"
                                subtitle="Tell us about your property and we'll follow up within one business day."
                            />
                        </div>
                    </Reveal>
                </div>
            </section>
        </Page>
    );
}
