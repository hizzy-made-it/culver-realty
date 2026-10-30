import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Page, Reveal, StaggerGroup, StaggerItem } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import InquiryForm from "../components/site/InquiryForm";
import ListingCard from "../components/site/ListingCard";
import FaqList from "../components/site/FaqList";
import NotFound from "./NotFound";
import api from "../lib/api";
import { BRAND } from "../lib/site";
import MANAGEMENT from "../content/management.json";
import CITIES from "../content/cities.json";

export default function CityManagement() {
    const { city: slug } = useParams();
    const city = CITIES.find((c) => c.slug === slug);
    const [rentals, setRentals] = useState([]);

    useEffect(() => {
        if (!city) return;
        setRentals([]);
        api.get("/properties", { params: { listing_type: "rent", status: "live", city: city.name } })
            .then((r) => setRentals(r.data.properties || []))
            .catch(() => setRentals([]));
    }, [city]);

    if (!city) return <NotFound />;

    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: city.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    };
    const others = CITIES.filter((c) => c.slug !== city.slug);

    return (
        <Page>
            <Seo title={city.title} description={city.description} jsonLd={faqLd} />
            <PageHero
                eyebrow={city.eyebrow}
                title={city.h1}
                sub={city.answer}
                video="/api/uploads/seed/video/management-towers"
                poster="/api/uploads/seed/video/management-towers-poster.jpg"
                alt="Aerial view of beachfront condominium towers in Volusia County"
                size="md"
                testid={`city-hero-${city.slug}`}
            >
                <a href={BRAND.phoneHref} className="btn-sheen inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px]">
                    <Phone size={15} /> Call {BRAND.phone}
                </a>
            </PageHero>

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Reveal className="lg:col-span-5">
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                        Local management in {city.name}
                    </h2>
                    {city.local.map((para) => (
                        <p key={para} className="text-base text-slate-600 leading-relaxed mt-4">{para}</p>
                    ))}
                </Reveal>
                <StaggerGroup className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6" stagger={0.05}>
                    {MANAGEMENT.sections.map((s) => (
                        <StaggerItem key={s.id} className="h-full">
                            <div className="card-hover border border-navy/10 bg-white p-6 h-full">
                                <h3 className="font-serif text-xl font-semibold text-navy">{s.heading}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mt-2">{s.intro}</p>
                                <Link to={`/management#${s.id}`} className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-navy hover:text-gold mt-4 min-h-[44px]">
                                    How it works <ArrowRight size={13} />
                                </Link>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
            </section>

            {rentals.length > 0 && (
                <section className="bg-sand-200 py-14 md:py-20" data-testid="city-rentals">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            Current rentals in {city.name}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                            {rentals.slice(0, 6).map((p, i) => (
                                <ListingCard key={p.id} property={p} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <FaqList heading={`${city.name} property management questions`} faqs={city.faqs} testid="city-faq" />

            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-5">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            Own a rental in {city.name}?
                        </h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5">
                            Tell us about your property and we'll share expected rent, our approach to screening and
                            maintenance, and a straightforward management agreement.
                        </p>
                        <p className="text-sm text-slate-600 mt-6">
                            Also managing in{" "}
                            {others.map((c, i) => (
                                <span key={c.slug}>
                                    <Link to={`/property-management/${c.slug}`} className="text-navy font-semibold underline decoration-gold underline-offset-4 hover:text-gold">
                                        {c.name}
                                    </Link>
                                    {i < others.length - 2 ? ", " : i === others.length - 2 ? ", and " : "."}
                                </span>
                            ))}
                        </p>
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
        </Page>
    );
}
