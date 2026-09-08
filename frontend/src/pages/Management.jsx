import { ShieldCheck, Wrench, FileText, Users } from "lucide-react";
import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import InquiryForm from "../components/site/InquiryForm";

const SERVICES = [
    { icon: Users, title: "Tenant screening", copy: "Careful, consistent screening — credit, background, rental history, and income verification — so the right tenants land in your home." },
    { icon: Wrench, title: "Proactive maintenance", copy: "Hands-on, proactive management keeps properties well maintained and small issues from becoming expensive ones." },
    { icon: FileText, title: "Transparent reporting", copy: "Clear statements and honest communication. You'll always know how your property is performing." },
    { icon: ShieldCheck, title: "Owner peace of mind", copy: "We treat your investment home like our own — with professionalism, strong ethics, and a long-term view." },
];

export default function Management() {
    return (
        <Page>
            <Seo
                title="Property Management in Ormond Beach, Volusia & Flagler | Culver Realty"
                description="Hands-on property management: tenant screening, proactive maintenance, and transparent reporting for owners across Volusia and Flagler Counties. Call 386.414.3445."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Property management</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Your investment, managed like it's ours
                        </h1>
                        <p className="text-bone/75 mt-6 max-w-2xl leading-relaxed">
                            Our property management division offers hands-on, proactive management to ensure properties
                            are well maintained, tenants are carefully screened, and owners enjoy peace of mind — all
                            handled with transparency and professionalism.
                        </p>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {SERVICES.map((s, i) => (
                        <Reveal key={s.title} delay={i * 0.06}>
                            <div className="border border-navy/10 bg-white p-8 h-full flex gap-5" data-testid={`management-service-${i}`}>
                                <span className="inline-flex items-center justify-center w-11 h-11 bg-seaglass-muted text-seaglass shrink-0">
                                    <s.icon size={20} />
                                </span>
                                <div>
                                    <h3 className="font-serif text-2xl font-semibold text-navy">{s.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mt-2">{s.copy}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>
            <section className="bg-sand-200 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <Reveal className="lg:col-span-5">
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-navy">
                            Own a rental on the coast?
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
        </Page>
    );
}
