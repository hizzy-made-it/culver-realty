import { Reveal, StaggerGroup, StaggerItem } from "../motion";

/** A heading, a one-line intro, and numbered steps. Copy comes from content/management.json. */
export default function ServiceSteps({ section, tone = "light" }) {
    const dark = tone === "dark";
    return (
        <section id={section.id} className={dark ? "bg-sand-200" : ""} data-testid={`management-section-${section.id}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Reveal className="lg:col-span-4">
                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">{section.heading}</h2>
                    {section.intro && <p className="text-base text-slate-600 leading-relaxed mt-4">{section.intro}</p>}
                </Reveal>
                <StaggerGroup className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6" stagger={0.05} role="list">
                    {section.steps.map((step, i) => (
                        <StaggerItem key={step.title} className="h-full">
                            <div className="card-hover border border-navy/10 bg-white p-6 h-full" role="listitem">
                                <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold">Step {i + 1}</p>
                                <h3 className="font-serif text-xl font-semibold text-navy mt-2">{step.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mt-2">{step.text}</p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
            </div>
        </section>
    );
}
