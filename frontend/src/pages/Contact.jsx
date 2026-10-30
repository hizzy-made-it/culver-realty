import { Phone, Mail, MapPin } from "lucide-react";
import { Page, Reveal, StaggerGroup, StaggerItem } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import InquiryForm from "../components/site/InquiryForm";
import { BRAND, MAP_URL, MAP_EMBED_URL } from "../lib/site";

export default function Contact() {
    return (
        <Page>
            <Seo
                title="Contact Culver Realty & Property Management | Ormond Beach, FL"
                description="Call 386.414.3445 or email tracie.culver@tculverrealty.com. Office: 2412 John Anderson Drive, Ormond Beach, FL 32176."
            />
            <PageHero
                eyebrow="Contact"
                title="Let's start the conversation"
                sub="Buying, selling, investing, or looking for a rental or a manager you can trust — we're a phone call away."
                video="/api/uploads/seed/video/contact-office"
                poster="/api/uploads/seed/video/contact-office-poster.jpg"
                alt="Culver Realty & Property Management office in Ormond Beach"
                size="md"
                testid="contact-hero"
            />
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <Reveal className="lg:col-span-5">
                    <StaggerGroup className="space-y-2" data-testid="contact-info">
                        <StaggerItem><a href={BRAND.phoneHref} data-testid="contact-phone" className="card-hover flex items-center gap-4 bg-white border border-navy/10 p-5 hover:border-gold transition-colors group min-h-[44px]">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone group-hover:bg-gold transition-colors shrink-0">
                                <Phone size={18} />
                            </span>
                            <span>
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Call or text</span>
                                <span className="block font-serif text-xl font-semibold text-navy">{BRAND.phone}</span>
                            </span>
                        </a></StaggerItem>
                        <StaggerItem><a href={BRAND.emailHref} data-testid="contact-email" className="card-hover flex items-center gap-4 bg-white border border-navy/10 p-5 hover:border-gold transition-colors group min-h-[44px]">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone group-hover:bg-gold transition-colors shrink-0">
                                <Mail size={18} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Email</span>
                                <span className="block font-serif text-lg font-semibold text-navy break-all">{BRAND.email}</span>
                            </span>
                        </a></StaggerItem>
                        <StaggerItem><div className="card-hover flex items-center gap-4 bg-white border border-navy/10 p-5">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone shrink-0">
                                <MapPin size={18} />
                            </span>
                            <span>
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Office</span>
                                <span className="block font-serif text-lg font-semibold text-navy">{BRAND.address}</span>
                            </span>
                        </div></StaggerItem>
                    </StaggerGroup>
                    <div className="mt-6 border border-navy/10 overflow-hidden" data-testid="contact-map">
                        <iframe
                            title="Google Map of Culver Realty & Property Management, 2412 John Anderson Drive, Ormond Beach"
                            width="100%"
                            height="300"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ border: 0 }}
                            src={MAP_EMBED_URL}
                        />
                    </div>
                    <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-xs font-semibold tracking-wider uppercase text-navy hover:text-gold min-h-[44px]" data-testid="contact-directions">
                        <MapPin size={14} /> Get directions on Google Maps
                    </a>
                </Reveal>
                <Reveal className="lg:col-span-7" delay={0.1}>
                    <div className="bg-white border border-navy/10 p-7 md:p-10 shadow-sm">
                        <InquiryForm type="contact" title="Send a message" subtitle="We reply within one business day — usually much sooner." />
                    </div>
                </Reveal>
            </section>
        </Page>
    );
}
