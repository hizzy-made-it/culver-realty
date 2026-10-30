import { Reveal } from "../motion";

/**
 * Always-open question list. Answers stay in the DOM (no accordion) so the hydrated page
 * carries the same text as the server snapshot and the FAQPage JSON-LD.
 */
export default function FaqList({ heading = "Frequently asked questions", faqs = [], testid = "faq-list" }) {
    if (!faqs.length) return null;
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-14 md:py-20" data-testid={testid}>
            <Reveal>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">{heading}</h2>
            </Reveal>
            <dl className="mt-8 border-t border-navy/10">
                {faqs.map((f) => (
                    <div key={f.q} className="border-b border-navy/10 py-6">
                        <dt>
                            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-navy">{f.q}</h3>
                        </dt>
                        <dd className="text-base text-slate-600 leading-relaxed mt-3">{f.a}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
