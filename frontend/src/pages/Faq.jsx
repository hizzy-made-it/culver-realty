import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { Page, Reveal, StaggerGroup, StaggerItem, EASE, DUR, useReducedMotion } from "../components/motion";
import Seo from "../components/site/Seo";
import PageHero from "../components/site/PageHero";
import { BRAND } from "../lib/site";
import FAQS from "../content/faqs.json";


const FAQ_LD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
};

export default function Faq() {
    const reduce = useReducedMotion();
    const [open, setOpen] = useState(0);

    return (
        <Page>
            <Seo
                title="Frequently Asked Questions | Culver Realty & Property Management"
                description="Answers about service areas, property management, leasing, rent payments, maintenance, home valuations, and Home Away home watch from Culver Realty in Ormond Beach, FL."
                jsonLd={FAQ_LD}
            />
            <PageHero
                eyebrow="FAQ"
                title="Frequently asked questions"
                sub="Straight answers for tenants, owners, buyers, and sellers. Anything else — we're one call away."
                video="/api/uploads/seed/video/faq-office"
                poster="/api/uploads/seed/video/faq-office-poster.jpg"
                alt="Culver Realty & Property Management office"
                size="md"
                testid="faq-hero"
            />
            <section className="max-w-4xl mx-auto px-4 sm:px-8 py-14 md:py-20" data-testid="faq-list">
                <StaggerGroup className="border-t border-navy/10" stagger={0.05}>
                    {FAQS.map((faq, i) => (
                        <StaggerItem key={faq.q}>
                            <div className="border-b border-navy/10">
                                <button
                                    onClick={() => setOpen(open === i ? -1 : i)}
                                    data-testid={`faq-question-${i}`}
                                    aria-expanded={open === i}
                                    className="w-full flex items-center justify-between gap-4 py-6 text-left min-h-[44px] group"
                                >
                                    <span className="font-serif text-xl sm:text-2xl font-semibold text-navy group-hover:text-gold transition-colors">
                                        {faq.q}
                                    </span>
                                    <motion.span
                                        animate={{ rotate: open === i ? 180 : 0 }}
                                        transition={{ duration: DUR.fast, ease: EASE }}
                                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 border border-navy/20 text-navy group-hover:border-gold group-hover:text-gold transition-colors"
                                    >
                                        <ChevronDown size={16} />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open === i && (
                                        <motion.div
                                            initial={reduce ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                            transition={{ duration: reduce ? DUR.fast : 0.3, ease: EASE }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-base text-slate-600 leading-relaxed pb-7 pr-4 sm:pr-16" data-testid={`faq-answer-${i}`}>
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
                <Reveal className="mt-14 bg-navy text-bone p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-serif text-2xl font-medium">Still have a question?</h2>
                        <p className="text-sm text-bone/70 mt-2">Our team is happy to help — no online forms required.</p>
                    </div>
                    <a href={BRAND.phoneHref} data-testid="faq-call-button" className="btn-sheen inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px] shrink-0">
                        <Phone size={15} /> Call {BRAND.phone}
                    </a>
                </Reveal>
            </section>
        </Page>
    );
}
