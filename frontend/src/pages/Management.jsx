import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Page, Reveal, StaggerGroup, StaggerItem } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import InquiryForm from "../components/site/InquiryForm";
import ServiceSteps from "../components/site/ServiceSteps";
import FaqList from "../components/site/FaqList";
import MANAGEMENT from "../content/management.json";
import CITIES from "../content/cities.json";

// Server JSON-LD (backend/seo.py) is richer and wins on the landing request; this covers in-app navigation.
const FAQ_LD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MANAGEMENT.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Management() {
    return (
        <Page>
            <Seo title={MANAGEMENT.title} description={MANAGEMENT.description} jsonLd={FAQ_LD} />
            <PageHero
                eyebrow={MANAGEMENT.eyebrow}
                title={MANAGEMENT.h1}
                sub={MANAGEMENT.answer}
                video="/api/uploads/seed/video/management-towers"
                poster="/api/uploads/seed/video/management-towers-poster.jpg"
                alt="Aerial view of beachfront condominium towers in Daytona Beach"
                testid="management-hero"
            />

            {MANAGEMENT.sections.map((s, i) => (
                <ServiceSteps key={s.id} section={s} tone={i % 2 ? "dark" : "light"} />
            ))}

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20" data-testid="management-areas">
                <Reveal>
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">Areas we manage</h2>
                    <p className="text-base text-slate-600 leading-relaxed mt-4 max-w-2xl">
                        Rental homes across Volusia and Flagler Counties, managed from our office in Ormond Beach.
                    </p>
                </Reveal>
                <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8" stagger={0.05}>
                    {CITIES.map((c) => (
                        <StaggerItem key={c.slug}>
                            <Link
                                to={`/property-management/${c.slug}`}
                                className="card-hover flex items-center justify-between gap-3 border border-navy/10 bg-white p-5 hover:border-gold transition-colors min-h-[44px]"
                                data-testid={`management-area-${c.slug}`}
                            >
                                <span className="flex items-center gap-3">
                                    <MapPin size={16} className="text-gold shrink-0" />
                                    <span className="font-serif text-lg font-semibold text-navy">{c.name}</span>
                                </span>
                                <ArrowRight size={15} className="text-navy/50" />
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
                <p className="text-sm text-slate-600 mt-6">
                    Buying a rental first?{" "}
                    <Link to="/investors" className="text-navy font-semibold underline decoration-gold underline-offset-4 hover:text-gold">
                        See how we help investors acquire and manage under one roof
                    </Link>
                    .
                </p>
            </section>

            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-5">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            Your investment, managed like it's ours
                        </h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5">
                            Tell us about your property and we'll share how we'd care for it — expected rent, our
                            approach to screening and maintenance, and a straightforward management agreement. No
                            pressure, no jargon.
                        </p>
                        <div className="aspect-[16/10] overflow-hidden mt-8">
                            <img src="/api/uploads/seed/home-away.jpg" alt="Managed coastal property" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                    </Reveal>
                    <Reveal className="lg:col-span-7" delay={0.1}>
                        <div className="bg-white border border-navy/10 p-7 md:p-9 shadow-sm">
                            <InquiryForm
                                type="management"
                                title="Owner inquiry"
                                subtitle="Property address, current rent (if any), and your goals are a great start."
                            />
                        </div>
                    </Reveal>
                </div>
            </section>

            <FaqList heading="Property management questions" faqs={MANAGEMENT.faqs} testid="management-faq" />
        </Page>
    );
}
