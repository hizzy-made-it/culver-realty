import { Phone, Mail, MapPin } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import InquiryForm from "../components/site/InquiryForm";
import { BRAND } from "../lib/site";

export default function Contact() {
    return (
        <Page>
            <Seo
                title="Contact Culver Realty & Property Management | Ormond Beach, FL"
                description="Call 386.414.3445 or email Tracie.Culver@tculverrealty.com. Office: 2412 John Anderson Drive, Ormond Beach, FL 32176."
            />
            <PageHero
                eyebrow="Contact"
                title="Let's start the conversation"
                sub="Buying, selling, investing, or looking for a rental or a manager you can trust — we're a phone call away."
                size="md"
                testid="contact-hero"
            />
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <Reveal className="lg:col-span-5">
                    <div className="space-y-2" data-testid="contact-info">
                        <a href={BRAND.phoneHref} data-testid="contact-phone" className="flex items-center gap-4 bg-white border border-navy/10 p-5 hover:border-gold transition-colors group min-h-[44px]">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone group-hover:bg-gold transition-colors shrink-0">
                                <Phone size={18} />
                            </span>
                            <span>
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Call or text</span>
                                <span className="block font-serif text-xl font-semibold text-navy">{BRAND.phone}</span>
                            </span>
                        </a>
                        <a href={BRAND.emailHref} data-testid="contact-email" className="flex items-center gap-4 bg-white border border-navy/10 p-5 hover:border-gold transition-colors group min-h-[44px]">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone group-hover:bg-gold transition-colors shrink-0">
                                <Mail size={18} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Email</span>
                                <span className="block font-serif text-lg font-semibold text-navy break-all">{BRAND.email}</span>
                            </span>
                        </a>
                        <div className="flex items-center gap-4 bg-white border border-navy/10 p-5">
                            <span className="inline-flex items-center justify-center w-11 h-11 bg-navy text-bone shrink-0">
                                <MapPin size={18} />
                            </span>
                            <span>
                                <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">Office</span>
                                <span className="block font-serif text-lg font-semibold text-navy">{BRAND.address}</span>
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 border border-navy/10 overflow-hidden" data-testid="contact-map">
                        <iframe
                            title="Map of Culver Realty office"
                            width="100%"
                            height="260"
                            loading="lazy"
                            src="https://www.openstreetmap.org/export/embed.html?bbox=-81.075%2C29.330%2C-81.045%2C29.355&layer=mapnik&marker=29.3425%2C-81.060"
                        />
                    </div>
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
