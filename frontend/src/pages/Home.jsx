import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Phone, Mail, KeyRound, TrendingUp, ShieldCheck, Quote, ChevronDown } from "lucide-react";
import api from "../lib/api";
import { BRAND } from "../lib/site";
import { Page, Reveal, StaggerGroup, StaggerItem, EASE_OUT } from "../components/motion";
import ListingCard from "../components/site/ListingCard";
import Seo from "../components/site/Seo";
import HeroVideo from "../components/site/HeroVideo";
import HeroAtmosphere from "../components/site/HeroAtmosphere";
import KineticHeading from "../components/site/KineticHeading";

// Footage in the hero is generated from this listing's cover photo.
const HERO_LISTING = {
    slug: "68-bristol-ln-palm-coast",
    address: "68 Bristol Ln",
    city: "Palm Coast",
    price: "$789,000",
    video: "/api/uploads/seed/video/68-bristol-drone",
    poster: "/api/uploads/seed/video/68-bristol-drone-poster.jpg",
};

const LOCAL_BUSINESS_LD = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Culver Realty & Property Management",
    telephone: "+1-386-414-3445",
    email: "Tracie.Culver@tculverrealty.com",
    address: {
        "@type": "PostalAddress",
        streetAddress: "2412 John Anderson Drive",
        addressLocality: "Ormond Beach",
        addressRegion: "FL",
        postalCode: "32176",
        addressCountry: "US",
    },
    areaServed: ["Ormond Beach", "Daytona Beach", "Volusia County", "Flagler County"],
};

const PILLARS = [
    {
        icon: KeyRound,
        title: "Buy & Sell",
        copy: "From first homes to forever homes — strategic pricing, honest counsel, and seamless closings across the Halifax coast.",
        to: "/buyers",
        img: "/api/uploads/seed/extra-home-1.jpg",
        testid: "pillar-buy-sell",
    },
    {
        icon: TrendingUp,
        title: "Invest",
        copy: "Build a portfolio with local insight. We source, negotiate, and manage investment properties under one roof.",
        to: "/investors",
        img: "/api/uploads/seed/extra-home-3.jpg",
        testid: "pillar-invest",
    },
    {
        icon: ShieldCheck,
        title: "Property Management",
        copy: "Careful tenant screening, proactive maintenance, and transparent reporting — peace of mind for owners.",
        to: "/management",
        img: "/api/uploads/seed/home-away.jpg",
        testid: "pillar-management",
    },
];

const TESTIMONIALS = [
    { quote: "Tracie knew every street we asked about — and steered us away from two homes before finding the right one.", name: "J.M.", detail: "Buyer, Ormond Beach" },
    { quote: "Our rental has been occupied and cared for since day one. The communication is exactly what we hoped for.", name: "R. & S. Dalton", detail: "Owners, Flagler County" },
    { quote: "Pricing, photography, negotiation — everything was handled. We closed above asking in under three weeks.", name: "A. Whitfield", detail: "Seller, Daytona Beach" },
];

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const reduce = useReducedMotion();

    // Hero copy fades and lifts as the footage scrolls away underneath it.
    const { scrollY } = useScroll();
    const heroContentOpacity = useTransform(scrollY, [0, 420], [1, reduce ? 1 : 0]);
    const heroContentY = useTransform(scrollY, [0, 420], [0, reduce ? 0 : -40]);

    // Closing image: gentle parallax as it enters the viewport.
    const ctaRef = useRef(null);
    const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "end start"] });
    const ctaImageY = useTransform(ctaProgress, [0, 1], [reduce ? "0%" : "-12%", reduce ? "0%" : "12%"]);

    useEffect(() => {
        api.get("/properties", { params: { featured: true, status: "live" } })
            .then((r) => setFeatured(r.data.properties.slice(0, 6)))
            .catch(() => {});
    }, []);

    return (
        <Page>
            <Seo
                title="Culver Realty & Property Management | Ormond Beach Real Estate"
                description="Residential sales, investments, rentals, and hands-on property management in Ormond Beach, Daytona Beach, Volusia and Flagler Counties. Call 386.414.3445."
                jsonLd={LOCAL_BUSINESS_LD}
            />

            <section className="relative min-h-[88vh] flex items-end overflow-hidden bg-navy" data-testid="home-hero">
                <HeroVideo src={HERO_LISTING.video} poster={HERO_LISTING.poster} alt={`Aerial view of ${HERO_LISTING.address}, ${HERO_LISTING.city}`} parallax />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy/40 to-navy/20" />
                <HeroAtmosphere subtle />

                <motion.div
                    style={{ opacity: heroContentOpacity, y: heroContentY }}
                    className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-20 pt-40 w-full"
                >
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: EASE_OUT }}
                        className="flex items-center gap-3 mb-5"
                    >
                        <motion.span
                            className="h-px w-8 bg-gold origin-left"
                            initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
                            animate={reduce ? { opacity: 1 } : { scaleX: 1 }}
                            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
                        />
                        <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Ormond Beach · Halifax Coast · Florida</p>
                    </motion.div>
                    <KineticHeading
                        as="h1"
                        title={[
                            { text: "Realty and property management for Ormond Beach, done with " },
                            { text: "integrity.", className: "italic text-gold" },
                        ]}
                        className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] font-medium text-bone max-w-3xl"
                        delay={0.15}
                        data-testid="hero-headline"
                    />
                    <motion.p
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.75 }}
                        className="text-base md:text-lg text-bone/80 mt-6 max-w-xl leading-relaxed"
                    >
                        Sales, investments, rentals, and hands-on management across Volusia and Flagler Counties.
                    </motion.p>
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.9 }}
                        className="mt-9 flex flex-wrap items-center gap-4"
                    >
                        <Link
                            to="/listings"
                            data-testid="hero-view-listings-button"
                            className="btn-sheen inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-gold text-white text-sm font-semibold tracking-[0.2em] uppercase hover:bg-gold-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-navy-deep/30 min-h-[52px]"
                        >
                            View listings <ArrowRight size={16} />
                        </Link>
                        <Link
                            to={`/listings/${HERO_LISTING.slug}`}
                            data-testid="hero-now-showing"
                            className="group inline-flex items-center gap-3 pl-3 pr-4 py-2.5 bg-navy-deep/40 backdrop-blur-md border border-bone/15 text-bone/90 text-xs tracking-wide hover:border-gold/60 hover:bg-navy-deep/60 transition-colors min-h-[44px]"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-gold animate-pulse-dot" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                            </span>
                            <span>
                                <span className="text-bone/60">Now showing</span>{" "}
                                <span className="font-semibold text-bone">{HERO_LISTING.address}</span>
                                <span className="text-bone/60"> · {HERO_LISTING.city}</span>{" "}
                                <span className="text-gold font-semibold">{HERO_LISTING.price}</span>
                            </span>
                            <ArrowRight size={13} className="text-gold transition-transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.a
                    href="#featured"
                    aria-label="Scroll to featured listings"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.6 }}
                    style={{ opacity: heroContentOpacity }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-bone/60 hover:text-gold transition-colors"
                    data-testid="hero-scroll-cue"
                >
                    <span className="text-[0.6rem] uppercase tracking-[0.3em]">Explore</span>
                    <ChevronDown size={16} className="animate-float" />
                </motion.a>
            </section>

            <section className="border-y border-navy/10 bg-sand-100 overflow-hidden" data-testid="market-strip">
                <div className="relative py-5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-sand-100 to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-sand-100 to-transparent z-10" />
                    <div className="flex w-max animate-marquee will-change-transform" aria-hidden="false">
                        {[0, 1].map((dup) => (
                            <div key={dup} className="flex items-center shrink-0" aria-hidden={dup === 1}>
                                {BRAND.markets.map((m) => (
                                    <span key={`${dup}-${m}`} className="flex items-center text-xs uppercase tracking-[0.25em] font-semibold text-navy/60 px-8">
                                        {m}
                                        <span className="ml-16 h-1 w-1 rounded-full bg-gold/70" />
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="featured" className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-20 md:py-28 scroll-mt-20" data-testid="featured-listings">
                <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Featured</p>
                            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                                Current listings on the coast
                            </h2>
                        </div>
                        <Link to="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold transition-colors" data-testid="featured-view-all-link">
                            View all <ArrowRight size={15} />
                        </Link>
                    </div>
                </Reveal>
                {featured.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {featured.map((p, i) => (
                            <ListingCard key={p.id} property={p} index={i} />
                        ))}
                    </div>
                ) : (
                    <Reveal className="border border-navy/10 bg-white p-14 text-center">
                        <p className="font-serif text-2xl text-navy">New listings are on the way.</p>
                        <p className="text-sm text-slate-500 mt-2">
                            Call <a href={BRAND.phoneHref} className="text-gold font-semibold">{BRAND.phone}</a> to hear about properties before they publish.
                        </p>
                    </Reveal>
                )}
            </section>

            <section className="bg-navy text-bone py-20 md:py-28" data-testid="service-pillars">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">What we do</p>
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium max-w-2xl">
                            One local team for every real estate goal
                        </h2>
                    </Reveal>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                        {PILLARS.map((pillar, i) => (
                            <Reveal key={pillar.title} delay={i * 0.08}>
                                <Link to={pillar.to} className="group block h-full" data-testid={pillar.testid}>
                                    <div className="relative aspect-[16/10] overflow-hidden mb-6">
                                        <img
                                            src={pillar.img}
                                            alt={pillar.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 to-transparent" />
                                        <span className="absolute bottom-4 left-4 inline-flex items-center justify-center w-11 h-11 bg-gold text-white">
                                            <pillar.icon size={20} />
                                        </span>
                                    </div>
                                    <h3 className="font-serif text-2xl font-semibold group-hover:text-gold transition-colors">{pillar.title}</h3>
                                    <p className="text-sm text-bone/70 mt-2 leading-relaxed">{pillar.copy}</p>
                                    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-gold mt-4">
                                        Learn more <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-20 md:py-28" data-testid="about-preview">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                    <Reveal className="lg:col-span-7">
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Our promise</p>
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy leading-tight">
                            Relationships come first. Always.
                        </h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-6">
                            Culver Realty and Property Management is a full-service real estate brokerage and property
                            management company with deep roots in Volusia and Flagler Counties. We proudly serve our
                            local communities by delivering exceptional service with integrity, expertise, and results.
                        </p>
                        <p className="text-base text-slate-600 leading-relaxed mt-4">
                            Whether you're buying your first home or your forever home, selling a property, building a
                            real estate portfolio, or seeking reliable management for your investment home — we provide
                            guidance every step of the way.
                        </p>
                        <Link
                            to="/about"
                            data-testid="about-read-more-link"
                            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 border border-navy text-navy text-sm font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all duration-200 min-h-[44px]"
                        >
                            Our story <ArrowRight size={15} />
                        </Link>
                    </Reveal>
                    <Reveal className="lg:col-span-5" delay={0.1}>
                        <div className="bg-navy text-bone p-8 md:p-10">
                            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-5">Talk with Tracie</p>
                            <p className="font-serif text-3xl font-semibold">{BRAND.broker}</p>
                            <p className="text-sm text-bone/70 mt-1">Broker · {BRAND.name}</p>
                            <div className="border-t border-bone/15 mt-6 pt-6 space-y-3">
                                <a href={BRAND.phoneHref} data-testid="about-call-link" className="flex items-center gap-3 text-sm text-bone/85 hover:text-gold transition-colors min-h-[44px]">
                                    <Phone size={16} className="text-gold" /> {BRAND.phone}
                                </a>
                                <a href={BRAND.emailHref} data-testid="about-email-link" className="flex items-center gap-3 text-sm text-bone/85 hover:text-gold transition-colors min-h-[44px] break-all">
                                    <Mail size={16} className="text-gold shrink-0" /> {BRAND.email}
                                </a>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="bg-sand-200 py-20 md:py-28" data-testid="testimonials">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Kind words</p>
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            A history of happy homeowners
                        </h2>
                    </Reveal>
                    <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        {TESTIMONIALS.map((t, i) => (
                            <StaggerItem key={t.name}>
                                <figure className="bg-bone p-8 h-full border border-navy/5" data-testid={`testimonial-${i}`}>
                                    <Quote size={22} className="text-gold mb-4" />
                                    <blockquote className="font-serif text-lg leading-relaxed text-navy italic">
                                        “{t.quote}”
                                    </blockquote>
                                    <figcaption className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                                        {t.name} · <span className="text-gold">{t.detail}</span>
                                    </figcaption>
                                </figure>
                            </StaggerItem>
                        ))}
                    </StaggerGroup>
                </div>
            </section>

            <section ref={ctaRef} className="relative overflow-hidden bg-navy-deep" data-testid="final-cta">
                <motion.div style={{ y: ctaImageY }} className="absolute -inset-y-[14%] inset-x-0 will-change-transform">
                    <img src="/api/uploads/seed/beach-hero.jpg" alt="Ormond Beach shoreline" loading="lazy" className="w-full h-full object-cover animate-kenburns" />
                </motion.div>
                <div className="absolute inset-0 bg-navy-deep/70" />
                <HeroAtmosphere subtle />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-24 md:py-32 text-center">
                    <Reveal>
                        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight font-medium text-bone max-w-2xl mx-auto leading-tight">
                            Let's talk about your next move on the coast
                        </h2>
                        <p className="text-bone/80 mt-5 max-w-xl mx-auto">
                            Schedule a conversation — no pressure, just local expertise and clear answers.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mt-9">
                            <Link
                                to="/contact"
                                data-testid="final-cta-contact-button"
                                className="inline-flex items-center justify-center px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover active:scale-[0.98] transition-all shadow-md min-h-[44px]"
                            >
                                Schedule a conversation
                            </Link>
                            <a
                                href={BRAND.phoneHref}
                                data-testid="final-cta-call-button"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-md border border-white/40 text-white text-sm font-semibold tracking-wider uppercase hover:bg-white/25 transition-all min-h-[44px]"
                            >
                                <Phone size={15} /> {BRAND.phone}
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
        </Page>
    );
}
