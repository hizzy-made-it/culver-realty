import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import { BRAND } from "../lib/site";

const FAQS = [
    {
        q: "How do I request maintenance?",
        a: "For any maintenance requests, simply contact our office directly, and we will promptly coordinate the necessary repairs on your behalf. There's no need to submit requests online — just give us a call, and our team will immediately reach out to the maintenance professional best suited to handle the issue. We strive to ensure that all concerns are addressed quickly and efficiently, keeping your living experience comfortable and worry-free.",
    },
    {
        q: "What is the process for leasing a property?",
        a: "Leasing a property with us is a straightforward process. Begin by exploring our available listings to find a property that meets your requirements. Once you've chosen a property, reach out to our team to schedule a viewing and initiate the leasing process. We'll assist you with the necessary steps and paperwork to secure your new rental.",
    },
    {
        q: "How can I pay my rent?",
        a: "Paying rent with Culver Realty and Property Management is simple and straightforward. For your convenience, rent payments can be dropped off directly at our office during regular business hours. We kindly ask that all payments be placed in a sealed envelope with your name and property address clearly noted to ensure proper credit. Our team is always available to assist or answer any questions when you stop by, making the payment process as smooth and personal as possible.",
    },
];

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
    const [open, setOpen] = useState(0);

    return (
        <Page>
            <Seo
                title="Frequently Asked Questions | Culver Realty & Property Management"
                description="Answers about maintenance requests, leasing a property, and paying rent with Culver Realty & Property Management in Ormond Beach, FL."
                jsonLd={FAQ_LD}
            />
            <section className="bg-navy text-bone py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">FAQ</p>
                        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight font-medium">Frequently asked questions</h1>
                        <p className="text-bone/75 mt-5 max-w-xl text-sm md:text-base">
                            Straight answers for tenants, owners, buyers, and sellers. Anything else — we're one call away.
                        </p>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-4xl mx-auto px-4 sm:px-8 py-14 md:py-20" data-testid="faq-list">
                <div className="border-t border-navy/10">
                    {FAQS.map((faq, i) => (
                        <Reveal key={faq.q} delay={i * 0.05}>
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
                                        transition={{ duration: 0.25 }}
                                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 border border-navy/20 text-navy group-hover:border-gold group-hover:text-gold transition-colors"
                                    >
                                        <ChevronDown size={16} />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-base text-slate-600 leading-relaxed pb-7 pr-4 sm:pr-16" data-testid={`faq-answer-${i}`}>
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="mt-14 bg-navy text-bone p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-serif text-2xl font-medium">Still have a question?</h2>
                        <p className="text-sm text-bone/70 mt-2">Our team is happy to help — no online forms required.</p>
                    </div>
                    <a href={BRAND.phoneHref} data-testid="faq-call-button" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px] shrink-0">
                        <Phone size={15} /> Call {BRAND.phone}
                    </a>
                </Reveal>
            </section>
        </Page>
    );
}
