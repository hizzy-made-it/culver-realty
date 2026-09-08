import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import { BRAND } from "../lib/site";

const VALUES = [
    { title: "Relationships first", copy: "We are committed to clear communication, strong ethics, and long-term success for our clients." },
    { title: "Local expertise", copy: "Deep roots in Volusia and Flagler Counties — we live here, shop here, and have fun here." },
    { title: "Integrity & results", copy: "Exceptional service delivered with integrity, expertise, and results you can measure." },
];

export default function About() {
    return (
        <Page>
            <Seo
                title="About Culver Realty & Property Management | Ormond Beach, FL"
                description="A full-service brokerage and property management company with deep roots in Volusia and Flagler Counties. Relationships come first."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">About us</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Deep roots on the Halifax coast
                        </h1>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <Reveal className="lg:col-span-7">
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                        A brokerage built on relationships
                    </h2>
                    <p className="text-base text-slate-600 leading-relaxed mt-6">
                        Culver Realty and Property Management is a full-service real estate brokerage and property
                        management company with deep roots in Volusia and Flagler Counties. We proudly serve our local
                        communities by delivering exceptional service with integrity, expertise, and results. We
                        specialize in residential sales, investment properties, rentals, and comprehensive property
                        management solutions.
                    </p>
                    <p className="text-base text-slate-600 leading-relaxed mt-4">
                        Our experienced team understands that every client's goals are unique. Whether you're a
                        homeowner, investor, buyer, or tenant, you can count on us for knowledgeable service, local
                        expertise, and a team that truly cares about your real estate goals.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                        {VALUES.map((v) => (
                            <div key={v.title} className="border-t-2 border-gold pt-5" data-testid={`value-${v.title.toLowerCase().replace(/\s+/g, "-")}`}>
                                <h3 className="font-serif text-xl font-semibold text-navy">{v.title}</h3>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{v.copy}</p>
                            </div>
                        ))}
                    </div>
                </Reveal>
                <Reveal className="lg:col-span-5" delay={0.1}>
                    <div className="bg-navy text-bone p-8 md:p-10">
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-5">Visit our office</p>
                        <p className="font-serif text-2xl font-semibold leading-snug">{BRAND.address}</p>
                        <div className="border-t border-bone/15 mt-6 pt-6 space-y-3">
                            <a href={BRAND.phoneHref} data-testid="about-office-phone" className="flex items-center gap-3 text-sm text-bone/85 hover:text-gold transition-colors min-h-[44px]">
                                <Phone size={16} className="text-gold" /> {BRAND.phone}
                            </a>
                            <a href={BRAND.emailHref} data-testid="about-office-email" className="flex items-center gap-3 text-sm text-bone/85 hover:text-gold transition-colors min-h-[44px] break-all">
                                <Mail size={16} className="text-gold shrink-0" /> {BRAND.email}
                            </a>
                            <p className="flex items-center gap-3 text-sm text-bone/85 min-h-[44px]">
                                <MapPin size={16} className="text-gold" /> Serving Ormond Beach · Daytona Beach · Volusia · Flagler
                            </p>
                        </div>
                        <div className="mt-6 border border-bone/15 overflow-hidden" data-testid="about-map">
                            <iframe
                                title="Map of Culver Realty office"
                                width="100%"
                                height="240"
                                loading="lazy"
                                src="https://www.openstreetmap.org/export/embed.html?bbox=-81.075%2C29.330%2C-81.045%2C29.355&layer=mapnik&marker=29.3425%2C-81.060"
                            />
                        </div>
                    </div>
                    <Link to="/contact" data-testid="about-contact-button" className="mt-6 inline-flex items-center justify-center gap-2 w-full px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px]">
                        Get in touch <ArrowRight size={15} />
                    </Link>
                </Reveal>
            </section>
        </Page>
    );
}
